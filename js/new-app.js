// 新版应用主逻辑

// API 基础路径配置
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

// 页面加载完成后执行
window.onload = function() {
    // 检查版本偏好
    checkVersionPreference();

    // 初始化版本切换按钮
    initVersionToggle();

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

    // 加载告警和事件信息（仅首次加载，不随时间维度切换刷新）
    setTimeout(() => {
        loadAlarms();
        loadEvents();
    }, 100);

    // 初始化知识库功能
    initKnowledgeBase();

    // 新版首页特定初始化
    initNewHomePage();
};

// 新版首页特定初始化
function initNewHomePage() {
    console.log('新版首页初始化');

    // 添加动画效果
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 * index);
    });

    const previewModules = document.querySelectorAll('.placeholder-module');
    previewModules.forEach((module, index) => {
        module.style.opacity = '0';

        setTimeout(() => {
            module.style.transition = 'all 0.5s ease';
            module.style.opacity = '1';
        }, 600 + index * 200);
    });
}

// 版本切换功能（与旧版保持一致）
function initVersionToggle() {
    console.log('执行 initVersionToggle()');
    const versionToggle = document.getElementById('version-toggle');
    console.log('版本切换按钮找到:', !!versionToggle);

    if (versionToggle) {
        console.log('按钮文字:', versionToggle.textContent);

        // 确保只添加一个事件监听器
        versionToggle.removeEventListener('click', toggleVersion);
        versionToggle.addEventListener('click', function() {
            console.log('版本切换按钮被点击');
            toggleVersion();
        });

        console.log('事件监听器已添加');
    } else {
        console.error('版本切换按钮未找到');
    }
}

function checkVersionPreference() {
    const savedVersion = localStorage.getItem('version');
    console.log('检查版本偏好: savedVersion =', savedVersion);
    if (savedVersion === 'old') {
        console.log('当前版本是旧版，切换到旧版');
        switchToOldVersion();
    } else {
        console.log('当前版本是新版，保持新版');
    }
}

function toggleVersion() {
    console.log('执行 toggleVersion()');
    const currentVersion = localStorage.getItem('version');
    console.log('当前版本:', currentVersion);

    if (currentVersion === 'old') {
        console.log('当前是旧版，将切换到新版');
        switchToNewVersion();
    } else {
        console.log('当前是新版，将切换到旧版');
        switchToOldVersion();
    }
}

function switchToNewVersion() {
    console.log('执行 switchToNewVersion()');
    localStorage.setItem('version', 'new');
    const versionToggle = document.getElementById('version-toggle');
    if (versionToggle) {
        versionToggle.textContent = '切换旧版';
        versionToggle.style.backgroundColor = '#1890ff';
    }
    // 保持在新版页面
    console.log('保持在新版');
}

function switchToOldVersion() {
    console.log('执行 switchToOldVersion()');
    localStorage.setItem('version', 'old');
    const versionToggle = document.getElementById('version-toggle');
    if (versionToggle) {
        versionToggle.textContent = '切换新版';
        versionToggle.style.backgroundColor = '#f5222d';
    }
    // 重定向到旧版页面
    window.location.href = 'index.html';
}

// 响应式缩放（与旧版保持一致）
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

// 页面导航（与旧版保持一致）
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

// 其他函数保持与旧版一致（省略...）
// 这些函数包括：
// - initTimeSelectors()
// - initRefreshButtons()
// - initCharts()
// - initMap()
// - loadData()
// - loadAlarms()
// - loadEvents()
// - initKnowledgeBase()
// - 以及其他辅助函数

// 为了保持代码简洁，这里省略了与旧版相同的函数
// 实际使用时，这些函数可以从旧版 app.js 中复制过来