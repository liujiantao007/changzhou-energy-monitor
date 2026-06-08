// 主题系统 - 版本2驾驶舱
// 在 html 上设置 data-theme="xxx" 切换主题

const THEMES = [
    { id: 'default', name: '科技蓝(默认)' },
    { id: 'rose', name: '暗夜玫瑰粉' },
    { id: 'titanium', name: '高级钛羽灰' },
    { id: 'emerald', name: '低碳环保绿' },
    { id: 'cyberpunk', name: '赛博霓虹紫' },
    { id: 'amber', name: '琥珀曜石金' },
    { id: 'crimson', name: '红岩重工业' },
    { id: 'aurora', name: '极光幻境青' },
    { id: 'carbon', name: '极致纯黑碳' },
    { id: 'twilight', name: '暮光微醺蓝' },
    { id: 'ocean', name: '深海寂静蓝' },
    { id: 'light-tech', name: '浅色明亮模式' }
];

let _themeDropdown = null;

// 获取当前主题
function getCurrentTheme() {
    return document.documentElement.dataset.theme || 'default';
}

// 获取当前主题的颜色配置
function getThemeColors() {
    const id = getCurrentTheme();
    return THEME_CHART_COLORS[id] || THEME_CHART_COLORS.default;
}

// 应用主题
function applyTheme(themeId) {
    document.documentElement.dataset.theme = themeId;
    localStorage.setItem('dashboard-theme', themeId);
    updateEChartsTheme(themeId);
    updateThemeUI(themeId);
    // 重新执行图表更新函数，传入缓存数据使系列颜色跟随主题
    setTimeout(function() {
        var data = window.__lastChartData;
        if (!data) { console.warn('Theme: no cached data, skipping chart re-render'); return; }
        var timeType = (typeof window.getCurrentTrendTimeType === 'function') ? window.getCurrentTrendTimeType() : 'year';
        ['updateElectricityChart','updatePoiChart','updateElectricityTypeChart','updateConsumerTypeChart'].forEach(function(fn) {
            if (typeof window[fn] === 'function') {
                try { window[fn](data); } catch(e) { console.warn('Theme re-invoke error:', fn, e); }
            }
        });
        if (typeof window.updateEnergyTrendChart === 'function') {
            try { window.updateEnergyTrendChart(data, timeType); } catch(e) { console.warn('Theme re-invoke error:', 'updateEnergyTrendChart', e); }
        }
        if (typeof window.updateMap === 'function') {
            try { window.updateMap(data); } catch(e) { console.warn('Theme re-invoke error:', 'updateMap', e); }
        }
    }, 50);
}

// 更新 ECharts
function updateEChartsTheme(themeId) {
    const colors = THEME_CHART_COLORS[themeId] || THEME_CHART_COLORS.default;

    // 更新普通图表（非地图）
    if (window.charts) {
        Object.values(window.charts).forEach(inst => {
            if (inst && inst.setOption) {
                try {
                    inst.setOption({
                        color: colors.palette,
                        xAxis: {
                            axisLabel: { color: colors.axisLabel },
                            splitLine: { lineStyle: { color: colors.splitLine } }
                        },
                        yAxis: {
                            axisLabel: { color: colors.axisLabel },
                            splitLine: { lineStyle: { color: colors.splitLine } }
                        }
                    });
                } catch(e) {}
            }
        });
    }

    // 单独更新地图（地图没有 xAxis/yAxis，避免错误注入）
    if (window.mapChart && window.mapChart.setOption) {
        try {
            window.mapChart.setOption({
                visualMap: {
                    inRange: { color: colors.mapVisualMap },
                    textStyle: { color: colors.mapText },
                    borderWidth: 0,
                    backgroundColor: 'transparent'
                }
            });
        } catch(e) {}
    }
}

// 更新 UI
function updateThemeUI(themeId) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    // 版本切换按钮由 version2-app.js 管理，此处不修改
    if (_themeDropdown) {
        _themeDropdown.value = themeId;
    }
}

// 循环切换
function cycleTheme() {
    const current = getCurrentTheme();
    const idx = THEMES.findIndex(t => t.id === current);
    const nextIdx = (idx + 1) % THEMES.length;
    applyTheme(THEMES[nextIdx].id);
}

// 初始化
function initThemeSystem() {
    const saved = localStorage.getItem('dashboard-theme');
    const themeId = saved && THEMES.find(t => t.id === saved) ? saved : 'default';

    // 版本切换按钮交由 version2-app.js 处理版本切换，此处不绑定
    // 主题切换通过下拉框进行

    _themeDropdown = document.createElement('select');
    _themeDropdown.id = 'theme-dropdown';
    _themeDropdown.className = 'region-select';
    _themeDropdown.style.cssText = 'flex: none; width: auto; min-width: 108px; padding: 4px 6px; font-size: 12px; margin-left: 10px; border-radius: 4px; transform: translateX(-80px);';

    THEMES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        _themeDropdown.appendChild(opt);
    });

    _themeDropdown.addEventListener('change', function() {
        applyTheme(this.value);
    });

    // 插入到右侧操作区：有 version-toggle 时插入其前面；主题首页隐藏该按钮时追加到操作区
    var versionBtn = document.getElementById('version-toggle');
    if (versionBtn) {
        versionBtn.parentNode.insertBefore(_themeDropdown, versionBtn);
    } else {
        var actions = document.querySelector('.navbar-actions');
        if (actions) {
            actions.appendChild(_themeDropdown);
        }
    }

    applyTheme(themeId);
}

// ECharts 主题颜色
const THEME_CHART_COLORS = {
    default: {
        palette: ['#00D9FF', '#2B7DE9', '#5B9FFF', '#3A8BFF', '#4FC3F7', '#29B6F6', '#039BE5', '#0277BD', '#01579B'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#0B2348', '#1A4BA8', '#3A8BFF', '#4FC3F7', '#66BB6A', '#FFD54F', '#FFB74D', '#FF8A65', '#FF5252', '#D32F2F'],
        mapText: 'rgba(100,140,180,0.5)'
    },
    rose: {
        palette: ['#ff85c0', '#ff6da8', '#ff5590', '#ff3d78', '#e8506a', '#d04060', '#b83050', '#a02040', '#801030'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#1a0a14', '#3a1028', '#5a1a3c', '#7a2050', '#a03068', '#c04078', '#e05088', '#f06098', '#ff70a8', '#ff85c0'],
        mapText: 'rgba(200,150,180,0.5)'
    },
    titanium: {
        palette: ['#5cdbd3', '#4fc7bf', '#42b3ab', '#359f97', '#5a8c8c', '#6a7a7a', '#7a6868', '#8a5656', '#9a4444'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#050810', '#0e1a2c', '#1a2c48', '#264064', '#325480', '#3e689c', '#4a7cb8', '#5690d4', '#62a4f0', '#6eb8ff'],
        mapText: 'rgba(150,180,200,0.5)'
    },
    emerald: {
        palette: ['#30bf78', '#28a868', '#209158', '#187a48', '#30a060', '#288850', '#207040', '#185830', '#104020'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#040d0a', '#0a1e14', '#10301e', '#164228', '#1c5432', '#22663c', '#287846', '#2e8a50', '#349c5a', '#3aae64'],
        mapText: 'rgba(100,180,140,0.5)'
    },
    cyberpunk: {
        palette: ['#ff007f', '#e00070', '#c00060', '#a00050', '#ff3080', '#ff5090', '#00f0ff', '#00d0e0', '#00b0c0'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#0c051a', '#1c0a30', '#2c0f46', '#3c145c', '#4c1972', '#5c1e88', '#6c239e', '#7c28b4', '#8c2dca', '#9c32e0'],
        mapText: 'rgba(180,140,220,0.5)'
    },
    amber: {
        palette: ['#ff9900', '#e68800', '#cc7700', '#b36600', '#ffaa20', '#ffbb40', '#ffcc00', '#e6b800', '#cca300'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#0f0b05', '#261a0a', '#3d2910', '#543815', '#6b471a', '#82561f', '#996524', '#b07429', '#c7832e', '#de9233'],
        mapText: 'rgba(200,180,140,0.5)'
    },
    crimson: {
        palette: ['#ff4d4f', '#e04040', '#c03030', '#a02020', '#ff6060', '#ff7070', '#ff7875', '#e06860', '#c05850'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#0f0505', '#260a0a', '#3d0f0f', '#541414', '#6b1919', '#821e1e', '#992323', '#b02828', '#c72d2d', '#de3232'],
        mapText: 'rgba(200,140,140,0.5)'
    },
    aurora: {
        palette: ['#10ebd5', '#0ed4c0', '#0cbdab', '#0aa696', '#30e8c0', '#50e5a8', '#73d13d', '#60b830', '#4da023'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#030a16', '#081e30', '#0d324a', '#124664', '#175a7e', '#1c6e98', '#2182b2', '#2696cc', '#2baae6', '#30beff'],
        mapText: 'rgba(100,200,200,0.5)'
    },
    carbon: {
        palette: ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#1890ff', '#40a9ff', '#69c0ff', '#91d5ff', '#bae7ff'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.08)',
        mapVisualMap: ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#ffffff'],
        mapText: 'rgba(200,200,200,0.5)'
    },
    twilight: {
        palette: ['#b37feb', '#a068d8', '#8c51c5', '#783ab2', '#c090f0', '#d0a0f5', '#ff85c0', '#e070a8', '#c05a90'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#0a0b1e', '#181938', '#262752', '#34356c', '#424386', '#5051a0', '#5e5fba', '#6c6dd4', '#7a7bee', '#8889ff'],
        mapText: 'rgba(180,160,220,0.5)'
    },
    ocean: {
        palette: ['#00e5ff', '#00cce6', '#00b3cc', '#009ab3', '#00a1ff', '#008ae6', '#0073cc', '#005cb3', '#004599'],
        axisLabel: 'rgba(255,255,255,0.65)',
        splitLine: 'rgba(255,255,255,0.06)',
        mapVisualMap: ['#00061a', '#001438', '#002256', '#003074', '#003e92', '#004cb0', '#005ace', '#0068ec', '#0076ff', '#0084ff'],
        mapText: 'rgba(100,180,220,0.5)'
    },
    'light-tech': {
        palette: ['#1890ff', '#69c0ff', '#91d5ff', '#bae7ff', '#36cfc9', '#5cdbd3', '#73d13d', '#95de64', '#b7eb8f'],
        axisLabel: 'rgba(0,0,0,0.65)',
        splitLine: 'rgba(0,0,0,0.06)',
        mapVisualMap: ['#f0f2f5', '#d9e0e8', '#c0cedb', '#a7bccf', '#8eaac2', '#7598b5', '#5c86a8', '#43749b', '#2a628e', '#115081'],
        mapText: 'rgba(0,0,0,0.4)'
    }
};

// 导出到全局
window.THEMES = THEMES;
window.applyTheme = applyTheme;
window.cycleTheme = cycleTheme;
window.initThemeSystem = initThemeSystem;
window.THEME_CHART_COLORS = THEME_CHART_COLORS;
window.getThemeColors = getThemeColors;
