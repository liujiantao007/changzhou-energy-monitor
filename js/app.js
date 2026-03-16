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
            
            // 移除所有导航项的active类
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 添加当前导航项的active类
            this.classList.add('active');
            
            // 隐藏所有页面
            pages.forEach(page => page.classList.remove('active'));
            
            // 显示对应页面
            const targetId = this.getAttribute('href').substring(1);
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
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
            
            // 设置时间维度
            if (typeof setTimeRange === 'function') {
                setTimeRange(timeRange);
            }
            
            // 重新过滤数据（不显示加载提示框）
            reloadDataWithoutLoading();
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
    // 模拟告警数据
    const alarms = [
        {
            time: '2026-03-10 10:30:00',
            location: '天宁区',
            type: '用电量异常',
            level: 'emergency',
            status: '待处理'
        },
        {
            time: '2026-03-10 09:15:00',
            location: '武进区',
            type: '设备离线',
            level: 'important',
            status: '处理中'
        },
        {
            time: '2026-03-10 08:45:00',
            location: '新北区',
            type: '电压波动',
            level: 'normal',
            status: '已处理'
        }
    ];
    
    // 更新告警列表
    const alarmList = document.getElementById('alarm-list');
    if (alarmList) {
        alarmList.innerHTML = '';
        
        alarms.forEach(alarm => {
            const alarmItem = document.createElement('div');
            alarmItem.className = 'alarm-item';
            alarmItem.innerHTML = `
                <div class="alarm-time">${alarm.time}</div>
                <div class="alarm-location">${alarm.location}</div>
                <div class="alarm-type">${alarm.type}</div>
                <div class="alarm-level ${alarm.level}">
                    ${alarm.level === 'emergency' ? '紧急' : alarm.level === 'important' ? '重要' : '一般'}
                </div>
                <div class="alarm-status">状态: ${alarm.status}</div>
            `;
            alarmList.appendChild(alarmItem);
        });
    }
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