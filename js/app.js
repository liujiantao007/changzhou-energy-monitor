// 应用主逻辑

// 页面加载完成后执行
window.onload = function() {
    // 初始化响应式缩放
    initResponsiveScale();
    
    // 初始化页面导航
    initNavigation();
    
    // 初始化时间选择器
    initTimeSelectors();
    
    // 初始化刷新按钮
    initRefreshButtons();
    
    // 初始化图表
    initCharts();
    
    // 初始化地图
    initMap();
    
    // 加载数据
    loadData();
};

// 初始化响应式缩放
function initResponsiveScale() {
    function resize() {
        const app = document.getElementById('app');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 预留底部空间（窗口高度的2%）
        const bottomMargin = windowHeight * 0.02;
        const availableHeight = windowHeight - bottomMargin;
        
        // 计算宽度和高度的比例
        const scaleX = windowWidth / 1920;
        const scaleY = availableHeight / 1080;
        
        // 选择较小的比例，确保内容完整显示
        const scale = Math.min(scaleX, scaleY);
        
        // 计算居中偏移量（水平方向居中，垂直方向从顶部开始）
        const scaledWidth = 1920 * scale;
        const scaledHeight = 1080 * scale;
        const offsetX = (windowWidth - scaledWidth) / 2;
        const offsetY = 0; // 顶部对齐，留出底部空间
        
        // 应用缩放和定位
        app.style.transform = `scale(${scale})`;
        app.style.transformOrigin = 'top left';
        app.style.width = '1920px';
        app.style.height = '1080px';
        app.style.position = 'absolute';
        app.style.left = offsetX + 'px';
        app.style.top = offsetY + 'px';
        app.style.margin = '0';
        
        console.log('窗口尺寸:', windowWidth, 'x', windowHeight);
        console.log('预留底部空间:', bottomMargin.toFixed(2), 'px (2%)');
        console.log('可用高度:', availableHeight.toFixed(2), 'px');
        console.log('缩放比例:', scale.toFixed(4), '(宽度比例:', scaleX.toFixed(4), ', 高度比例:', scaleY.toFixed(4) + ')');
        console.log('偏移量:', offsetX.toFixed(2), 'x', offsetY);
        
        // 刷新图表尺寸
        setTimeout(() => {
            if (typeof charts !== 'undefined') {
                Object.values(charts).forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                    }
                });
            }
        }, 100);
    }
    
    // 初始缩放
    resize();
    
    // 窗口大小变化时重新缩放
    window.addEventListener('resize', resize);
}

// 初始化页面导航
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    // 导航点击事件
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有导航项的 active 类
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 添加当前导航项的 active 类
            this.classList.add('active');
            
            // 隐藏所有页面
            pages.forEach(page => page.classList.remove('active'));
            
            // 显示对应页面
            const targetId = this.getAttribute('href').substring(1);
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // 如果是能耗分析页面，加载 iframe
                if (targetId === '能耗分析') {
                    loadEnergyAnalysisFrame();
                }
            }
        });
    });
    
    // 处理URL哈希变化
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1) || 'home';
        
        // 激活对应导航项
        navItems.forEach(item => {
            const href = item.getAttribute('href').substring(1);
            if (href === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 显示对应页面
        pages.forEach(page => {
            if (page.id === hash) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
    });
}

// 加载能耗分析 iframe
function loadEnergyAnalysisFrame() {
    console.log('loadEnergyAnalysisFrame 被调用');
    
    // 延迟一点执行，确保 DOM 已完全准备好
    setTimeout(() => {
        const iframe = document.getElementById('energy-analysis-frame');
        const loadingDiv = document.getElementById('energy-iframe-loading');
        const targetUrl = 'http://10.38.78.217:8516/';
        
        if (!iframe) {
            console.error('未找到 iframe 元素');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<p style="color: #f44336; font-size: 16px; text-align: center;">页面加载错误</p>';
            }
            return;
        }
        
        console.log('iframe 元素找到，current src:', iframe.src);
        
        // 如果已经加载过，不再重复加载
        if (iframe.src && iframe.src !== '' && iframe.src !== 'about:blank' && iframe.src.indexOf('10.38.78.217') > -1) {
            console.log('能耗分析 iframe 已加载，src:', iframe.src);
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            return;
        }
        
        console.log('开始加载能耗分析 iframe:', targetUrl);
        
        // 显示加载状态
        if (loadingDiv) {
            loadingDiv.style.display = 'flex';
            console.log('显示加载提示');
        }
        
        // 先设置 onload 和 onerror，再设置 src
        iframe.onload = function() {
            console.log('能耗分析 iframe 加载完成');
            if (loadingDiv) {
                setTimeout(() => {
                    loadingDiv.style.display = 'none';
                }, 500);
            }
        };
        
        iframe.onerror = function() {
            console.error('能耗分析 iframe 加载失败');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<p style="color: #f44336; font-size: 16px; text-align: center;">加载失败，可能是网络问题或跨域限制</p>';
            }
        };
        
        // 设置 iframe 源
        iframe.src = targetUrl;
        console.log('iframe src 已设置为:', targetUrl);
        
        // 设置超时处理（15 秒）
        setTimeout(() => {
            if (loadingDiv && loadingDiv.style.display !== 'none') {
                console.warn('能耗分析 iframe 加载超时');
                loadingDiv.innerHTML = '<p style="color: #ff9800; font-size: 16px; text-align: center;">加载时间较长，请耐心等待<br><button onclick="location.reload()" style="margin-top:10px;padding:5px 15px;cursor:pointer;">刷新页面</button></p>';
            }
        }, 15000);
    }, 100); // 延迟 100ms 确保 DOM 准备好
}

// 初始化时间选择器
function initTimeSelectors() {
    const timeBtns = document.querySelectorAll('.time-btn');
    
    timeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 获取点击的时间维度
            const timeRange = this.textContent;
            
            console.log('时间维度切换为:', timeRange);
            
            // 同步更新所有时间选择器的按钮状态
            const allTimeBtns = document.querySelectorAll('.time-btn');
            allTimeBtns.forEach(btn => {
                if (btn.textContent === timeRange) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // 获取父元素，判断是哪个时间选择器
            const parent = this.closest('.time-selector');
            const parentId = parent ? parent.id : '';
            
            // 如果是能耗趋势图的时间选择器，只更新能耗趋势图
            if (parentId === 'trend-time-selector') {
                // 更新能耗趋势图
                if (typeof updateEnergyTrendChart === 'function') {
                    const cachedData = {
                        rawData: window.originalDataCache || window.rawDataCache || []
                    };
                    updateEnergyTrendChart(cachedData, timeRange);
                }
                return;  // 不继续执行后面的逻辑
            }
            
            // 设置时间维度
            if (typeof setTimeRange === 'function') {
                setTimeRange(timeRange);
            }
            
            // 重新过滤数据（保持当前区域选择）
            reloadDataWithoutLoading();
            
            // 同时更新能耗趋势图
            if (typeof updateEnergyTrendChart === 'function') {
                const cachedData = {
                    rawData: window.originalDataCache || window.rawDataCache || []
                };
                updateEnergyTrendChart(cachedData, timeRange);
            }
        });
    });
    
    console.log('时间选择器初始化完成，共', timeBtns.length, '个按钮');
}

// 重新加载数据（不显示加载提示框）
function reloadDataWithoutLoading() {
    try {
        // 检查是否有区域筛选条件
        const currentDistrict = (typeof getCurrentDistrict === 'function') ? getCurrentDistrict() : null;
        const currentTimeRangeValue = (typeof getTimeRange === 'function') ? getTimeRange() : '日';
        
        console.log('=== 重新加载数据 ===');
        console.log('当前区域:', currentDistrict || '无');
        console.log('当前时间维度:', currentTimeRangeValue);
        
        // 使用原始完整数据作为数据源
        const dataSource = window.originalDataCache || window.rawDataCache || [];
        console.log('数据源数据量:', dataSource.length);
        
        if (dataSource.length > 0) {
            let dataToUse = dataSource;
            
            // 如果有区域筛选条件，先筛选区域
            if (currentDistrict) {
                // 判断是网格还是区县
                const isGrid = currentDistrict.includes('网格');
                const keyword = currentDistrict.replace(/区|市|县|网格/g, '');
                
                console.log('筛选类型:', isGrid ? '网格' : '区县', '关键词:', keyword);
                console.log('原始区域名:', currentDistrict, '处理后关键词:', keyword);
                
                // 检查数据源中的归属单元值
                if (dataSource.length > 0) {
                    const sampleUnits = dataSource.slice(0, 5).map(item => item['J']);
                    console.log('数据源中的归属单元示例:', sampleUnits);
                }
                
                dataToUse = dataSource.filter(item => {
                    const unit = item['J'] || ''; // 归属单元
                    const grid = item['GRID'] || ''; // 归属网格
                    
                    if (isGrid) {
                        // 网格级别：匹配归属网格列
                        return grid.includes(keyword) || grid === currentDistrict;
                    } else {
                        // 区县级别：匹配归属单元列
                        const match = unit.includes(keyword) || unit.includes(currentDistrict);
                        if (!match && unit.includes('武进')) {
                            console.log('匹配失败 - 单元:', unit, '关键词:', keyword, '区域名:', currentDistrict);
                        }
                        return match;
                    }
                });
                console.log('区域筛选后数据量:', dataToUse.length);
                
                // 调试：打印前 3 条筛选后的数据
                if (dataToUse.length > 0) {
                    console.log('前 3 条筛选数据:', {
                        count: dataToUse.length,
                        sample: dataToUse.slice(0, 3).map(item => ({
                            date: item['A'],
                            district: item['J'],
                            grid: item['GRID'],
                            energy: item['AB'],
                            cost: item['AC']
                        }))
                    });
                }
            }
            
            // 使用筛选数据重新加载
            if (typeof reloadDataWithFilter === 'function') {
                reloadDataWithFilter(dataToUse, currentDistrict);
            }
        } else {
            // 没有数据缓存，加载全部数据
            console.log('加载数据');
            
            // 加载 Excel 数据
            loadExcelData().then(data => {
                console.log('数据重新加载成功:', data);
                
                // 检查数据是否有效
                if (!data || !data.energyData || data.energyData.length === 0) {
                    console.warn('数据为空，使用模拟数据');
                    const mockData = generateMockData();
                    processData(mockData);
                } else {
                    // 处理数据
                    processData(data);
                }
            }).catch(error => {
                console.error('数据加载失败:', error);
                // 使用模拟数据
                console.log('使用模拟数据');
                const mockData = generateMockData();
                processData(mockData);
            });
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        // 使用模拟数据
        const mockData = generateMockData();
        processData(mockData);
    }
}

// 使用筛选后的数据重新加载图表
function reloadDataWithFilter(filteredData, district) {
    console.log('使用筛选数据重新加载图表，区域:', district, '数据量:', filteredData.length);
    
    try {
        // 根据当前时间维度过滤数据
        const timeFilteredData = filterDataByTimeRange(filteredData);
        
        console.log('时间过滤后数据量:', timeFilteredData.length);
        
        // 计算总体电费用于调试
        const testCost = timeFilteredData.reduce((sum, item) => {
            const value = item['AC'] || 0;
            return sum + Number(value || 0);
        }, 0);
        console.log('筛选后的总体电费（原始）:', testCost, '四舍五入:', Math.round(testCost));
        
        // 构建数据对象
        const data = {
            rawData: filteredData,
            energyData: timeFilteredData,
            reportData: {
                rent: { total: 0, pending: 0, completed: 0 },
                electricity: { total: 0, pending: 0, completed: 0 }
            },
            trendData: generateTrendData(filteredData)
        };
        
        // 处理数据
        processData(data);
        
        // 更新能耗趋势图，使用当前选择的时间维度
        if (typeof updateEnergyTrendChart === 'function') {
            const currentTimeType = typeof getCurrentTrendTimeType === 'function' 
                ? getCurrentTrendTimeType() 
                : '日';
            updateEnergyTrendChart(data, currentTimeType);
        }
        
        // 更新标题显示当前区域
        updateTitleWithDistrict(district);
        
        // 保持地图区域高亮状态
        if (district && typeof updateMapHighlight === 'function') {
            updateMapHighlight(district);
        }
        
    } catch (error) {
        console.error('筛选数据加载失败:', error);
    }
}

// 更新标题显示当前区域
function updateTitleWithDistrict(district) {
    const titleElement = document.querySelector('.header h1');
    if (titleElement) {
        if (district) {
            titleElement.textContent = `常州市${district}能耗监控平台`;
        } else {
            titleElement.textContent = '常州市能耗监控平台';
        }
    }
}

// 初始化刷新按钮
function initRefreshButtons() {
    // 告警刷新按钮
    const alarmRefresh = document.getElementById('alarm-refresh');
    if (alarmRefresh) {
        alarmRefresh.addEventListener('click', function() {
            console.log('刷新告警信息');
            loadAlarms();
        });
    }
    
    // 事件刷新按钮
    const eventRefresh = document.getElementById('event-refresh');
    if (eventRefresh) {
        eventRefresh.addEventListener('click', function() {
            console.log('刷新事件信息');
            loadEvents();
        });
    }
}

// 加载数据
function loadData() {
    // 显示加载状态
    showLoading();
    
    // 确保在任何情况下都能隐藏加载状态
    setTimeout(function() {
        hideLoading();
    }, 3000);
    
    try {
        // 加载 Excel 数据
        loadExcelData().then(data => {
            console.log('数据加载成功:', data);
            
            // 检查数据是否有效
            if (!data || !data.energyData || data.energyData.length === 0) {
                console.warn('数据为空，使用模拟数据');
                const mockData = generateMockData();
                processData(mockData);
            } else {
                // 处理数据
                processData(data);
            }
            
            // 隐藏加载状态
            hideLoading();
        }).catch(error => {
            console.error('数据加载失败:', error);
            // 使用模拟数据
            console.log('使用模拟数据');
            const mockData = generateMockData();
            processData(mockData);
            hideLoading();
        });
    } catch (error) {
        console.error('数据加载失败:', error);
        hideLoading();
        // 不显示 alert，避免打扰用户
    }
}



// 显示加载状态
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// 隐藏加载状态
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// 加载告警信息
function loadAlarms() {
    const alarmList = document.getElementById('alarm-list');
    
    if (!alarmList) {
        console.error('未找到告警列表元素');
        return;
    }
    
    // 显示加载状态
    alarmList.innerHTML = '<div class="alarm-loading"><div class="spinner"></div><span>正在加载告警数据...</span></div>';
    
    // 从 CSV 文件加载告警数据，添加时间戳避免缓存
    fetch('data/data_gaojing.csv?t=' + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败: ' + response.status);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            // 尝试多种编码方式解码
            let text;
            const utf8Decoder = new TextDecoder('utf-8');
            const utf8Text = utf8Decoder.decode(buffer);
            
            // 检查是否包含乱码特征
            const hasGarbledChars = /锘|娴|犲|姝|€/.test(utf8Text);
            
            if (hasGarbledChars) {
                // UTF-8 解码后包含乱码，尝试 GBK
                const gbkDecoder = new TextDecoder('gbk');
                text = gbkDecoder.decode(buffer);
                console.log('使用 GBK 编码解析告警数据');
            } else {
                text = utf8Text;
                console.log('使用 UTF-8 编码解析告警数据');
            }
            
            // 解析 CSV
            const alarms = parseCSV(text);
            
            if (!alarms || alarms.length <= 1) {
                // 空数据
                alarmList.innerHTML = '<div class="alarm-empty"><span>暂无告警数据</span></div>';
                return;
            }
            
            // 跳过表头，取数据行
            const dataRows = alarms.slice(1);
            
            console.log('告警数据加载成功，共', dataRows.length, '条记录');
            
            // 清空并渲染告警列表
            alarmList.innerHTML = '';
            
            // 限制显示数量，避免过多
            const maxAlarms = 100;
            const displayData = dataRows.slice(0, maxAlarms);
            
            displayData.forEach((row, index) => {
                if (index < 3) {
                    console.log(`告警记录 ${index}:`, {
                        '级别 (1)': row[1],
                        '告警时间 (2)': row[2],
                        '告警时长 (3)': row[3],
                        '区域 (6)': row[6],
                        '机房 (7)': row[7]
                    });
                }
                
                // CSV 字段映射：
                // 0:序号，1:级别，2:告警时间，3:告警时长，4:告警值，5:地市，6:区域，7:机房，8:站点类型，9:设备名称，10:设备类型，11:监控量
                const level = row[1] || '';           // 级别
                const alarmTime = row[2] || '';        // 告警时间
                const duration = row[3] || '';        // 告警时长
                const region = row[6] || '';           // 区域
                const room = row[7] || '';            // 机房
                const stationType = row[8] || '';     // 站点类型
                const deviceName = row[9] || '';      // 设备名称
                const monitorItem = row[11] || '';     // 监控量
                
                // 级别映射：一级/二级/三级/四级
                let levelClass = 'level-4';
                let levelText = level;
                if (level.includes('一级') || level === '1') {
                    levelClass = 'level-1';
                    levelText = '一级';
                } else if (level.includes('二级') || level === '2') {
                    levelClass = 'level-2';
                    levelText = '二级';
                } else if (level.includes('三级') || level === '3') {
                    levelClass = 'level-3';
                    levelText = '三级';
                } else if (level.includes('四级') || level === '4') {
                    levelClass = 'level-4';
                    levelText = '四级';
                }
                
                const alarmItem = document.createElement('div');
                alarmItem.className = 'alarm-item';
                
                // 三行布局
                alarmItem.innerHTML = `
                    <div class="alarm-row level-row">
                        <span class="level-badge ${levelClass}">${levelText}</span>
                        <span class="time-info" title="告警时间">${alarmTime}</span>
                        <span class="duration-info" title="告警时长" style="margin-left:8px;">⏱ ${duration}</span>
                    </div>
                    <div class="alarm-row">
                        <span class="label">区域:</span>
                        <span class="content" title="${region}">${region}</span>
                        <span class="label" style="margin-left:8px;">机房:</span>
                        <span class="content" title="${room}">${room}</span>
                        <span class="label" style="margin-left:8px;">类型:</span>
                        <span class="content">${stationType}</span>
                    </div>
                    <div class="alarm-row">
                        <span class="label">设备:</span>
                        <span class="content" title="${deviceName}">${deviceName}</span>
                    </div>
                    <div class="alarm-row">
                        <span class="label">监控量:</span>
                        <span class="content">${monitorItem}</span>
                    </div>
                `;
                
                alarmList.appendChild(alarmItem);
            });
            
            if (dataRows.length > maxAlarms) {
                console.log('仅显示前', maxAlarms, '条告警记录，共', dataRows.length, '条');
            }
            
            // 延迟启用自动滚动，确保 DOM 完全渲染
            setTimeout(() => {
                enableAutoScroll();
            }, 100);
        })
        .catch(error => {
            console.error('加载告警数据失败:', error);
            alarmList.innerHTML = '<div class="alarm-error"><span>加载失败: ' + error.message + '</span></div>';
        });
}

// CSV 解析辅助函数
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        
        return result;
    });
}

// 自动滚动功能
let autoScrollInterval = null;
let isUserScrolling = false;
let userScrollTimer = null;
let autoScrollEnabled = false;  // 防止重复启用
let lastScrollTop = 0;  // 记录上次滚动位置
let scrollDirection = 1;  // 滚动方向：1 向下，-1 向上

function enableAutoScroll() {
    // 如果已经启用，不再重复启用
    if (autoScrollEnabled) {
        console.log('自动滚动已启用，跳过');
        return;
    }
    
    const alarmList = document.getElementById('alarm-list');
    
    if (!alarmList) {
        console.error('未找到告警列表元素');
        return;
    }
    
    console.log('启用自动滚动，列表高度:', alarmList.scrollHeight, 'px');
    autoScrollEnabled = true;
    
    // 清除之前的定时器
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
    }
    
    // 监听用户滚动（使用 wheel 和 touchstart 事件，而不是 scroll）
    alarmList.addEventListener('wheel', function() {
        isUserScrolling = true;
        if (autoScrollInterval) {
            console.log('用户滚动，暂停自动滚动');
            clearInterval(autoScrollInterval);
        }
        
        // 用户停止滚动 3 秒后恢复自动滚动
        if (userScrollTimer) {
            clearTimeout(userScrollTimer);
        }
        
        userScrollTimer = setTimeout(() => {
            isUserScrolling = false;
            console.log('恢复自动滚动');
            startAutoScroll();
        }, 3000);
    });
    
    alarmList.addEventListener('touchstart', function() {
        isUserScrolling = true;
        if (autoScrollInterval) {
            console.log('用户触摸，暂停自动滚动');
            clearInterval(autoScrollInterval);
        }
    });
    
    alarmList.addEventListener('touchend', function() {
        if (userScrollTimer) {
            clearTimeout(userScrollTimer);
        }
        
        userScrollTimer = setTimeout(() => {
            isUserScrolling = false;
            console.log('恢复自动滚动');
            startAutoScroll();
        }, 3000);
    });
    
    // 监听滚动事件，只记录位置，不处理循环
    alarmList.addEventListener('scroll', function() {
        lastScrollTop = alarmList.scrollTop;
    });
    
    startAutoScroll();
}

function startAutoScroll() {
    const alarmList = document.getElementById('alarm-list');
    
    if (!alarmList) return;
    
    // 如果用户正在滚动，不启动
    if (isUserScrolling) {
        return;
    }
    
    // 检查列表是否有足够的内容需要滚动
    // 如果可视高度 >= 滚动高度，说明内容还没加载好或者内容太少不需要滚动
    const hasEnoughContent = alarmList.scrollHeight > alarmList.clientHeight + 10;
    
    if (!hasEnoughContent) {
        console.log('内容不足，暂不滚动。scrollHeight:', alarmList.scrollHeight, 'clientHeight:', alarmList.clientHeight);
        // 1 秒后重试
        setTimeout(() => {
            if (!isUserScrolling) {
                startAutoScroll();
            }
        }, 1000);
        return;
    }
    
    // 清除之前的定时器
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
    }
    
    console.log('开始自动滚动，列表总高度:', alarmList.scrollHeight, 'px, 可视高度:', alarmList.clientHeight, 'px');
    
    // 每 30ms 滚动 2px
    autoScrollInterval = setInterval(() => {
        if (!alarmList || isUserScrolling) {
            return;
        }
        
        const maxScrollTop = alarmList.scrollHeight - alarmList.clientHeight;
        const currentScrollTop = alarmList.scrollTop;
        
        // 向下滚动模式
        if (scrollDirection === 1) {
            // 检查是否到底部
            if (currentScrollTop >= maxScrollTop - 2) {
                // 到底部，改为向上滚动
                console.log('滚动到底部，改为向上滚动');
                scrollDirection = -1;
            } else {
                // 继续向下滚动
                alarmList.scrollTop += 2;
            }
        }
        // 向上滚动模式
        else {
            // 检查是否到顶部
            if (currentScrollTop <= 0) {
                // 到顶部，改为向下滚动
                console.log('滚动到顶部，改为向下滚动');
                scrollDirection = 1;
            } else {
                // 继续向上滚动
                alarmList.scrollTop -= 2;
            }
        }
    }, 30);
}

// 加载事件信息
function loadEvents() {
    // 模拟事件数据
    const events = [
        {
            time: '2026-03-10 11:00:00',
            location: '钟楼区',
            type: '设备维护',
            status: '已完成'
        },
        {
            time: '2026-03-10 10:00:00',
            location: '经开区',
            type: '系统升级',
            status: '进行中'
        },
        {
            time: '2026-03-10 09:30:00',
            location: '溧阳市',
            type: '数据同步',
            status: '已完成'
        }
    ];
    
    // 更新事件列表
    const eventList = document.getElementById('event-list');
    if (eventList) {
        eventList.innerHTML = '';
        
        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = `
                <div class="event-time">${event.time}</div>
                <div class="event-location">${event.location}</div>
                <div class="event-type">${event.type}</div>
                <div class="event-status">状态: ${event.status}</div>
            `;
            eventList.appendChild(eventItem);
        });
    }
}

// 导出函数
window.reloadDataWithoutLoading = reloadDataWithoutLoading;
window.reloadDataWithFilter = reloadDataWithFilter;