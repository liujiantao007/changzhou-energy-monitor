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

// 加载 Excel 数据
function loadExcelData() {
    return new Promise((resolve, reject) => {
        // 检查缓存，如果存在则直接使用缓存数据
        if (rawDataCache) {
            console.log('使用缓存数据，不重新加载');
            // 根据当前时间维度过滤数据
            const filteredData = filterDataByTimeRange(rawDataCache);
            
            resolve({
                rawData: rawDataCache,
                energyData: filteredData,
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
                trendData: generateTrendData(rawDataCache)
            });
            return;
        }
        
        // 使用 SheetJS 读取 Excel 文件
        console.log('开始加载 CSV 数据...');
        console.log('CSV 文件路径：data/data.csv');
        
        fetch('data/data.csv')
            .then(response => {
                console.log('CSV 文件响应状态:', response.status, response.ok);
                if (!response.ok) {
                    throw new Error('无法读取 CSV 文件，HTTP 状态码：' + response.status);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                console.log('CSV 文件读取成功，数据大小:', data.byteLength, 'bytes');
                // 尝试多种编码方式解码
                let text;
                let usedEncoding = '';
                
                // 首先尝试 UTF-8 编码
                const utf8Decoder = new TextDecoder('utf-8');
                const utf8Text = utf8Decoder.decode(data);
                
                // 检查UTF-8解码后是否包含乱码特征
                // 乱码特征：连续的替换字符或不可读字符
                const hasGarbledChars = /锘|娴|犲|姝|腑|浜|姣|瓒|妤|瀛|甯|€|鍒|鍒|鍒|鍒/.test(utf8Text);
                
                if (hasGarbledChars) {
                    // UTF-8解码后包含乱码，尝试GBK
                    console.log('UTF-8 解码后检测到乱码，尝试 GBK 编码');
                    const gbkDecoder = new TextDecoder('gbk');
                    text = gbkDecoder.decode(data);
                    usedEncoding = 'GBK';
                } else {
                    text = utf8Text;
                    usedEncoding = 'UTF-8';
                }
                
                console.log('使用编码:', usedEncoding);
                console.log('CSV 文本内容（前 500 字符）:', text.substring(0, 500));
                
                // 解析 CSV 数据
                const jsonData = parseCSV(text);
                
                console.log('CSV 数据加载成功，共', jsonData.length, '行');
                console.log('表头:', jsonData[0]);
                console.log('第一行数据:', jsonData[1]);
                
                // 处理数据（将数组转换为对象）
                const processedData = processExcelDataArray(jsonData);
                
                // 缓存原始数据
                rawDataCache = processedData;
                
                // 根据当前时间维度过滤数据
                const filteredData = filterDataByTimeRange(processedData);
                
                resolve({
                    rawData: processedData,
                    energyData: filteredData,
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
                console.error('CSV 数据加载失败:', error);
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
    const now = new Date();
    const currentYear = now.getFullYear(); // 2026
    const currentMonth = now.getMonth() + 1; // 3
    
    console.log('=== 时间维度过滤 ===');
    console.log('当前时间维度:', currentTimeRange);
    console.log('当前年份:', currentYear, '当前月份:', currentMonth);
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
        // 年：获取 2026 年所有数据
        console.log('年过滤：获取', currentYear, '年数据');
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
            const match = year === currentYear;
            return match;
        });
        console.log('年过滤结果：', filteredData.length, '条');
    } else if (currentTimeRange === '月') {
        // 月：获取 2026 年 3 月数据
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
            const match = year === currentYear && month === currentMonth;
            
            // 调试：打印前 5 条数据的日期信息
            if (debugCount < 5) {
                console.log('日期检查:', dateStr, '→', year + '年' + month + '月', '匹配:', match);
                debugCount++;
            }
            
            return match;
        });
        console.log('月过滤结果：', filteredData.length, '条');
    } else if (currentTimeRange === '日') {
        // 日：获取最新一天的数据（2026 年 3 月 6 日）
        // 先找到最新的日期
        const latestDate = findLatestDate(data);
        console.log('最新日期:', latestDate);
        filteredData = data.filter(item => {
            const dateStr = getItemDate(item);
            if (!dateStr) return false;
            return dateStr === latestDate;
        });
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

// 解析日期字符串为 Date 对象
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // 处理 2026/3/1 格式
    if (typeof dateStr === 'string') {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 月份从 0 开始
            const day = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        // 尝试直接解析
        return new Date(dateStr);
    }
    
    if (dateStr instanceof Date) {
        return dateStr;
    }
    
    return null;
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
    return {
        energyData: [
            { ab: 1200, ac: 600, l: '天宁区', b: '电表 1', type: '直供电' },
            { ab: 800, ac: 400, l: '天宁区', b: '电表 2', type: '转供电' },
            { ab: 1500, ac: 750, l: '钟楼区', b: '电表 3', type: '直供电' },
            { ab: 900, ac: 450, l: '钟楼区', b: '电表 4', type: '新能源' },
            { ab: 1800, ac: 900, l: '新北区', b: '电表 5', type: '直供电' },
            { ab: 1100, ac: 550, l: '新北区', b: '电表 6', type: '转供电' },
            { ab: 1300, ac: 650, l: '武进区', b: '电表 7', type: '直供电' },
            { ab: 700, ac: 350, l: '武进区', b: '电表 8', type: '新能源' },
            { ab: 1600, ac: 800, l: '经开区', b: '电表 9', type: '直供电' },
            { ab: 1000, ac: 500, l: '经开区', b: '电表 10', type: '转供电' }
        ],
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
            { month: '1 月', cost: 5000 },
            { month: '2 月', cost: 5200 },
            { month: '3 月', cost: 4800 },
            { month: '4 月', cost: 5500 },
            { month: '5 月', cost: 6000 },
            { month: '6 月', cost: 6500 },
            { month: '7 月', cost: 7000 },
            { month: '8 月', cost: 7200 },
            { month: '9 月', cost: 6800 },
            { month: '10 月', cost: 6200 },
            { month: '11 月', cost: 5800 },
            { month: '12 月', cost: 5500 }
        ]
    };
}

// 处理数据
function processData(data) {
    // 保存原始完整数据到全局缓存（只在首次加载时保存）
    if (!window.originalDataCache || window.originalDataCache.length === 0) {
        window.originalDataCache = data.rawData || [];
        console.log('保存原始完整数据缓存，数据量:', window.originalDataCache.length);
    }
    
    // 保存当前使用的数据
    window.rawDataCache = data.rawData || [];
    console.log('当前数据缓存，数据量:', window.rawDataCache.length);
    
    // 更新能耗总览
    updateEnergyOverview(data);
    
    // 更新报账总览
    updateReportOverview(data);
    
    // 更新图表
    updateCharts(data);
    
    // 加载告警和事件信息
    loadAlarms();
    loadEvents();
}

// 更新能耗总览
function updateEnergyOverview(data) {
    const energyData = data.energyData;
    const rawData = data.rawData;
    
    console.log('能耗总览数据:', energyData);
    console.log('数据条数:', energyData.length);
    
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
    
    // 计算 POI 总数（L 列去重）
    const poiValues = energyData.map(item => item['L'] || item['l'] || '').filter(v => v !== '');
    const poiSet = new Set(poiValues);
    const totalPoi = poiSet.size;
    console.log('POI 列表:', poiValues, '去重后:', totalPoi);
    document.getElementById('total-poi').textContent = totalPoi;
    
    // 计算设备总数（B 列去重）
    const deviceValues = energyData.map(item => item['B'] || item['b'] || '').filter(v => v !== '');
    const deviceSet = new Set(deviceValues);
    const totalDevice = deviceSet.size;
    console.log('设备列表:', deviceValues, '去重后:', totalDevice);
    document.getElementById('total-device').textContent = totalDevice;
    
    // 计算环比数据
    calculateAndDisplayChanges(rawData, totalEnergy, totalCost, totalPoi, totalDevice);
}

// 计算并显示环比数据
function calculateAndDisplayChanges(rawData, currentEnergy, currentCost, currentPoi, currentDevice) {
    const timeRange = getTimeRange();
    console.log('当前时间维度:', timeRange);
    
    let previousEnergy = 0;
    let previousCost = 0;
    let previousPoi = 0;
    let previousDevice = 0;
    
    if (timeRange === '年') {
        // 年维度：计算2026年与2025年的数据对比
        const currentYearData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            return dateStr.startsWith('2026');
        });
        
        const previousYearData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            return dateStr.startsWith('2025');
        });
        
        previousEnergy = previousYearData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        previousCost = previousYearData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        previousPoi = new Set(previousYearData.map(item => item['L'] || item['l'] || '').filter(v => v !== '')).size;
        previousDevice = new Set(previousYearData.map(item => item['B'] || item['b'] || '').filter(v => v !== '')).size;
        
    } else if (timeRange === '月') {
        // 月维度：计算2026年3月与2026年2月的数据对比
        const currentMonthData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && dateObj.getFullYear() === 2026 && (dateObj.getMonth() + 1) === 3;
        });
        
        const previousMonthData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && dateObj.getFullYear() === 2026 && (dateObj.getMonth() + 1) === 2;
        });
        
        console.log('3 月数据条数:', currentMonthData.length, '2 月数据条数:', previousMonthData.length);
        
        previousEnergy = previousMonthData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        previousCost = previousMonthData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        previousPoi = new Set(previousMonthData.map(item => item['L'] || item['l'] || '').filter(v => v !== '')).size;
        previousDevice = new Set(previousMonthData.map(item => item['B'] || item['b'] || '').filter(v => v !== '')).size;
        
    } else if (timeRange === '年') {
        // 年维度：计算 2026 年与 2025 年的数据对比
        const currentYearData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && dateObj.getFullYear() === 2026;
        });
        
        const previousYearData = rawData.filter(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            return dateObj && dateObj.getFullYear() === 2025;
        });
        
        console.log('2026 年数据条数:', currentYearData.length, '2025 年数据条数:', previousYearData.length);
        
        previousEnergy = previousYearData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
        previousCost = previousYearData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
        previousPoi = new Set(previousYearData.map(item => item['L'] || item['l'] || '').filter(v => v !== '')).size;
        previousDevice = new Set(previousYearData.map(item => item['B'] || item['b'] || '').filter(v => v !== '')).size;
    } else if (timeRange === '日') {
        // 日维度：计算当月累计与上月同期的数据对比
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
        
        if (latestDate && latestDateObj) {
            console.log('最新日期:', latestDate);
            
            // 获取当前年月日
            const currentYear = latestDateObj.getFullYear();
            const currentMonth = latestDateObj.getMonth() + 1;
            const currentDay = latestDateObj.getDate();
            
            // 计算上月
            const previousMonthDate = new Date(latestDateObj);
            previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
            const previousYear = previousMonthDate.getFullYear();
            const previousMonth = previousMonthDate.getMonth() + 1;
            
            console.log('对比年月:', previousYear + '/' + previousMonth);
            
            // 获取当月截至最新日期的数据（3 月 1 日 -3 月 8 日）
            const currentStartDate = new Date(currentYear, currentMonth - 1, 1);
            const currentDayData = rawData.filter(item => {
                const dateStr = item['A'] || '';
                const dateObj = parseDate(dateStr);
                return dateObj && dateObj >= currentStartDate && dateObj <= latestDateObj;
            });
            
            // 获取上月同期的数据（2 月 1 日 -2 月 8 日）
            const previousStartDate = new Date(previousYear, previousMonth - 1, 1);
            const previousEndDate = new Date(previousYear, previousMonth - 1, currentDay);
            const previousDayData = rawData.filter(item => {
                const dateStr = item['A'] || '';
                const dateObj = parseDate(dateStr);
                return dateObj && dateObj >= previousStartDate && dateObj <= previousEndDate;
            });
            
            console.log('当月数据范围:', formatDateStr(currentStartDate), '至', latestDate, '条数:', currentDayData.length);
            console.log('上月同期数据范围:', formatDateStr(previousStartDate), '至', formatDateStr(previousEndDate), '条数:', previousDayData.length);
            
            // 显示上月同期的日期分布
            const previousDates = previousDayData.map(item => item['A']).filter(Boolean);
            const uniquePreviousDates = [...new Set(previousDates)].sort();
            console.log('上月同期包含的日期:', uniquePreviousDates);
            
            previousEnergy = previousDayData.reduce((sum, item) => sum + Number(item['AB'] || item['ab'] || 0), 0);
            previousCost = previousDayData.reduce((sum, item) => sum + Number(item['AC'] || item['ac'] || 0), 0);
            previousPoi = new Set(previousDayData.map(item => item['L'] || item['l'] || '').filter(v => v !== '')).size;
            previousDevice = new Set(previousDayData.map(item => item['B'] || item['b'] || '').filter(v => v !== '')).size;
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
    
    // 更新显示
    updateChangeDisplay('energy-change', energyChange);
    updateChangeDisplay('cost-change', costChange);
    updateChangeDisplay('poi-change', poiChange);
    updateChangeDisplay('device-change', deviceChange);
}

// 计算变化百分比
function calculateChangePercent(current, previous) {
    if (previous === 0 || previous === null || previous === undefined) {
        return null; // 没有上期数据，返回 null
    }
    return ((current - previous) / previous * 100).toFixed(2);
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
    // 更新用电量分项统计图表
    updateElectricityChart(data);
    
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
