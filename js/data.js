// 数据处理模块

// 全局数据缓存
let dataCache = null;
let rawDataCache = null; // 原始数据缓存
let currentTimeRange = '日'; // 默认时间维度

// 解析日期字符串为 Date 对象
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // 支持 YYYY/MM/DD 或 YYYY-MM-DD 格式
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 月份从 0 开始
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
}

// 格式化 Date 对象为字符串
function formatDateStr(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 清除缓存
function clearDataCache() {
    rawDataCache = null;
    dataCache = null;
    console.log('缓存已清除');
}

// 设置当前时间维度
function setTimeRange(range) {
    currentTimeRange = range;
}

// 获取当前时间维度
function getTimeRange() {
    return currentTimeRange;
}

// 从 API 加载数据
function loadExcelData() {
    return new Promise((resolve, reject) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let apiUrl = API_BASE + '/summary_data?latest_date_only=true';

        if (currentTimeRange === '月') {
            // 月视图：加载最近12个月的数据，用于展示月度趋势
            const startDate = new Date(currentYear, currentMonth - 12, 1);
            const monthStart = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
            // 正确计算当前月份的最后一天（使用下个月第0天获取当前月最后一天）
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
            const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
            apiUrl = API_BASE + `/summary_data?date_from=${monthStart}&date_to=${monthEnd}`;
            console.log('月视图：加载最近12个月', monthStart, '至', monthEnd, '数据');
        } else if (currentTimeRange === '年') {
            const yearStart = `${currentYear}-01-01`;
            const yearEnd = `${currentYear}-12-31`;
            apiUrl = API_BASE + `/summary_data?date_from=${yearStart}&date_to=${yearEnd}`;
            console.log('年视图：加载', yearStart, '至', yearEnd, '数据');
        } else {
            // 日视图：加载最近 60 天的数据，确保覆盖图表显示的 30 天范围
            const now = new Date();
            const startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            const endDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            apiUrl = API_BASE + `/summary_data?date_from=${startDateStr}&date_to=${endDateStr}`;
            console.log('日视图（初始加载）：加载最近 60 天数据', startDateStr, '至', endDateStr);
            console.log('当前时间:', now.toISOString(), '60 天前:', startDate.toISOString());
        }
        
        console.log('loadExcelData - API 完整地址：', apiUrl);
        console.log('currentTimeRange:', currentTimeRange);

        // 从 API 加载数据
        fetch(apiUrl)
            .then(response => {
                console.log('API 响应状态:', response.status, response.ok);
                if (!response.ok) {
                    throw new Error('无法读取 API 数据，HTTP 状态码：' + response.status);
                }
                return response.json();
            })
            .then(result => {
                console.log('API 数据加载成功:', result);

                if (!result.success) {
                    throw new Error(result.error || 'API 返回错误');
                }

                const processedData = result.data;
                const latestDate = result.latest_date;

                console.log('处理后的数据条数:', processedData.length);
                console.log('最新有效日期:', latestDate);
                if (processedData.length > 0) {
                    console.log('第一条数据:', processedData[0]);
                }

                // 缓存原始数据
                rawDataCache = processedData;
                
                // 保存原始完整数据到全局缓存（只在首次加载时保存)
                if (!window.originalDataCache || window.originalDataCache.length === 0) {
                    window.originalDataCache = processedData;
                    console.log('保存原始完整数据缓存,数据量:', window.originalDataCache.length);
                    
                    // 检查是否包含 GRID 字段
                    if (window.originalDataCache.length > 0) {
                        const firstItem = window.originalDataCache[0];
                        console.log('第一条数据检查:', {
                            date: firstItem['A'],
                            district: firstItem['J'],
                            grid: firstItem['GRID'],
                            energy: firstItem['AB'],
                            cost: firstItem['AC']
                        });
                    }
                }
                
                // 保存当前使用的数据（用于其他图表）
                window.rawDataCache = processedData;
                console.log('当前数据缓存，数据量:', window.rawDataCache.length);
                console.log('数据示例（前3条):', window.rawDataCache.slice(0, 3).map(item => ({ date: item['A'], energy: item['AB'] })));
                
                // 保存最新日期到全局变量（用于趋势图）
                if (latestDate) {
                    window.latestDate = latestDate;
                    console.log('保存最新日期:', window.latestDate);
                }
                
                // 根据当前时间维度过滤数据
                const filteredData = filterDataByTimeRange(processedData);

                resolve({
                    rawData: processedData,
                    energyData: filteredData,
                    latestDate: latestDate,
                    reportData: {
                        rent: {
                            total: 120,
                            pending: 30,
                            completed: 90
                        },
                        electricity: {
                            total: 150,
                            pending: 45,
                            completed: 105
                        }
                    },
                    trendData: generateTrendData(processedData)
                });
            })
            .catch(error => {
                console.error('API 数据加载失败:', error);
                // 如果加载失败，使用模拟数据
                console.log('使用模拟数据');
                const mockData = generateMockData();
                rawDataCache = mockData.rawData;
                resolve(mockData);
            });
    });
}

// 解析 CSV 文本
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 检测分隔符：制表符或逗号
        const delimiter = line.includes('\t') ? '\t' : ',';
        const row = parseCSVLine(line, delimiter);
        result.push(row);
    }
    
    return result;
}

// 解析单行 CSV
function parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// 处理 Excel 数据（数组格式）
function processExcelDataArray(rows) {
    console.log('处理数组格式数据，共', rows.length, '行');
    
    // 获取表头
    const header = rows[0];
    console.log('表头:', header);
    console.log('表头列数:', header.length);
    
    // 查找关键列的索引
    const columnMap = {};
    header.forEach((col, index) => {
        columnMap[col] = index;
    });
    
    console.log('列映射:', columnMap);
    
    // 查找日期列（A 列）
    const dateColIndex = columnMap['日期'] || columnMap['A'] || 0;
    console.log('日期列索引:', dateColIndex);
    
    // 查找电表列（B 列）
    const meterColIndex = columnMap['电表'] || columnMap['B'] || 1;
    console.log('电表列索引:', meterColIndex);
    
    // 查找用电类型列（K 列）
    const usageTypeColIndex = columnMap['用电类型'] || columnMap['用电方'] || columnMap['K'] || 3;
    console.log('用电类型列索引:', usageTypeColIndex);
    
    // 查找用电属性列（第9列，索引8）
    const usageAttrColIndex = columnMap['用电属性'] || columnMap['I'] || 8;
    console.log('用电属性列索引:', usageAttrColIndex);
    
    // 查找 POI 名称列（L 列）
    const poiColIndex = columnMap['poi名称'] || columnMap['POI名称'] || columnMap['L'] || 11;
    console.log('POI 名称列索引:', poiColIndex);
    
    // 查找度数列（AB 列）
    const energyColIndex = columnMap['度数'] || columnMap['AB'] || 27;
    console.log('度数列索引:', energyColIndex);
    
    // 查找电费列（AC 列）
    const costColIndex = columnMap['电费'] || columnMap['AC'] || 28;
    console.log('电费列索引:', costColIndex);
    
    // 查找归属单元列（J 列，第10列，索引9）
    const districtColIndex = columnMap['归属单元'] || columnMap['J'] || 9;
    console.log('归属单元列索引:', districtColIndex);
    
    // 查找归属网格列（第11列，索引10）
    const gridColIndex = columnMap['归属网格'] || 10;
    console.log('归属网格列索引:', gridColIndex);
    
    // 将数组转换为对象数组
    const objects = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const obj = {};
        // 日期
        if (row[dateColIndex]) obj['A'] = formatDate(row[dateColIndex]);
        // 电表（处理科学计数法）
        if (row[meterColIndex]) {
            let meterValue = row[meterColIndex];
            // 如果是科学计数法，转换为普通数字
            if (typeof meterValue === 'string' && meterValue.includes('E')) {
                meterValue = Number(meterValue).toString();
            }
            obj['B'] = meterValue;
        }
        // 用电类型
        if (row[usageTypeColIndex]) obj['K'] = row[usageTypeColIndex];
        // 用电属性（第9列）
        const attrValue = row[usageAttrColIndex];
        if (attrValue !== undefined && attrValue !== null && attrValue !== '') {
            obj['I'] = String(attrValue).trim();
        }
        // 归属单元（第10列）
        const districtValue = row[districtColIndex];
        if (districtValue !== undefined && districtValue !== null && districtValue !== '') {
            obj['J'] = String(districtValue).trim();
        }
        // 归属网格（第11列）
        const gridValue = row[gridColIndex];
        if (gridValue !== undefined && gridValue !== null && gridValue !== '') {
            obj['GRID'] = String(gridValue).trim();
        }
        // POI 名称
        if (row[poiColIndex]) obj['L'] = row[poiColIndex];
        // 度数
        if (row[energyColIndex] !== undefined && row[energyColIndex] !== null && row[energyColIndex] !== '') {
            obj['AB'] = Number(row[energyColIndex]) || 0;
        }
        // 电费
        if (row[costColIndex] !== undefined && row[costColIndex] !== null && row[costColIndex] !== '') {
            obj['AC'] = Number(row[costColIndex]) || 0;
        }
        
        // 调试：打印前几行数据
        if (i <= 3) {
            console.log('第' + i + '行数据:', {
                日期: obj['A'],
                电表: obj['B'],
                用电类型: obj['K'],
                用电属性: obj['I'],
                归属单元: obj['J'],
                归属网格: obj['GRID'],
                POI: obj['L'],
                度数: obj['AB'],
                电费: obj['AC']
            });
        }
        
        objects.push(obj);
    }
    
    console.log('转换后的对象数组:', objects);
    console.log('第一条数据:', objects[0]);
    
    // 按日期排序
    objects.sort((a, b) => {
        const dateA = new Date(a['A'] || 0);
        const dateB = new Date(b['A'] || 0);
        return dateA - dateB;
    });
    
    // 返回处理后的对象数组
    return objects;
}

// 根据时间维度过滤数据
function filterDataByTimeRange(data) {
    // 始终从当前数据中计算最新日期，不使用 window.latestDate
    // 这样可以避免维度切换时 window.latestDate 被错误修改导致过滤失败
    let latestDateStr = findLatestDate(data);
    
    const latestDate = parseDate(latestDateStr);
    
    // 确定过滤时使用的年份和月份
    let filterYear, filterMonth;
    if (latestDate) {
        filterYear = latestDate.getFullYear();
        filterMonth = latestDate.getMonth() + 1;
    } else {
        const now = new Date();
        filterYear = now.getFullYear();
        filterMonth = now.getMonth() + 1;
    }
    
    console.log('=== 时间维度过滤 ===');
    console.log('当前时间维度:', currentTimeRange);
    console.log('使用最新日期:', latestDateStr);
    console.log('过滤年份:', filterYear, '过滤月份:', filterMonth);
    console.log('输入数据量:', data.length);
    
    if (data.length > 0) {
        console.log('前3条数据示例:', data.slice(0, 3).map(item => ({
            日期: item['A'],
            归属单元: item['J'],
            度数: item['AB'],
            电费: item['AC']
        })));
    }
    
    let filteredData;
    
    if (currentTimeRange === '年') {
        // 年：获取最新日期所在年份的所有数据
        console.log('年过滤：获取', filterYear, '年数据');
        let debugCount = 0;
        filteredData = data.filter(item => {
            const dateStr = getItemDate(item);
            if (!dateStr) return false;
            const date = parseDate(dateStr);
            if (!date) {
                if (debugCount < 3) {
                    console.log('日期解析失败:', dateStr);
                    debugCount++;
                }
                return false;
            }
            const year = date.getFullYear();
            const match = year === filterYear;
            return match;
        });
        console.log('年过滤结果：', filteredData.length, '条');
    } else if (currentTimeRange === '月') {
        // 月：获取最新日期所在月份的数据
        console.log('开始月过滤...');
        let debugCount = 0;
        filteredData = data.filter(item => {
            const dateStr = getItemDate(item);
            if (!dateStr) return false;
            const date = parseDate(dateStr);
            if (!date) {
                console.log('日期解析失败:', dateStr);
                return false;
            }
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const match = year === filterYear && month === filterMonth;
            
            // 调试：打印前 5 条数据的日期信息
            if (debugCount < 5) {
                console.log('日期检查:', dateStr, '→', year + '年' + month + '月', '匹配:', match);
                debugCount++;
            }
            
            return match;
        });
        console.log('月过滤结果：', filteredData.length, '条');
    } else if (currentTimeRange === '日') {
        // 日：获取最新一天的数据
        // 注意：如果数据中没有最新日期的记录，则返回所有数据（用于区域筛选后的情况）
        console.log('最新日期:', latestDateStr);
        
        // 标准化日期格式（将 - 替换为 /，确保格式一致）
        const normalizedLatestDate = latestDateStr ? latestDateStr.replace(/-/g, '/') : null;
        console.log('标准化后的最新日期:', normalizedLatestDate);
        
        filteredData = data.filter(item => {
            const dateStr = getItemDate(item);
            if (!dateStr) return false;
            // 标准化数据中的日期格式后再比较
            const normalizedDateStr = dateStr.replace(/-/g, '/');
            return normalizedDateStr === normalizedLatestDate;
        });
        
        // 如果过滤后数据为空，说明筛选后的数据不包含最新日期
        // 此时返回所有筛选后的数据，而不是空数组
        if (filteredData.length === 0 && data.length > 0) {
            console.warn('筛选后的数据不包含最新日期，返回所有筛选数据');
            const availableDates = [...new Set(data.map(item => getItemDate(item)))].sort();
            console.log('筛选数据中的日期范围:', availableDates);
            console.log('期望的日期格式:', normalizedLatestDate, '实际日期格式示例:', availableDates[0]);
            
            // 尝试从筛选后的数据中找到最新日期
            const latestInFiltered = findLatestDate(data);
            console.log('筛选数据中的最新日期:', latestInFiltered);
            
            if (latestInFiltered) {
                const normalizedLatestInFiltered = latestInFiltered.replace(/-/g, '/');
                filteredData = data.filter(item => {
                    const dateStr = getItemDate(item);
                    if (!dateStr) return false;
                    return dateStr.replace(/-/g, '/') === normalizedLatestInFiltered;
                });
                console.log('使用筛选数据中的最新日期重新过滤，结果:', filteredData.length, '条');
            } else {
                filteredData = data;
            }
        }
    } else {
        // 默认返回所有数据
        filteredData = data;
    }
    
    console.log('时间维度:', currentTimeRange, '过滤后数据:', filteredData.length, '条');
    
    return filteredData;
}

// 格式化日期
function formatDate(date) {
    if (!date) return '';
    
    // 如果是 Date 对象
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 如果是字符串，直接返回
    return String(date);
}

// 获取_item_的日期// 获取项目日期
function getItemDate(item) {
    // 尝试不同的列名
    return item['A'] || item['A 列'] || item['日期'] || item['Date'] || null;
}

// 查找最新日期
function findLatestDate(data) {
    let latestDate = null;
    
    data.forEach(item => {
        const dateStr = getItemDate(item);
        if (dateStr) {
            if (!latestDate || dateStr > latestDate) {
                latestDate = dateStr;
            }
        }
    });
    
    console.log('最新日期:', latestDate);
    return latestDate;
}

// 生成趋势数据
function generateTrendData(data) {
    // 按月汇总电费
    const monthData = {};
    
    data.forEach(item => {
        const dateStr = getItemDate(item);
        if (!dateStr) return;
        
        const date = new Date(dateStr);
        const monthKey = (date.getMonth() + 1) + '月';
        
        const cost = item['AC'] || item['AC 列'] || item['电费'] || 0;
        
        if (monthData[monthKey]) {
            monthData[monthKey] += cost;
        } else {
            monthData[monthKey] = cost;
        }
    });
    
    // 转换为数组
    return Object.entries(monthData).map(([month, cost]) => ({
        month,
        cost
    }));
}

// 生成模拟数据（备用）
function generateMockData() {
    // 生成与API格式一致的模拟数据
    // 日期范围：2026-03-01 到 2026-03-20
    const mockData = [];
    const districts = ['天宁区', '钟楼区', '新北区', '武进区', '经开区'];
    const meters = ['电表1', '电表2', '电表3', '电表4', '电表5'];
    const usageTypes = ['直供电', '转供电'];
    const owners = ['自有', '移动', '铁塔'];
    
    for (let day = 1; day <= 20; day++) {
        for (let i = 0; i < 2; i++) { // 每天每个区县2条记录
            const district = districts[Math.floor(Math.random() * districts.length)];
            const meter = meters[Math.floor(Math.random() * meters.length)];
            const usageType = usageTypes[Math.floor(Math.random() * usageTypes.length)];
            const owner = owners[Math.floor(Math.random() * owners.length)];
            const energy = Math.floor(Math.random() * 1000) + 500; // 500-1500 kWh
            const cost = Math.round(energy * 0.5); // 电费约为能耗的一半
            
            mockData.push({
                'A': `2026-03-${String(day).padStart(2, '0')}`, // 日期
                'AB': energy, // 能耗（度数）
                'AC': cost, // 电费
                'J': district, // 区县
                'B': meter, // 电表
                'K': usageType, // 用电类型
                'I': owner, // 归属
                'overview_poi_count': Math.floor(Math.random() * 50) + 10, // POI数量：10-60
                'overview_device_count': Math.floor(Math.random() * 30) + 5, // 设备数量：5-35
                'mobile_cumulative_energy': Math.random() > 0.5 ? Math.floor(energy * 0.6) : 0,
                'mobile_electricity_fee': Math.random() > 0.5 ? Math.round(cost * 0.6) : 0,
                'tower_cumulative_energy': Math.random() > 0.5 ? Math.floor(energy * 0.4) : 0,
                'tower_electricity_fee': Math.random() > 0.5 ? Math.round(cost * 0.4) : 0,
                'direct_power_supply_energy': Math.random() > 0.5 ? Math.floor(energy * 0.7) : 0,
                'direct_power_supply_cost': Math.random() > 0.5 ? Math.round(cost * 0.7) : 0,
                'indirect_power_supply_energy': Math.random() > 0.5 ? Math.floor(energy * 0.3) : 0,
                'indirect_power_supply_cost': Math.random() > 0.5 ? Math.round(cost * 0.3) : 0,
                'mobile_poi_count': Math.floor(Math.random() * 30) + 5,
                'tower_poi_count': Math.floor(Math.random() * 20) + 3
            });
        }
    }
    
    // 计算总体POI和设备数量（取最新日期的所有记录的汇总值）
    const latestDateRecords = mockData.filter(item => item['A'] === '2026-03-20');
    const totalPoiCount = latestDateRecords.reduce((sum, item) => sum + (item['overview_poi_count'] || 0), 0);
    const totalDeviceCount = latestDateRecords.reduce((sum, item) => sum + (item['overview_device_count'] || 0), 0);
    
    return {
        rawData: mockData,
        energyData: mockData,
        latestDate: '2026-03-20',
        totalPoiCount: totalPoiCount,
        totalDeviceCount: totalDeviceCount,
        reportData: {
            rent: {
                total: 120,
                pending: 30,
                completed: 90
            },
            electricity: {
                total: 150,
                pending: 45,
                completed: 105
            }
        },
        trendData: [
            { month: '1月', cost: 5000, energy: 10000 },
            { month: '2月', cost: 5200, energy: 10400 },
            { month: '3月', cost: 4800, energy: 9600 },
            { month: '4月', cost: 5500, energy: 11000 },
            { month: '5月', cost: 6000, energy: 12000 },
            { month: '6月', cost: 6500, energy: 13000 },
            { month: '7月', cost: 7000, energy: 14000 },
            { month: '8月', cost: 7200, energy: 14400 },
            { month: '9月', cost: 6800, energy: 13600 },
            { month: '10月', cost: 6200, energy: 12400 },
            { month: '11月', cost: 5800, energy: 11600 },
            { month: '12月', cost: 5500, energy: 11000 }
        ]
    };
}

// 处理数据
function processData(data) {
    // 保存原始完整数据到全局缓存（只在首次加载时保存）
    if (!window.originalDataCache || window.originalDataCache.length === 0) {
        window.originalDataCache = data.rawData || [];
        console.log('保存原始完整数据缓存，数据量:', window.originalDataCache.length);
        
        // 检查是否包含 GRID 字段
        if (window.originalDataCache.length > 0) {
            const firstItem = window.originalDataCache[0];
            console.log('第一条数据检查:', {
                date: firstItem['A'],
                district: firstItem['J'],
                grid: firstItem['GRID'],
                energy: firstItem['AB'],
                cost: firstItem['AC']
            });
        }
    }
    
    // 保存当前使用的数据
    window.rawDataCache = data.rawData || [];
    console.log('当前数据缓存，数据量:', window.rawDataCache.length);
    console.log('数据示例（前3条）:', window.rawDataCache.slice(0, 3).map(item => ({ date: item['A'], energy: item['AB'] })));

    // 保存最新日期到全局变量（用于趋势图）
    if (data.latestDate) {
        window.latestDate = data.latestDate;
        console.log('保存最新日期:', window.latestDate);
    }

    // 更新能耗总览
    updateEnergyOverview(data);

    // 更新报账总览
    updateReportOverview(data);

    // 更新图表（使用深拷贝的数据，确保不会被修改）
    const rawDataArray = data.rawData || [];
    console.log('创建深拷贝前，原始数据量:', rawDataArray.length);
    const chartData = {
        energyData: data.energyData,
        rawData: JSON.parse(JSON.stringify(rawDataArray)),
        reportData: data.reportData,
        latestDate: data.latestDate
    };
    console.log('创建深拷贝后，chartData.rawData 量:', chartData.rawData.length);
    updateCharts(chartData);

    // 更新地图
    if (typeof updateMap === 'function') {
        updateMap(chartData);
    }

    // 加载告警和事件信息（异步，不影响主流程）
    loadAlarms();
    loadEvents();
}

// 更新能耗总览
function updateEnergyOverview(data) {
    const energyData = data.energyData;
    const rawData = data.rawData;
    
    console.log('能耗总览数据:', energyData);
    console.log('数据条数:', energyData.length);
    
    // 检查数据是否有效
    if (!energyData || energyData.length === 0) {
        console.warn('能耗数据为空，使用模拟数据');
        document.getElementById('total-energy').textContent = '0';
        document.getElementById('total-cost-display').textContent = '0';
        document.getElementById('total-poi').textContent = '0';
        document.getElementById('total-device').textContent = '0';
        return;
    }
    
    // 计算总体能耗（AB 列度数总和）
    const totalEnergy = energyData.reduce((sum, item) => {
        const value = item['AB'] || item['ab'] || 0;
        return sum + Number(value || 0);
    }, 0);
    console.log('总体能耗:', totalEnergy);
    const roundedEnergy = Math.round(totalEnergy);
    document.getElementById('total-energy').textContent = roundedEnergy.toLocaleString('zh-CN');
    console.log('设置 total-energy 元素文本为:', roundedEnergy.toLocaleString('zh-CN'));
    
    // 计算总体电费（AC 列电费总和）
    const totalCost = energyData.reduce((sum, item) => {
        const value = item['AC'] || item['ac'] || 0;
        return sum + Number(value || 0);
    }, 0);
    console.log('总体电费:', totalCost);
    const roundedCost = Math.round(totalCost);
    document.getElementById('total-cost-display').textContent = roundedCost.toLocaleString('zh-CN');
    console.log('设置 total-cost-display 元素文本为:', roundedCost.toLocaleString('zh-CN'));
    
    // 计算 POI 总数（使用 API 返回的 overview_poi_count）
    // 日维度：对最新日期的所有记录的 overview_poi_count 字段进行求和
    // 月维度和年维度：取第一条记录的值（因为这是汇总数据）
    const timeRange = getTimeRange();
    const overviewCounts = calculateOverviewCountsByTimeRange(energyData, timeRange);
    const totalPoi = overviewCounts.totalPoi;
    console.log('POI 总数 (overview_poi_count):', totalPoi, '时间维度:', timeRange);
    document.getElementById('total-poi').textContent = totalPoi;

    // 计算设备总数（使用 API 返回的 overview_device_count）
    // 日维度：对最新日期的所有记录的 overview_device_count 字段进行求和
    // 月维度和年维度：取第一条记录的值（因为这是汇总数据）
    const totalDevice = overviewCounts.totalDevice;
    console.log('设备总数 (overview_device_count):', totalDevice, '时间维度:', timeRange);
    document.getElementById('total-device').textContent = totalDevice;
    
    // 计算环比数据
    calculateAndDisplayChanges(rawData, totalEnergy, totalCost, totalPoi, totalDevice);
}

function calculateOverviewCountsByTimeRange(energyData, timeRange) {
    if (!Array.isArray(energyData) || energyData.length === 0) {
        return { totalPoi: 0, totalDevice: 0 };
    }

    if (timeRange === '日') {
        const totalPoi = energyData.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
        const totalDevice = energyData.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
        return { totalPoi, totalDevice };
    }

    const latestDate = findLatestDate(energyData);
    if (!latestDate) {
        const totalPoi = energyData.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
        const totalDevice = energyData.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
        return { totalPoi, totalDevice };
    }

    const latestDateNormalized = latestDate.replace(/-/g, '/');
    const latestRows = energyData.filter(item => {
        const itemDate = getItemDate(item);
        return itemDate && itemDate.replace(/-/g, '/') === latestDateNormalized;
    });

    const sourceRows = latestRows.length > 0 ? latestRows : energyData;
    const totalPoi = sourceRows.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
    const totalDevice = sourceRows.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
    return { totalPoi, totalDevice };
}

// 从 API 获取汇总数据（用于快速更新总览数据）
async function fetchSummaryDataFromAPI() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let dateFrom, dateTo;
    
    if (currentTimeRange === '月') {
        dateFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
        dateTo = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    } else if (currentTimeRange === '年') {
        dateFrom = `${currentYear}-01-01`;
        dateTo = `${currentYear}-12-31`;
    } else {
        // 日视图不需要特殊处理
        return null;
    }
    
    try {
        const url = API_BASE + `/summary?date_from=${dateFrom}&date_to=${dateTo}`;
        console.log('从 API 获取汇总数据:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            console.log('汇总数据获取成功:', result);
            return result;
        }
    } catch (error) {
        console.error('获取汇总数据失败:', error);
    }
    
    return null;
}

// 计算并显示环比数据
function calculateAndDisplayChanges(rawData, currentEnergy, currentCost, currentPoi, currentDevice) {
    const timeRange = getTimeRange();
    console.log('当前时间维度:', timeRange);
    
    let previousEnergy = 0;
    let previousCost = 0;
    let previousPoi = 0;
    let previousDevice = 0;

    // 获取完整日期范围数据（用于环比计算）
    const fullDateRangeData = window.originalDataCache || window.rawDataCache || rawData || [];
    console.log('fullDateRangeData 数据条数:', fullDateRangeData.length);
    console.log('rawData 数据条数:', rawData ? rawData.length : 0);
    console.log('window.rawDataCache 数据条数数:', window.rawDataCache ? window.rawDataCache.length : 0);
    console.log('window.originalDataCache 数据条数:', window.originalDataCache ? window.originalDataCache.length : 0);
    
    // 打印 fullDateRangeData 的日期范围
    if (fullDateRangeData.length > 0) {
        const dates = fullDateRangeData.map(item => item['A']).filter(d => d);
        const minDate = dates.reduce((a, b) => a < b ? a : b);
        const maxDate = dates.reduce((a, b) => a > b ? a : b);
        console.log('fullDateRangeData 日期范围:', minDate, '至', maxDate);
    }

    // 获取当前筛选的区域信息
    const currentRegion = currentSelectedDistrict || '';
    const isGridFilter = currentRegion.includes('网格');

    if (timeRange === '年') {
        // 年维度：计算最新日期所在年份与上年的数据对比
        // 找到最新日期
        let latestDate = null;
        let latestDateObj = null;
        
        rawData.forEach(item => {
            const dateStr = item['A'] || '';
            if (dateStr) {
                const dateObj = parseDate(dateStr);
                if (dateObj && (!latestDateObj || dateObj > latestDateObj)) {
                    latestDateObj = dateObj;
                    latestDate = dateStr;
                }
            }
        });
        
        if (!latestDateObj) {
            console.warn('无法找到最新日期');
            return;
        }
        
        const currentYear = latestDateObj.getFullYear();
        const previousYear = currentYear - 1;
        
        console.log('当前年份:', currentYear);
        console.log('上年年份:', previousYear);
        
        const filterByRegion = (data) => {
            if (!isGridFilter) return data;
            return data.filter(item => {
                const grid = item['GRID'] || '';
                return grid.includes(currentRegion.replace(/网格/g, '')) || grid.includes(currentRegion);
            });
        };

        const currentYearData = filterByRegion(rawData.filter(item => {
            const dateStr = item['A'] || '';
            return dateStr.startsWith(String(currentYear));
        }));

        const previousYearData = filterByRegion(fullDateRangeData.filter(item => {
            const dateStr = item['A'] || '';
            return dateStr.startsWith(String(previousYear));
        }));

        console.log(`${currentYear}年数据条数:`, currentYearData.length, `${previousYear}年数据条数:`, previousYearData.length);

        previousEnergy = previousYearData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        previousCost = previousYearData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        
        // POI 和设备数量是汇总值，不应该累加，应该取第一条记录的值
        if (previousYearData.length > 0) {
            previousPoi = Number(previousYearData[0]['overview_poi_count'] || 0);
            previousDevice = Number(previousYearData[0]['overview_device_count'] || 0);
        } else {
            previousPoi = 0;
            previousDevice = 0;
        }

    } else if (timeRange === '月') {
        // 月维度：计算当月1日到最新日期的累计 vs 上月1日到上月对应日期的累计
        // 例如：3月1日-3月20日 vs 2月1日-2月20日
        // 找到最新日期
        let latestDate = null;
        let latestDateObj = null;
        
        rawData.forEach(item => {
            const dateStr = item['A'] || '';
            if (dateStr) {
                const dateObj = parseDate(dateStr);
                if (dateObj && (!latestDateObj || dateObj > latestDateObj)) {
                    latestDateObj = dateObj;
                    latestDate = dateStr;
                }
            }
        });
        
        if (!latestDateObj) {
            console.warn('无法找到最新日期');
            return;
        }
        
        const currentYear = latestDateObj.getFullYear();
        const currentMonth = latestDateObj.getMonth() + 1;
        const currentDay = latestDateObj.getDate();
        
        // 计算上月对应日期
        const previousMonthDate = new Date(latestDateObj);
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const previousYear = previousMonthDate.getFullYear();
        const previousMonth = previousMonthDate.getMonth() + 1;
        const previousDay = Math.min(currentDay, new Date(previousYear, previousMonth, 0).getDate());
        
        console.log('月维度环比：当月累计 vs 上月同期累计');
        console.log('当月范围:', currentYear + '年' + String(currentMonth).padStart(2, '0') + '月01日 至 ' + currentYear + '年' + String(currentMonth).padStart(2, '0') + '月' + String(currentDay).padStart(2, '0') + '日');
        console.log('上月同期范围:', previousYear + '年' + String(previousMonth).padStart(2, '0') + '月01日 至 ' + previousYear + '年' + String(previousMonth).padStart(2, '0') + '月' + String(previousDay).padStart(2, '0') + '日');
        console.log('当前区域筛选:', currentRegion);
        
        if (rawData.length > 0) {
            const sample = rawData[0];
            console.log('rawData 示例数据:', {
                date: sample['A'],
                district: sample['J'],
                grid: sample['GRID'],
                energy: sample['AB']
            });
        }
        
        const filterByRegion = (data) => {
            if (!currentRegion) return data;
            const filtered = data.filter(item => {
                const grid = item['GRID'] || '';
                const district = item['J'] || '';
                const match = grid.includes(currentRegion.replace(/网格/g, '')) || 
                             grid.includes(currentRegion) ||
                             district.includes(currentRegion);
                return match;
            });
            console.log('filterByRegion 结果:', '输入', data.length, '条', '输出', filtered.length, '条');
            return filtered;
        };

        // 获取当月1日到最新日期的累计数据
        // 使用 fullDateRangeData 而不是 rawData，确保包含完整数据
        const currentMonthCumulativeData = filterByRegion(fullDateRangeData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && 
                   dateObj.getFullYear() === currentYear && 
                   (dateObj.getMonth() + 1) === currentMonth &&
                   dateObj.getDate() <= currentDay;
        }));

        // 获取上月1日到上月对应日期的累计数据
        const previousPeriodData = filterByRegion(fullDateRangeData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && 
                   dateObj.getFullYear() === previousYear && 
                   (dateObj.getMonth() + 1) === previousMonth &&
                   dateObj.getDate() <= previousDay;
        }));

        console.log('当月累计数据条数:', currentMonthCumulativeData.length, '上月同期累计数据条数:', previousPeriodData.length);

        // 计算当期值：当月1日到最新日期的累计
        currentEnergy = currentMonthCumulativeData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        currentCost = currentMonthCumulativeData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        
        // 当期 POI 和设备数量：取最新日期的汇总值
        if (currentMonthCumulativeData.length > 0) {
            const latestDateRecords = currentMonthCumulativeData.filter(item => {
                return item['A'] === latestDate;
            });
            currentPoi = latestDateRecords.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
            currentDevice = latestDateRecords.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
        } else {
            currentPoi = 0;
            currentDevice = 0;
        }
        
        // 计算上期值：上月1日到上月对应日期的累计
        previousEnergy = previousPeriodData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        previousCost = previousPeriodData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        
        // 上期 POI 和设备数量：取上月对应日期的汇总值
        if (previousPeriodData.length > 0) {
            // 找到上月数据中的最大日期（不超过对应日期）
            let maxPreviousDate = null;
            previousPeriodData.forEach(item => {
                const dateStr = item['A'] || '';
                if (dateStr && (!maxPreviousDate || dateStr > maxPreviousDate)) {
                    maxPreviousDate = dateStr;
                }
            });
            
            if (maxPreviousDate) {
                const maxDateRecords = previousPeriodData.filter(item => {
                    return item['A'] === maxPreviousDate;
                });
                previousPoi = maxDateRecords.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
                previousDevice = maxDateRecords.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
            } else {
                previousPoi = 0;
                previousDevice = 0;
            }
        } else {
            previousPoi = 0;
            previousDevice = 0;
        }
        
        console.log('当月累计能耗:', currentEnergy, '上月同期累计能耗:', previousEnergy);
        console.log('当月累计电费:', currentCost, '上月同期累计电费:', previousCost);
        console.log('当月 POI:', currentPoi, '上月同期 POI:', previousPoi);
        console.log('当月设备:', currentDevice, '上月同期设备:', previousDevice);

    } else if (timeRange === '日') {
        // 日维度：计算当日值 vs 上月当日值（单日对比单日）
        // 找到最新日期
        let latestDate = null;
        let latestDateObj = null;

        if (!rawData || !Array.isArray(rawData)) {
            console.warn('rawData 不存在或不是数组');
            return;
        }

        rawData.forEach(item => {
            const dateStr = item['A'] || '';
            if (dateStr) {
                const dateObj = parseDate(dateStr);
                if (dateObj && (!latestDateObj || dateObj > latestDateObj)) {
                    latestDateObj = dateObj;
                    latestDate = dateStr;
                }
            }
        });

        if (latestDate && latestDateObj) {
            console.log('最新日期:', latestDate);

            // 获取当前年月日
            const currentYear = latestDateObj.getFullYear();
            const currentMonth = latestDateObj.getMonth() + 1;
            const currentDay = latestDateObj.getDate();

            // 计算上月对应日期
            const previousMonthDate = new Date(latestDateObj);
            previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
            const previousYear = previousMonthDate.getFullYear();
            const previousMonth = previousMonthDate.getMonth() + 1;
            const previousDay = Math.min(currentDay, new Date(previousYear, previousMonth, 0).getDate());

            const previousDayStr = `${previousYear}-${String(previousMonth).padStart(2, '0')}-${String(previousDay).padStart(2, '0')}`;
            
            console.log('日维度环比：当日 vs 上月当日');
            console.log('当日:', latestDate);
            console.log('上月当日:', previousDayStr);

            // 获取当日数据
            const currentDayData = fullDateRangeData.filter(item => {
                const dateStr = item['A'] || '';
                const grid = item['GRID'] || '';
                const district = item['J'] || '';
                
                const dateMatch = dateStr === latestDate;
                
                // 检查是否匹配区域（区县或网格）
                const regionMatch = !currentRegion || 
                                   grid.includes(currentRegion.replace(/网格/g, '')) || 
                                   grid.includes(currentRegion) ||
                                   district.includes(currentRegion);
                
                return dateMatch && regionMatch;
            });

            // 获取上月当日数据
            const previousDayData = fullDateRangeData.filter(item => {
                const dateStr = item['A'] || '';
                const grid = item['GRID'] || '';
                const district = item['J'] || '';
                
                const dateMatch = dateStr === previousDayStr;
                
                // 检查是否匹配区域（区县或网格）
                const regionMatch = !currentRegion || 
                                   grid.includes(currentRegion.replace(/网格/g, '')) || 
                                   grid.includes(currentRegion) ||
                                   district.includes(currentRegion);
                
                return dateMatch && regionMatch;
            });

            console.log('当日数据条数:', currentDayData.length);
            console.log('上月当日数据条数:', previousDayData.length);

            // 计算当日值
            currentEnergy = currentDayData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
            currentCost = currentDayData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
            
            // 当日 POI 和设备数量
            currentPoi = currentDayData.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
            currentDevice = currentDayData.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
            
            // 计算上月当日值
            previousEnergy = previousDayData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
            previousCost = previousDayData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
            
            // 上月当日 POI 和设备数量
            previousPoi = previousDayData.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
            previousDevice = previousDayData.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);
            
            console.log('当期能耗:', currentEnergy, '上期能耗:', previousEnergy);
            console.log('当期电费:', currentCost, '上期电费:', previousCost);
            console.log('当期 POI:', currentPoi, '上期 POI:', previousPoi);
            console.log('当期设备:', currentDevice, '上期设备:', previousDevice);
        }
    }
    
    console.log('上期能耗:', previousEnergy, '本期能耗:', currentEnergy);
    console.log('上期电费:', previousCost, '本期电费:', currentCost);
    console.log('上期POI:', previousPoi, '本期POI:', currentPoi);
    console.log('上期设备:', previousDevice, '本期设备:', currentDevice);
    
    // 计算环比百分比
    const energyChange = calculateChangePercent(currentEnergy, previousEnergy);
    const costChange = calculateChangePercent(currentCost, previousCost);
    const poiChange = calculateChangePercent(currentPoi, previousPoi);
    const deviceChange = calculateChangePercent(currentDevice, previousDevice);
    
    console.log('=== 环比计算结果 ===');
    console.log('能耗环比:', energyChange, '类型:', typeof energyChange);
    console.log('电费环比:', costChange, '类型:', typeof costChange);
    console.log('POI环比:', poiChange, '类型:', typeof poiChange);
    console.log('设备环比:', deviceChange, '类型:', typeof deviceChange);
    
    // 测试手动计算
    if (previousEnergy > 0) {
        const manualEnergyChange = ((currentEnergy - previousEnergy) / previousEnergy * 100).toFixed(2);
        console.log('手动计算能耗环比:', manualEnergyChange);
    }
    
    // 更新显示
    updateChangeDisplay('energy-change', energyChange);
    updateChangeDisplay('cost-change', costChange);
    updateChangeDisplay('poi-change', poiChange);
    updateChangeDisplay('device-change', deviceChange);
}

// 计算变化百分比
function calculateChangePercent(current, previous) {
    console.log('calculateChangePercent 被调用，current:', current, '类型:', typeof current, 'previous:', previous, '类型:', typeof previous);
    
    if (previous === 0 || previous === null || previous === undefined || isNaN(previous)) {
        console.log('返回 null，因为 previous 无效');
        return null; // 没有上期数据，返回 null
    }
    
    const change = (current - previous) / previous * 100;
    const result = change.toFixed(2);
    console.log('计算结果:', result);
    return result;
}

// 更新环比显示
function updateChangeDisplay(elementId, changePercent) {
    const element = document.getElementById(elementId);
    if (element) {
        if (changePercent === null) {
            element.textContent = '--';
            element.className = 'metric-change';
        } else {
            const sign = changePercent >= 0 ? '+' : '';
            element.textContent = sign + changePercent + '%';
            
            // 根据环比数值设置颜色类
            let colorClass;
            if (changePercent < 0) {
                colorClass = 'negative'; // 绿色 - 下降
            } else if (changePercent > 20) {
                colorClass = 'positive'; // 红色 - 增长超过 20%
            } else {
                colorClass = 'neutral'; // 橙色 - 增长 0% - 20%
            }
            
            element.className = 'metric-change ' + colorClass;
        }
    }
}

// 更新报账总览
function updateReportOverview(data) {
    const reportData = data.reportData;
    
    // 租费数据
    document.getElementById('rent-total').textContent = reportData.rent.total;
    document.getElementById('rent-pending').textContent = reportData.rent.pending;
    document.getElementById('rent-completed').textContent = reportData.rent.completed;
    
    // 租费完成率
    const rentCompletionRate = (reportData.rent.completed / reportData.rent.total) * 100;
    document.getElementById('rent-progress').style.width = `${rentCompletionRate}%`;
    
    // 电费数据
    document.getElementById('electricity-total').textContent = reportData.electricity.total;
    document.getElementById('electricity-pending').textContent = reportData.electricity.pending;
    document.getElementById('electricity-completed').textContent = reportData.electricity.completed;
    
    // 电费完成率
    const electricityCompletionRate = (reportData.electricity.completed / reportData.electricity.total) * 100;
    document.getElementById('electricity-progress').style.width = `${electricityCompletionRate}%`;
}

// 更新图表
function updateCharts(data) {
    // 更新用电方分类饼图（移动/铁塔）
    if (typeof updateConsumerTypeChart === 'function') {
        updateConsumerTypeChart(data);
    }

    // 更新 POI 分项统计图表
    updatePoiChart(data);

    // 更新用电类型统计图表
    updateElectricityTypeChart(data);

    // 更新能耗趋势图
    updateEnergyTrendChart(data);

    // 更新地图
    updateMap(data);
}

// 导出数据处理函数
window.loadExcelData = loadExcelData;
window.processData = processData;
window.setTimeRange = setTimeRange;
window.getTimeRange = getTimeRange;
window.generateMockData = generateMockData;
window.clearDataCache = clearDataCache;
window.filterDataByTimeRange = filterDataByTimeRange;
window.generateTrendData = generateTrendData;
window.calculateOverviewCountsByTimeRange = calculateOverviewCountsByTimeRange;
window.calculateAndDisplayChanges = calculateAndDisplayChanges;
