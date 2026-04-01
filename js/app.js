// 应用主逻辑

// API 基础路径配置
// 本地开发环境：http://127.0.0.1:5000/api
// Docker 部署环境：/api（通过 Nginx 反向代理）
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

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
                
                // 根据页面ID加载对应的 iframe
                switch(targetId) {
                    case '能耗分析':
                        loadEnergyAnalysisFrame();
                        break;
                    case '报账管理':
                        loadIframePage('baozhang-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['报账管理'].path);
                        break;
                    case '电表管理':
                        loadIframePage('dianbiao-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['电表管理'].path);
                        break;
                    case '报表管理':
                        loadIframePage('baobiao-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['报表管理'].path);
                        break;
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

                // 根据页面ID加载对应的 iframe
                switch(hash) {
                    case '能耗分析':
                        loadEnergyAnalysisFrame();
                        break;
                    case '报账管理':
                        loadIframePage('baozhang-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['报账管理'].path);
                        break;
                    case '电表管理':
                        loadIframePage('dianbiao-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['电表管理'].path);
                        break;
                    case '报表管理':
                        loadIframePage('baobiao-frame', NAV_CONFIG.baseURL + NAV_CONFIG.pages['报表管理'].path);
                        break;
                }
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
        const targetUrl = NAV_CONFIG.baseURL + NAV_CONFIG.pages['能耗分析'].path;
        
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

// 通用 iframe 加载函数
function loadIframePage(iframeId, targetUrl) {
    console.log('loadIframePage 被调用:', iframeId, targetUrl);

    setTimeout(() => {
        const iframe = document.getElementById(iframeId);
        const container = iframe ? iframe.closest('.iframe-container') : null;
        const loadingDiv = container ? container.querySelector('.iframe-loading') : null;

        if (!iframe) {
            console.error('未找到 iframe 元素:', iframeId);
            return;
        }

        console.log('iframe 元素找到，current src:', iframe.src);

        // 如果已经加载过，不再重复加载
        if (iframe.src && iframe.src !== '' && iframe.src !== 'about:blank' && iframe.src.indexOf(targetUrl.split('//')[1]) > -1) {
            console.log(iframeId, 'iframe 已加载，src:', iframe.src);
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            return;
        }

        console.log('开始加载 iframe:', iframeId, targetUrl);

        // 显示加载状态
        if (loadingDiv) {
            loadingDiv.style.display = 'flex';
            console.log('显示加载提示');
        }

        // 先设置 onload 和 onerror，再设置 src
        iframe.onload = function() {
            console.log(iframeId, 'iframe 加载完成');
            if (loadingDiv) {
                setTimeout(() => {
                    loadingDiv.style.display = 'none';
                }, 500);
            }
        };

        iframe.onerror = function() {
            console.error(iframeId, 'iframe 加载失败');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<div class="iframe-error"><span>加载失败，可能是网络问题或跨域限制</span></div>';
            }
        };

        // 设置 iframe 源
        iframe.src = targetUrl;
        console.log('iframe src 已设置为:', targetUrl);

        // 设置超时处理（15 秒）
        setTimeout(() => {
            if (loadingDiv && loadingDiv.style.display !== 'none') {
                console.warn(iframeId, 'iframe 加载超时');
                loadingDiv.innerHTML = '<div class="iframe-error"><span>加载时间较长，请耐心等待</span><button onclick="location.reload()" class="retry-btn">刷新页面</button></div>';
            }
        }, 15000);
    }, 100); // 延迟 100ms 确保 DOM 准备好
}

// 初始化时间选择器
function initTimeSelectors() {
    const timeBtns = document.querySelectorAll('.time-btn');
    
    timeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
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
            
            // 如果是能耗趋势图的时间选择器，重新加载对应时间范围的数据
            if (parentId === 'trend-time-selector') {
                // 先更新时间维度
                if (typeof setTimeRange === 'function') {
                    setTimeRange(timeRange);
                }
                // 重新加载数据（会根据新的时间维度加载正确的数据范围）
                reloadDataForTrendChart(timeRange);
                return;
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
                    rawData: window.originalDataCache || window.rawDataCache || [],
                    latestDate: window.latestDate || null
                };
                updateEnergyTrendChart(cachedData, timeRange);
            }
        });
    });
    
    console.log('时间选择器初始化完成，共', timeBtns.length, '个按钮');
}

// 为能耗趋势图重新加载对应时间范围的数据
async function reloadDataForTrendChart(timeRange) {
    try {
        // 检查是否有原始完整数据缓存
        if (!window.originalDataCache || window.originalDataCache.length === 0) {
            console.log('原始完整数据缓存未设置，跳过趋势图数据重新加载');
            return;
        }
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        let dateFrom, dateTo;
        
        if (timeRange === '月') {
            // 月视图：加载最近 12 个月的数据
            const startDate = new Date(currentYear, currentMonth - 12, 1);
            dateFrom = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
            dateTo = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
            console.log('月视图：加载最近 12 个月数据', dateFrom, '至', dateTo);
        } else if (timeRange === '年') {
            // 年视图：加载最近 12 年的数据
            dateFrom = `${currentYear - 11}-01-01`;
            dateTo = `${currentYear}-12-31`;
            console.log('年视图：加载最近 12 年数据', dateFrom, '至', dateTo);
        } else {
            // 日视图：使用原始完整数据缓存，不需要重新加载
            console.log('日视图：使用原始完整数据缓存，数据量:', window.originalDataCache.length);
            
            // 更新能耗趋势图 - 使用原始完整数据缓存
            if (typeof updateEnergyTrendChart === 'function') {
                const cachedData = {
                    rawData: window.originalDataCache,
                    latestDate: window.latestDate
                };
                console.log('传递给 updateEnergyTrendChart 的数据条数:', cachedData.rawData.length);
                updateEnergyTrendChart(cachedData, timeRange);
            }
            return;
        }
        
        const apiUrl = API_BASE + `/summary_data?date_from=${dateFrom}&date_to=${dateTo}`;
        console.log('API 完整地址：', apiUrl);
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        console.log('API 响应结果:', result);
        
        if (result.data) {
            console.log('API 返回数据条数:', result.data.length);
            console.log('API 返回数据示例（前 3 条）:', result.data.slice(0, 3).map(item => ({ date: item['A'], energy: item['AB'] })));
            
            // 只更新当前数据缓存，不覆盖原始完整数据缓存
            window.rawDataCache = result.data;
            // 重要：不覆盖 window.originalDataCache，它应该保持首次加载的完整数据
            window.latestDate = result.latest_date;
            
            console.log('趋势图数据加载完成，条数:', result.data.length);
            
            // 更新能耗趋势图 - 使用新加载的数据
            if (typeof updateEnergyTrendChart === 'function') {
                const cachedData = {
                    rawData: result.data,
                    latestDate: result.latest_date
                };
                console.log('传递给 updateEnergyTrendChart 的数据条数:', cachedData.rawData.length);
                updateEnergyTrendChart(cachedData, timeRange);
            }
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 重新加载数据（不显示加载提示框）
async function reloadDataWithoutLoading() {
    try {
        const currentDistrict = (typeof getCurrentDistrict === 'function') ? getCurrentDistrict() : null;
        const currentTimeRangeValue = (typeof getTimeRange === 'function') ? getTimeRange() : '日';

        console.log('=== 重新加载数据 ===');
        console.log('当前区域:', currentDistrict || '无');
        console.log('当前时间维度:', currentTimeRangeValue);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 对于月视图和年视图，直接使用 /api/summary 获取汇总数据
        if (currentTimeRangeValue === '月' || currentTimeRangeValue === '年') {
            let dateFrom, dateTo;
            if (currentTimeRangeValue === '月') {
                // 月视图：使用数据库最新日期所在的月份
                const latestDate = window.latestDate;
                if (latestDate) {
                    const latestDateObj = new Date(latestDate);
                    const latestYear = latestDateObj.getFullYear();
                    const latestMonth = latestDateObj.getMonth() + 1;
                    dateFrom = `${latestYear}-${String(latestMonth).padStart(2, '0')}-01`;
                    const lastDayOfMonth = new Date(latestYear, latestMonth, 0).getDate();
                    dateTo = `${latestYear}-${String(latestMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
                    console.log('月视图：使用数据库最新日期所在的月份', latestDate, '→', dateFrom, '至', dateTo);
                } else {
                    // 如果没有最新日期，使用当前月份
                    dateFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
                    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
                    dateTo = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
                    console.log('月视图：使用当前月份', dateFrom, '至', dateTo);
                }
            } else {
                dateFrom = `${currentYear}-01-01`;
                dateTo = `${currentYear}-12-31`;
            }

            // 构建 API URL，包含区域筛选参数
            let summaryUrl = API_BASE + `/summary?date_from=${dateFrom}&date_to=${dateTo}`;
            if (currentDistrict) {
                // 判断是区县还是网格：如果包含"网格"则是网格级别，否则是区县级别
                if (currentDistrict.includes('网格')) {
                    summaryUrl += `&grid=${encodeURIComponent(currentDistrict)}`;
                    console.log('月/年视图：使用网格筛选', currentDistrict);
                } else {
                    summaryUrl += `&district=${encodeURIComponent(currentDistrict)}`;
                    console.log('月/年视图：使用区县筛选', currentDistrict);
                }
            }
            console.log('月/年视图：获取汇总数据', summaryUrl);

            try {
                const summaryResponse = await fetch(summaryUrl);
                const summaryResult = await summaryResponse.json();

                if (summaryResult.success) {
                    console.log('汇总数据获取成功:', summaryResult);

                    // 直接更新总览显示
                    const roundedEnergy = Math.round(summaryResult.total_energy);
                    const roundedCost = Math.round(summaryResult.total_cost);

                    document.getElementById('total-energy').textContent = roundedEnergy.toLocaleString('zh-CN');
                    document.getElementById('total-cost-display').textContent = roundedCost.toLocaleString('zh-CN');

                    console.log('设置总能耗:', roundedEnergy.toLocaleString('zh-CN'));
                    console.log('设置总电费:', roundedCost.toLocaleString('zh-CN'));

                    // 从 summaryResult 获取 POI 和设备数量
                    if (summaryResult.total_poi_count !== undefined) {
                        document.getElementById('total-poi').textContent = summaryResult.total_poi_count;
                    }
                    if (summaryResult.total_device_count !== undefined) {
                        document.getElementById('total-device').textContent = summaryResult.total_device_count;
                    }

                    // 计算并更新环比数据
                    const currentEnergy = summaryResult.total_energy;
                    const currentCost = summaryResult.total_cost;
                    const currentPoi = summaryResult.total_poi_count || 0;
                    const currentDevice = summaryResult.total_device_count || 0;
                    const lastDate = summaryResult.last_date; // 当前月份的最后一天

                    // 计算上期日期范围
                    let prevDateFrom, prevDateTo;
                    let prevDayForPoiDevice; // 用于 POI/设备 环比的日期

                    if (currentTimeRangeValue === '月') {
                        // 上月日期范围（用于能耗和电费的环比 - 这些是累计值，需要完整月份对比）
                        const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
                        const prevYear = prevMonthDate.getFullYear();
                        const prevMonth = prevMonthDate.getMonth() + 1;
                        const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

                        prevDateFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
                        prevDateTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;

                        // 对于 POI/设备 环比，使用上月同一天（或上月最后一天）
                        let currentDay = 1;
                        if (lastDate) {
                            currentDay = parseInt(lastDate.split('-')[2], 10);
                        }
                        prevDayForPoiDevice = Math.min(currentDay, lastDayOfPrevMonth);
                    } else {
                        // 上年日期范围
                        prevDateFrom = `${currentYear - 1}-01-01`;
                        prevDateTo = `${currentYear - 1}-12-31`;
                        prevDayForPoiDevice = null;
                    }

                    let prevSummaryUrl = API_BASE + `/summary?date_from=${prevDateFrom}&date_to=${prevDateTo}`;
                    if (currentDistrict) {
                        if (currentDistrict.includes('网格')) {
                            prevSummaryUrl += `&grid=${encodeURIComponent(currentDistrict)}`;
                        } else {
                            prevSummaryUrl += `&district=${encodeURIComponent(currentDistrict)}`;
                        }
                    }
                    console.log('获取上期数据用于环比:', prevSummaryUrl);

                    try {
                        const prevResponse = await fetch(prevSummaryUrl);
                        const prevResult = await prevResponse.json();

                        if (prevResult.success) {
                            let previousEnergy, previousCost, previousPoi, previousDevice;

                            if (currentTimeRangeValue === '月' && prevDayForPoiDevice) {
                                // 对于月视图，需要分别获取：
                                // 1. 上月完整月份的能耗和电费（累计值）
                                // 2. 上月同一天（或最后一天）的 POI 和设备数量（时点值）
                                previousEnergy = prevResult.total_energy;
                                previousCost = prevResult.total_cost;

                                // 获取上月同天的 POI/设备 数据
                                const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
                                const prevYear = prevMonthDate.getFullYear();
                                const prevMonth = prevMonthDate.getMonth() + 1;
                                const prevDayUrl = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevDayForPoiDevice).padStart(2, '0')}`;

                                let poiDeviceUrl = API_BASE + `/summary?date_from=${prevDayUrl}&date_to=${prevDayUrl}`;
                                if (currentDistrict) {
                                    if (currentDistrict.includes('网格')) {
                                        poiDeviceUrl += `&grid=${encodeURIComponent(currentDistrict)}`;
                                    } else {
                                        poiDeviceUrl += `&district=${encodeURIComponent(currentDistrict)}`;
                                    }
                                }

                                try {
                                    const poiDeviceResponse = await fetch(poiDeviceUrl);
                                    const poiDeviceResult = await poiDeviceResponse.json();
                                    if (poiDeviceResult.success) {
                                        previousPoi = poiDeviceResult.total_poi_count || 0;
                                        previousDevice = poiDeviceResult.total_device_count || 0;
                                    }
                                } catch (e) {
                                    console.error('获取上月同日POI/设备数据失败:', e);
                                    previousPoi = 0;
                                    previousDevice = 0;
                                }
                            } else {
                                previousEnergy = prevResult.total_energy;
                                previousCost = prevResult.total_cost;
                                previousPoi = prevResult.total_poi_count || 0;
                                previousDevice = prevResult.total_device_count || 0;
                            }

                            console.log('上期能耗:', previousEnergy, '本期能耗:', currentEnergy);
                            console.log('上期电费:', previousCost, '本期电费:', currentCost);
                            console.log('上期POI:', previousPoi, '本期POI:', currentPoi);
                            console.log('上期设备:', previousDevice, '本期设备:', currentDevice);

                            // 计算环比百分比
                            // 对于年视图：
                            // - 能耗和电费：使用完整年份对比
                            // - POI和设备：使用去年12月31日与今年最后一天的数据对比（时点值）
                            let energyChange, costChange, poiChange, deviceChange;

                            if (currentTimeRangeValue === '年') {
                                const currentRecordCount = summaryResult.record_count || 0;
                                const prevRecordCount = prevResult.record_count || 0;

                                // 能量和电费：使用完整年份对比
                                energyChange = calculateChangePercent(currentEnergy, previousEnergy);
                                costChange = calculateChangePercent(currentCost, previousCost);

                                // POI和设备：获取去年12月31日的数据
                                const prevYearDec31 = `${currentYear - 1}-12-31`;
                                let poiDeviceUrl = API_BASE + `/summary?date_from=${prevYearDec31}&date_to=${prevYearDec31}`;
                                if (currentDistrict) {
                                    if (currentDistrict.includes('网格')) {
                                        poiDeviceUrl += `&grid=${encodeURIComponent(currentDistrict)}`;
                                    } else {
                                        poiDeviceUrl += `&district=${encodeURIComponent(currentDistrict)}`;
                                    }
                                }

                                try {
                                    const poiDeviceResponse = await fetch(poiDeviceUrl);
                                    const poiDeviceResult = await poiDeviceResponse.json();
                                    if (poiDeviceResult.success) {
                                        const prevYearPoi = poiDeviceResult.total_poi_count || 0;
                                        const prevYearDevice = poiDeviceResult.total_device_count || 0;

                                        console.log('去年12月31日POI:', prevYearPoi, '去年12月31日设备:', prevYearDevice);
                                        console.log('今年POI:', currentPoi, '今年设备:', currentDevice);

                                        poiChange = calculateChangePercent(currentPoi, prevYearPoi);
                                        deviceChange = calculateChangePercent(currentDevice, prevYearDevice);
                                    }
                                } catch (e) {
                                    console.error('获取去年12月31日POI/设备数据失败:', e);
                                    poiChange = null;
                                    deviceChange = null;
                                }

                                // 如果去年数据明显不完整，不显示能耗和电费的环比
                                if (prevRecordCount < currentRecordCount * 0.5) {
                                    console.log('去年数据不完整（', prevRecordCount, '条），不显示能耗和电费环比');
                                    energyChange = null;
                                    costChange = null;
                                }
                            } else {
                                energyChange = calculateChangePercent(currentEnergy, previousEnergy);
                                costChange = calculateChangePercent(currentCost, previousCost);
                                poiChange = calculateChangePercent(currentPoi, previousPoi);
                                deviceChange = calculateChangePercent(currentDevice, previousDevice);
                            }

                            // 更新环比显示
                            updateChangeDisplay('energy-change', energyChange);
                            updateChangeDisplay('cost-change', costChange);
                            updateChangeDisplay('poi-change', poiChange);
                            updateChangeDisplay('device-change', deviceChange);
                        }
                    } catch (error) {
                        console.error('获取上期数据失败:', error);
                    }

                    // 更新趋势图
                    if (typeof updateEnergyTrendChart === 'function') {
                        const cachedData = {
                            rawData: window.rawDataCache || [],
                            latestDate: summaryResult.last_date || null // 传递数据库最新日期
                        };
                        updateEnergyTrendChart(cachedData, currentTimeRangeValue);
                    }

                    // 更新用电方分类饼图（双环：外环能耗，内环电费）
                    if (typeof updateConsumerTypeChart === 'function') {
                        const consumerData = {
                            rawData: window.rawDataCache || [],
                            energyData: [{
                                mobile_cumulative_energy: summaryResult.total_mobile_energy || 0,
                                mobile_electricity_fee: summaryResult.total_mobile_fee || 0,
                                tower_cumulative_energy: summaryResult.total_tower_energy || 0,
                                tower_electricity_fee: summaryResult.total_tower_fee || 0
                            }],
                            latestDate: summaryResult.last_date || null
                        };
                        updateConsumerTypeChart(consumerData);
                    }

                    // 更新 POI 分项统计图表
                    if (typeof updatePoiChart === 'function') {
                        const poiData = {
                            rawData: window.rawDataCache || [],
                            energyData: [{
                                mobile_poi_count: summaryResult.total_mobile_poi || 0,
                                tower_poi_count: summaryResult.total_tower_poi || 0
                            }],
                            latestDate: summaryResult.last_date || null
                        };
                        updatePoiChart(poiData);
                    }

                    // 更新用电类型统计图表
                    if (typeof updateElectricityTypeChart === 'function') {
                        const electricityTypeData = {
                            rawData: window.rawDataCache || [],
                            energyData: [{
                                direct_power_supply_energy: summaryResult.total_direct_energy || 0,
                                direct_power_supply_cost: summaryResult.total_direct_cost || 0,
                                indirect_power_supply_energy: summaryResult.total_indirect_energy || 0,
                                indirect_power_supply_cost: summaryResult.total_indirect_cost || 0
                            }],
                            latestDate: summaryResult.last_date || null
                        };
                        updateElectricityTypeChart(electricityTypeData);
                    }
                }
            } catch (error) {
                console.error('获取月/年汇总数据失败:', error);
            }

            return;
        }

        // 对于日视图，加载包含上月同天的数据范围以支持环比计算
        const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
        const prevMonthYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;
        const prevMonthStart = `${prevMonthYear}-${String(prevMonth).padStart(2, '0')}-20`;
        const currentMonthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-20`;

        // 构建 API URL，包含区域筛选参数
        let apiUrl = API_BASE + `/summary_data?date_from=${prevMonthStart}&date_to=${currentMonthEnd}`;
        if (currentDistrict) {
            if (currentDistrict.includes('网格')) {
                apiUrl += `&grid=${encodeURIComponent(currentDistrict)}`;
            } else {
                apiUrl += `&district=${encodeURIComponent(currentDistrict)}`;
            }
        }
        console.log('日视图：加载详细数据', apiUrl);

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!result.success) {
            console.error('API 返回错误:', result.error);
            return;
        }

        const processedData = result.data;
        const latestDate = result.latest_date;

        console.log('API 数据加载成功，数据条数:', processedData.length);
        console.log('最新有效日期:', latestDate);

        // 缓存原始数据
        window.rawDataCache = processedData;

        // 根据当前时间维度过滤数据
        const filteredData = filterDataByTimeRange(processedData);

        // 构建数据对象
        const data = {
            rawData: processedData,
            energyData: filteredData,
            latestDate: latestDate,
            reportData: {
                rent: { total: 0, pending: 0, completed: 0 },
                electricity: { total: 0, pending: 0, completed: 0 }
            },
            trendData: generateTrendData(processedData)
        };

        // 处理数据
        processData(data);

        // 更新能耗趋势图
        if (typeof updateEnergyTrendChart === 'function') {
            updateEnergyTrendChart(data, currentTimeRangeValue);
        }

        // 更新标题显示当前区域
        updateTitleWithDistrict(currentDistrict);

    } catch (error) {
        console.error('重新加载数据失败:', error);
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
            trendData: generateTrendData(filteredData),
            latestDate: window.latestDate || null // 使用全局保存的最新日期
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

    // 从新的 API 获取 meter_alarm 表中最新一天的告警数据
    fetch(API_BASE + '/alarms/latest_day')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            if (!result.success) {
                throw new Error(result.error || '获取告警数据失败');
            }

            const alarms = result.data || [];

            console.log('告警数据加载成功，共', alarms.length, '条记录，最新日期:', result.latest_date);

            if (alarms.length === 0) {
                // 空数据
                alarmList.innerHTML = '<div class="alarm-empty"><span>暂无告警数据</span></div>';
                return;
            }

            // 清空并渲染告警列表
            alarmList.innerHTML = '';

            // 限制显示数量，避免过多
            const maxAlarms = 100;
            const displayData = alarms.slice(0, maxAlarms);

            displayData.forEach((row, index) => {
                if (index < 3) {
                    console.log(`告警记录 ${index}:`, {
                        '级别': row['级别'],
                        '告警时间': row['告警时间'],
                        '告警时长': row['告警时长'],
                        '区域': row['区域'],
                        '机房': row['机房']
                    });
                }

                // API 字段映射
                const level = row['级别'] || '';
                const alarmTime = row['告警时间'] || '';
                const duration = row['告警时长'] || '';
                const region = row['区域'] || '';
                const room = row['机房'] || '';
                const stationType = row['站点类型'] || '';
                const deviceName = row['设备名称'] || '';
                const monitorItem = row['监控量'] || '';

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

            if (alarms.length > maxAlarms) {
                console.log('仅显示前', maxAlarms, '条告警记录，共', alarms.length, '条');
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

// 事件列表自动滚动功能
let eventScrollInterval = null;
let isEventUserScrolling = false;
let eventScrollTimer = null;
let eventScrollEnabled = false;
let eventScrollDirection = 1;

function enableEventAutoScroll() {
    if (eventScrollEnabled) {
        console.log('事件列表自动滚动已启用，跳过');
        return;
    }

    const eventList = document.getElementById('event-list');

    if (!eventList) {
        console.error('未找到事件列表元素');
        return;
    }

    console.log('启用事件列表自动滚动，列表高度:', eventList.scrollHeight, 'px');
    eventScrollEnabled = true;

    if (eventScrollInterval) {
        clearInterval(eventScrollInterval);
    }

    eventList.addEventListener('wheel', function() {
        isEventUserScrolling = true;
        if (eventScrollInterval) {
            console.log('用户滚动事件列表，暂停自动滚动');
            clearInterval(eventScrollInterval);
        }

        if (eventScrollTimer) {
            clearTimeout(eventScrollTimer);
        }

        eventScrollTimer = setTimeout(() => {
            isEventUserScrolling = false;
            console.log('恢复事件列表自动滚动');
            startEventAutoScroll();
        }, 10000);
    });

    eventList.addEventListener('touchstart', function() {
        isEventUserScrolling = true;
        if (eventScrollInterval) {
            console.log('用户触摸事件列表，暂停自动滚动');
            clearInterval(eventScrollInterval);
        }
    });

    eventList.addEventListener('touchend', function() {
        if (eventScrollTimer) {
            clearTimeout(eventScrollTimer);
        }

        eventScrollTimer = setTimeout(() => {
            isEventUserScrolling = false;
            console.log('恢复事件列表自动滚动');
            startEventAutoScroll();
        }, 10000);
    });

    // 点击事件 - 暂停 10 秒后恢复
    eventList.addEventListener('click', function() {
        isEventUserScrolling = true;
        if (eventScrollInterval) {
            console.log('用户点击事件列表，暂停自动滚动 10 秒');
            clearInterval(eventScrollInterval);
        }

        if (eventScrollTimer) {
            clearTimeout(eventScrollTimer);
        }

        eventScrollTimer = setTimeout(() => {
            isEventUserScrolling = false;
            console.log('10 秒后恢复事件列表自动滚动');
            startEventAutoScroll();
        }, 10000);
    });

    startEventAutoScroll();
}

function startEventAutoScroll() {
    const eventList = document.getElementById('event-list');

    if (!eventList) return;

    if (isEventUserScrolling) {
        return;
    }

    const hasEnoughContent = eventList.scrollHeight > eventList.clientHeight + 10;

    if (!hasEnoughContent) {
        console.log('事件列表内容不足，暂不滚动。scrollHeight:', eventList.scrollHeight, 'clientHeight:', eventList.clientHeight);
        setTimeout(() => {
            if (!isEventUserScrolling) {
                startEventAutoScroll();
            }
        }, 1000);
        return;
    }

    if (eventScrollInterval) {
        clearInterval(eventScrollInterval);
    }

    console.log('开始事件列表自动滚动，列表总高度:', eventList.scrollHeight, 'px, 可视高度:', eventList.clientHeight, 'px');

    eventScrollInterval = setInterval(() => {
        if (!eventList || isEventUserScrolling) {
            return;
        }

        const maxScrollTop = eventList.scrollHeight - eventList.clientHeight;
        const currentScrollTop = eventList.scrollTop;

        if (eventScrollDirection === 1) {
            if (currentScrollTop >= maxScrollTop - 2) {
                console.log('事件列表滚动到底部，改为向上滚动');
                eventScrollDirection = -1;
            } else {
                eventList.scrollTop += 2;
            }
        }
        else {
            if (currentScrollTop <= 0) {
                console.log('事件列表滚动到顶部，改为向下滚动');
                eventScrollDirection = 1;
            } else {
                eventList.scrollTop -= 2;
            }
        }
    }, 30);
}

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

        // 用户停止滚动 10 秒后恢复自动滚动
        if (userScrollTimer) {
            clearTimeout(userScrollTimer);
        }

        userScrollTimer = setTimeout(() => {
            isUserScrolling = false;
            console.log('恢复自动滚动');
            startAutoScroll();
        }, 10000);
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
        }, 10000);
    });

    // 点击事件 - 暂停 10 秒后恢复
    alarmList.addEventListener('click', function() {
        isUserScrolling = true;
        if (autoScrollInterval) {
            console.log('用户点击，暂停自动滚动 10 秒');
            clearInterval(autoScrollInterval);
        }

        if (userScrollTimer) {
            clearTimeout(userScrollTimer);
        }

        userScrollTimer = setTimeout(() => {
            isUserScrolling = false;
            console.log('10 秒后恢复自动滚动');
            startAutoScroll();
        }, 10000);
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
    const eventList = document.getElementById('event-list');

    if (!eventList) {
        console.error('未找到事件列表元素');
        return;
    }

    // 重置滚动状态
    eventScrollEnabled = false;
    isEventUserScrolling = false;
    if (eventScrollInterval) {
        clearInterval(eventScrollInterval);
        eventScrollInterval = null;
    }
    if (eventScrollTimer) {
        clearTimeout(eventScrollTimer);
        eventScrollTimer = null;
    }
    // 重置滚动位置到顶部
    eventList.scrollTop = 0;
    eventScrollDirection = 1;

    // 显示加载状态
    eventList.innerHTML = '<div class="alarm-loading"><div class="spinner"></div><span>正在加载事件数据...</span></div>';

    // 从 API 获取 meter_event 表中最新一天的事件数据
    fetch(API_BASE + '/events/latest_day')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            if (!result.success) {
                throw new Error(result.error || '获取事件数据失败');
            }

            const events = result.data || [];

            console.log('事件数据加载成功，共', events.length, '条记录，最新日期:', result.latest_date);

            if (events.length === 0) {
                // 空数据
                eventList.innerHTML = '<div class="alarm-empty"><span>暂无事件数据</span></div>';
                return;
            }

            // 清空并渲染事件列表
            eventList.innerHTML = '';

            // 限制显示数量
            const maxEvents = 100;
            const displayData = events.slice(0, maxEvents);

            displayData.forEach((event, index) => {
                if (index < 3) {
                    console.log(`事件记录 ${index}:`, {
                        '分析日期': event['分析日期'],
                        '供电类型': event['供电类型'],
                        '区县': event['区县'],
                        '归属': event['归属'],
                        '关联位置点': event['关联位置点'],
                        '电表编号': event['电表编号'],
                        '电表事件': event['电表事件']
                    });
                }

                // 事件字段映射
                const eventDate = event['分析日期'] || '';
                const electricityType = event['供电类型'] || '';
                const district = event['区县'] || '';
                const ownership = event['归属'] || '';
                const location = event['关联位置点'] || '';
                const meterNumber = event['电表编号'] || '';
                const meterEvent = event['电表事件'] || '';

                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';

                // 根据事件类型设置不同的样式
                let eventTypeClass = '';
                if (meterEvent.includes('一级告警')) {
                    eventTypeClass = 'event-critical';
                } else if (meterEvent.includes('二级告警')) {
                    eventTypeClass = 'event-warning';
                } else {
                    eventTypeClass = 'event-normal';
                }

                eventItem.innerHTML = `
                    <div class="event-row level-row">
                        <span class="level-badge ${eventTypeClass}">${meterEvent}</span>
                        <span class="time-info" title="分析日期">${eventDate}</span>
                        <span class="duration-info" title="供电类型" style="margin-left:8px;">⚡ ${electricityType}</span>
                    </div>
                    <div class="event-row">
                        <span class="label">区县:</span>
                        <span class="content" title="${district}">${district}</span>
                        <span class="label" style="margin-left:8px;">归属:</span>
                        <span class="content">${ownership}</span>
                    </div>
                    <div class="event-row">
                        <span class="label">位置:</span>
                        <span class="content" title="${location}">${location}</span>
                    </div>
                    <div class="event-row">
                        <span class="label">电表:</span>
                        <span class="content">${meterNumber}</span>
                    </div>
                `;

                eventList.appendChild(eventItem);
            });

            if (events.length > maxEvents) {
                console.log('仅显示前', maxEvents, '条事件记录，共', events.length, '条');
            }

            // 延迟启用自动滚动，确保 DOM 完全渲染
            setTimeout(() => {
                enableEventAutoScroll();
            }, 100);
        })
        .catch(error => {
            console.error('加载事件数据失败:', error);
            eventList.innerHTML = '<div class="alarm-error"><span>加载失败: ' + error.message + '</span></div>';
        });
}

// 导出函数
window.reloadDataWithoutLoading = reloadDataWithoutLoading;
window.reloadDataWithFilter = reloadDataWithFilter;