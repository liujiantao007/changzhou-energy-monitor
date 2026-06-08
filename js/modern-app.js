// 现代版应用程序 - 高大上界面
// 保留所有旧版本的功能和数据模型，重新设计视觉外观

// API 基础路径配置
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

// 页面加载完成后执行
function __initApp() {
    initVersionToggle();
    checkVersionPreference();
    initResponsiveScale();
    initNavigation();
    initTimeSelectors();
    initRefreshButtons();
    initCharts();
    initMap();
    loadData();

    setTimeout(() => {
        loadAlarms();
        loadEvents();
    }, 100);

    initKnowledgeBase();
}

// 安全初始化：如果 DOM 已解析完毕（interactive 或 complete）直接执行；
// 否则等待 DOMContentLoaded。脚本必须放在所有依赖 JS（map.js 等）之后加载。
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __initApp);
} else {
    __initApp();
}

// 版本切换功能
function initVersionToggle() {
    const versionToggle = document.getElementById('version-toggle');
    if (versionToggle) {
        versionToggle.addEventListener('click', () => {
            toggleVersion();
        });
    }
}

function checkVersionPreference() {
    const savedVersion = localStorage.getItem('version');
    if (savedVersion === 'old') {
        switchToOldVersion();
    }
    // 如果版本不是 'old'，说明已经在现代版，不需要做任何事
}

function toggleVersion() {
    const currentVersion = localStorage.getItem('version');
    if (currentVersion === 'old') {
        // 当前是旧版，需要跳转到新版
        // 但我们已经在新版，所以无需跳转
        localStorage.setItem('version', 'new');
    } else {
        switchToOldVersion();
    }
}

function switchToOldVersion() {
    localStorage.setItem('version', 'old');
    window.location.href = 'index.html';
}

// 响应式缩放
function initResponsiveScale() {
    function resize() {
        const app = document.getElementById('app');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const bottomMargin = windowHeight * 0.02;
        const availableHeight = windowHeight - bottomMargin;

        const scaleX = windowWidth / 1920;
        const scaleY = availableHeight / 1080;

        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = 1920 * scale;
        const scaledHeight = 1080 * scale;
        const offsetX = (windowWidth - scaledWidth) / 2;
        const offsetY = 0;

        app.style.transform = `scale(${scale})`;
        app.style.transformOrigin = 'top left';
        app.style.width = '1920px';
        app.style.height = '1080px';
        app.style.position = 'absolute';
        app.style.left = offsetX + 'px';
        app.style.top = offsetY + 'px';
        app.style.margin = '0';

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

    resize();
    window.addEventListener('resize', resize);
}

// 页面导航
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href === '#home') {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                pages.forEach(page => page.classList.remove('active'));
                const homePage = document.getElementById('home');
                if (homePage) homePage.classList.add('active');
                return;
            }

            e.preventDefault();

            if (window.navDisplayMode === 'popup' && href !== '#知识库') {
                let targetUrl;
                if (this.classList.contains('external-link')) {
                    targetUrl = href;
                } else {
                    const targetId = href.substring(1);
                    targetUrl = NAV_CONFIG.baseURL + (NAV_CONFIG.pages[targetId] ? NAV_CONFIG.pages[targetId].path : '');
                }
                if (targetUrl) {
                    window.open(targetUrl, '_blank');
                }
                return;
            }

            if (this.classList.contains('external-link')) {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                pages.forEach(page => page.classList.remove('active'));
                const targetPage = document.getElementById('报账管理');
                if (targetPage) {
                    targetPage.classList.add('active');
                    loadIframePage('baozhang-frame', href);
                }
                return;
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            pages.forEach(page => page.classList.remove('active'));

            const targetId = href.substring(1);
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
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
                    case '知识库':
                        initKnowledgeBase();
                        break;
                }
            }
        });
    });

    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1) || 'home';

        navItems.forEach(item => {
            const href = item.getAttribute('href').substring(1);
            if (href === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        pages.forEach(page => {
            if (page.id === hash) {
                page.classList.add('active');
                switch(hash) {
                    case 'home':
                        break;
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

// 初始化时间选择器
function initTimeSelectors() {
    const timeBtns = document.querySelectorAll('.time-btn');

    timeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const timeRange = this.textContent;

            const allTimeBtns = document.querySelectorAll('.time-btn');
            allTimeBtns.forEach(btn => {
                if (btn.textContent === timeRange) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            if (typeof setTimeRange === 'function') {
                setTimeRange(timeRange);
            }

            reloadDataWithoutLoading();
        });
    });
}

// 初始化刷新按钮
function initRefreshButtons() {
    const modeToggle = document.getElementById('display-mode-toggle');
    if (modeToggle) {
        if (window.navDisplayMode === undefined) {
            window.navDisplayMode = 'popup';
            updateModeToggleButton();
        }
        modeToggle.addEventListener('click', function() {
            if (window.navDisplayMode === 'popup') {
                window.navDisplayMode = 'iframe';
            } else {
                window.navDisplayMode = 'popup';
            }
            updateModeToggleButton();
        });
    }
}

function updateModeToggleButton() {
    const modeToggle = document.getElementById('display-mode-toggle');
    if (!modeToggle) return;
    const toggleText = modeToggle.querySelector('.toggle-text');
    if (window.navDisplayMode === 'popup') {
        toggleText.textContent = '弹出模式';
    } else {
        toggleText.textContent = '嵌入模式';
    }
}

// 时间维度切换重新加载数据
function reloadDataWithoutLoading() {
    const timeRange = getTimeRange();
    console.log('重新加载数据，时间维度:', timeRange);

    // 使用已有的缓存数据重新过滤
    const cachedData = window.rawDataCache || window.originalDataCache;
    if (!cachedData || cachedData.length === 0) {
        console.warn('无缓存数据，重新加载...');
        loadExcelData().then(data => {
            if (data && data.energyData && data.energyData.length > 0) {
                window.originalDataCache = data.rawData || [];
                processData(data);
            }
        }).catch(err => console.error('重新加载失败:', err));
        return;
    }

    // 构造与 processData 兼容的数据结构
    const filteredData = filterDataByTimeRange(cachedData);
    const latestDate = window.latestDate;

    // 构建完整数据对象，更新所有图表
    const chartData = {
        rawData: window.originalDataCache || cachedData,
        energyData: filteredData,
        latestDate: latestDate,
        reportData: {
            rent: { total: 0, pending: 0, completed: 0 },
            electricity: { total: 0, pending: 0, completed: 0 }
        }
    };

    // 逐个更新所有图表
    if (typeof updateEnergyTrendChart === 'function') {
        updateEnergyTrendChart(chartData, timeRange);
    }
    if (typeof updateConsumerTypeChart === 'function') {
        updateConsumerTypeChart(chartData);
    }
    if (typeof updatePoiChart === 'function') {
        updatePoiChart(chartData);
    }
    if (typeof updateElectricityTypeChart === 'function') {
        updateElectricityTypeChart(chartData);
    }

    // 更新顶部指标卡片
    const totalEnergy = filteredData.reduce((sum, item) => sum + Number(item['AB'] || 0), 0);
    const totalCost = filteredData.reduce((sum, item) => sum + Number(item['AC'] || 0), 0);
    const poiCount = filteredData.reduce((sum, item) => sum + Number(item['overview_poi_count'] || 0), 0);
    const deviceCount = filteredData.reduce((sum, item) => sum + Number(item['overview_device_count'] || 0), 0);

    document.getElementById('total-energy').textContent = Math.round(totalEnergy).toLocaleString('zh-CN');
    document.getElementById('total-cost-display').textContent = Math.round(totalCost).toLocaleString('zh-CN');
    document.getElementById('total-poi').textContent = poiCount.toLocaleString('zh-CN');
    document.getElementById('total-device').textContent = deviceCount.toLocaleString('zh-CN');

    console.log('指标更新完成:', { totalEnergy, totalCost, poiCount, deviceCount, timeRange });
}

// 加载数据函数
function loadData() {
    showLoading();

    // 显示加载状态，但立即隐藏
    showLoading();
    setTimeout(() => {
        hideLoading();
    }, 500);

    // 立即显示模拟数据，避免用户长时间等待
    console.log('立即加载模拟数据...');
    try {
        const mockData = generateMockData();
        processData(mockData);
    } catch (error) {
        console.error('生成模拟数据失败:', error);
    }

    // 隐藏加载状态
    hideLoading();

    // 异步加载真实数据
    console.log('开始异步加载真实数据...');
    loadExcelData().then(data => {
        console.log('真实数据加载成功:', data);

        if (!data || !data.energyData || data.energyData.length === 0) {
            console.warn('真实数据为空，继续使用模拟数据');
            return;
        }

        // 重置 originalDataCache 为真实数据（趋势图依赖此缓存且日期需与最新日期匹配）
        window.originalDataCache = data.rawData || [];
        console.log('已更新 originalDataCache 为真实数据，条数:', window.originalDataCache.length);

        // 使用真实数据更新界面
        processData(data);
    }).catch(error => {
        console.error('真实数据加载失败，继续使用模拟数据:', error);
    });
}

// 显示加载状态
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('visible');
    }
}

// 隐藏加载状态 - 确保能够立即隐藏
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('visible');
        loading.style.display = 'none';
    }
}

// 告警和事件相关函数
let alarmDataCache = [];
let eventDataCache = [];
let alarmLoadingPromise = null;
let eventLoadingPromise = null;

function loadAlarms() {
    if (alarmLoadingPromise) {
        console.log('告警数据正在加载中，跳过重复请求');
        return;
    }

    const alarmList = document.getElementById('alarm-list');

    if (!alarmList) {
        console.error('未找到告警列表元素');
        return;
    }

    alarmList.innerHTML = '<div class="alarm-loading"><div class="spinner"></div><span>正在加载告警数据...</span></div>';

    alarmLoadingPromise = fetch(API_BASE + '/alarms/latest_day')
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
                alarmList.innerHTML = '<div class="alarm-empty"><span>暂无告警数据</span></div>';
                return;
            }

            alarmDataCache = alarms;

            const districtSel = document.getElementById('district-select');
            const currentDistrict = districtSel ? districtSel.value : '';
            if (currentDistrict) {
                filterAlarmsByRegion(currentDistrict);
            } else {
                renderAlarms(alarms);
            }
        })
        .catch(error => {
            console.error('加载告警数据失败:', error);
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                alarmList.innerHTML = '<div class="alarm-error"><span>无法连接到服务器</span><button onclick="loadAlarms()" class="retry-btn">重试</button></div>';
            } else {
                alarmList.innerHTML = '<div class="alarm-error"><span>加载失败: ' + error.message + '</span></div>';
            }
        })
        .finally(() => {
            alarmLoadingPromise = null;
        });
}

function loadEvents() {
    if (eventLoadingPromise) {
        console.log('事件数据正在加载中，跳过重复请求');
        return;
    }

    const eventList = document.getElementById('event-list');

    if (!eventList) {
        console.error('未找到事件列表元素');
        return;
    }

    eventList.innerHTML = '<div class="alarm-loading"><div class="spinner"></div><span>正在加载事件数据...</span></div>';

    eventLoadingPromise = fetch(API_BASE + '/events/latest_day')
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

            eventDataCache = events;

            const districtSel = document.getElementById('district-select');
            const gridSel = document.getElementById('grid-select');
            const currentDistrict = districtSel ? districtSel.value : '';
            const currentGrid = gridSel ? gridSel.value : '';
            if (currentDistrict || currentGrid) {
                filterEventsByRegion(currentDistrict, currentGrid);
            } else {
                renderEvents(events);
            }
        })
        .catch(error => {
            console.error('加载事件数据失败:', error);
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                eventList.innerHTML = '<div class="alarm-error"><span>无法连接到服务器</span><button onclick="loadEvents()" class="retry-btn">重试</button></div>';
            } else {
                eventList.innerHTML = '<div class="alarm-error"><span>加载失败: ' + error.message + '</span></div>';
            }
        })
        .finally(() => {
            eventLoadingPromise = null;
        });
}

function renderAlarms(alarms) {
    const alarmList = document.getElementById('alarm-list');
    if (!alarmList) return;

    alarmList.innerHTML = '';

    if (!alarms || alarms.length === 0) {
        alarmList.innerHTML = '<div class="alarm-empty"><span>暂无告警数据</span></div>';
        return;
    }

    const maxAlarms = 100;
    const displayData = alarms.slice(0, maxAlarms);

    displayData.forEach((row, index) => {
        const level = row['级别'] || '';
        const alarmTime = row['告警时间'] || '';
        const duration = row['告警时长'] || '';
        const region = row['区域'] || '';
        const room = row['机房'] || '';
        const stationType = row['站点类型'] || '';
        const deviceName = row['设备名称'] || '';
        const monitorItem = row['监控量'] || '';

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
}

function filterAlarmsByRegion(district) {
    if (!alarmDataCache || alarmDataCache.length === 0) {
        console.log('告警缓存为空，跳过筛选');
        return;
    }

    if (!district) {
        renderAlarms(alarmDataCache);
        return;
    }

    const districtKeyword = district.replace(/区|市|县/g, '');
    const filtered = alarmDataCache.filter(a => {
        const region = a['区域'] || '';
        return region.includes(districtKeyword) || region.includes(district);
    });

    console.log(`告警筛选结果: 区县=${district}, 筛选后=${filtered.length}/${alarmDataCache.length}条`);
    renderAlarms(filtered);
}

function renderEvents(events) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;

    eventList.innerHTML = '';

    if (!events || events.length === 0) {
        eventList.innerHTML = '<div class="alarm-empty"><span>暂无事件数据</span></div>';
        return;
    }

    const maxEvents = 100;
    const displayData = events.slice(0, maxEvents);

    displayData.forEach((event, index) => {
        const eventDate = event['分析日期'] || '';
        const electricityUser = event['用电方'] || '';
        const electricityType = event['用电类型'] || '';
        const belongUnit = event['归属单元'] || '';
        const belongGrid = event['归属网格'] || '';
        const location = event['关联位置点'] || '';
        const meterNumber = event['电表编号'] || '';
        const meterEvent = event['电表事件'] || '';

        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';

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
                <span class="duration-info" title="用电类型" style="margin-left:8px;">${electricityType}</span>
            </div>
            <div class="event-row">
                <span class="label">用电方:</span>
                <span class="content" title="${electricityUser}">${electricityUser}</span>
                <span class="label" style="margin-left:8px;">单元:</span>
                <span class="content">${belongUnit}</span>
            </div>
            <div class="event-row">
                <span class="label">网格:</span>
                <span class="content" title="${belongGrid}">${belongGrid}</span>
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
}

function filterEventsByRegion(district, grid) {
    if (!eventDataCache || eventDataCache.length === 0) {
        console.log('事件缓存为空，跳过筛选');
        return;
    }

    let filtered = eventDataCache;

    if (district) {
        const districtKeyword = district.replace(/区|市|县/g, '');
        filtered = filtered.filter(e => {
            const unit = e['归属单元'] || '';
            return unit.includes(districtKeyword) || unit.includes(district);
        });
    }

    if (grid) {
        const gridKeyword = grid.replace(/网格/g, '');
        filtered = filtered.filter(e => {
            const g = e['归属网格'] || '';
            return g.includes(gridKeyword) || g.includes(grid);
        });
    }

    console.log(`事件筛选结果: 区县=${district}, 网格=${grid}, 筛选后=${filtered.length}/${eventDataCache.length}条`);
    renderEvents(filtered);
}

// 在实际应用中，这些函数应该直接从旧版本的 app.js 中复制过来，
// 或者通过模块化的方式进行复用，以确保功能完整性

// 知识库功能初始化
function initKnowledgeBase() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(menu => {
        menu.addEventListener('click', function() {
            menuItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            const category = this.innerText;
            loadFileList(category);
        });
    });

    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            uploadFile(file);
        });
        fileInput.value = '';
    });

    loadFileList('管理办法');
}

// 加载文件列表
function loadFileList(category) {
    const fileList = document.getElementById('file-list');
    const breadcrumbText = document.getElementById('breadcrumb-text');
    if (breadcrumbText) {
        breadcrumbText.textContent = `当前位置：知识库 > ${category}`;
    }

    renderFileList(category);
}

// 渲染文件列表
function renderFileList(category) {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;"><div class="spinner" style="margin:0 auto 10px;"></div>加载中...</td></tr>';

    fetch(`${API_BASE}/knowledge/files`)
        .then(res => res.json())
        .then(data => {
            const categoryFiles = data[category] || [];
            fileList.innerHTML = '';
            if (categoryFiles.length === 0) {
                fileList.innerHTML = '<tr><td colspan="4" class="no-files">暂无文件，请点击"上传文件"添加文件</td></tr>';
                return;
            }
            categoryFiles.forEach(file => {
                const fileItem = document.createElement('tr');
                fileItem.innerHTML = `
                    <td><span class="file-icon">${getFileIcon(file.type)}</span> ${file.name}</td>
                    <td>${getFileTypeLabel(file.type)}</td>
                    <td>${file.uploadDate || ''}</td>
                    <td class="file-actions">
                        <button class="download-btn" onclick="downloadFile('${file.filePath}')">下载</button>
                        <button class="delete-btn" onclick="deleteFile('${file.name}')">删除</button>
                    </td>
                `;
                fileList.appendChild(fileItem);
            });
        })
        .catch(err => {
            console.error('加载文件列表失败:', err);
            fileList.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#f44336;">加载文件列表失败</td></tr>';
        });
}

// 获取文件图标
function getFileIcon(fileType) {
    const icons = {
        'doc': '📄', 'docx': '📄',
        'xls': '📊', 'xlsx': '📊',
        'ppt': '📑', 'pptx': '📑',
        'pdf': '📕',
        'txt': '📃', 'md': '📃',
        'csv': '📋',
        'json': '📋', 'xml': '📋',
        'zip': '📦', 'rar': '📦', '7z': '📦'
    };
    return icons[fileType] || '📄';
}

function getFileTypeLabel(fileType) {
    const labels = {
        'docx': 'Word文档', 'doc': 'Word文档',
        'xlsx': 'Excel表格', 'xls': 'Excel表格',
        'pptx': 'PPT演示', 'ppt': 'PPT演示',
        'pdf': 'PDF文档',
        'txt': '文本文件', 'md': 'Markdown',
        'csv': 'CSV文件',
        'json': 'JSON文件', 'xml': 'XML文件',
        'zip': '压缩包', 'rar': '压缩包', '7z': '压缩包'
    };
    return labels[fileType] || '未知类型';
}

// 下载文件
function downloadFile(fileName) {
    console.log('下载文件:', fileName);
    const encodedFileName = encodeURIComponent(fileName);
    const downloadUrl = `${API_BASE}/knowledge/download/${encodedFileName}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 删除文件
function deleteFile(fileName) {
    if (confirm(`确定要删除文件 "${fileName}" 吗？`)) {
        const encodedName = encodeURIComponent(fileName);
        fetch(`${API_BASE}/knowledge/delete/${encodedName}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    loadFileList('管理办法');
                } else {
                    alert('删除失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(err => {
                console.error('删除文件失败:', err);
                alert('删除文件失败，请检查后端是否运行');
            });
    }
}

// 上传文件
function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', '管理办法');

    fetch(`${API_BASE}/knowledge/upload`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadFileList('管理办法');
        } else {
            alert('上传失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(err => {
        console.error('上传文件失败:', err);
        alert('上传文件失败，请检查后端是否运行');
    });
}