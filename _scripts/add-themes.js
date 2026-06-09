const fs = require('fs');
const path = 'C:/Users/Dean/Documents/Code/project_dianfei_claude/css/version2-style.css';
let css = fs.readFileSync(path, 'utf8');

// Find where to insert theme blocks - after the default theme block (the closing })
// The variable block ends with:
// }
//
// /* 全局样式重置 */
// Find this point
const insertMarker = '\n/* 全局样式重置 */';
if (!css.includes(insertMarker)) {
    console.error('Could not find insert marker');
    process.exit(1);
}

const themes = {
    rose: {
        name: '暗夜玫瑰粉',
        bgBody: '#0f050c',
        bgPanelRgb: '38, 14, 27',
        bgNavbarStartRgb: '20, 8, 14',
        bgNavbarEndRgb: '15, 5, 10',
        bgLoadingStartRgb: '25, 12, 18',
        bgLoadingEndRgb: '12, 4, 8',
        bgIframeOverlay: 'rgba(15, 5, 10, 0.9)',
        accentPrimary: '#ff85c0',
        accentRgb: '255, 133, 192',
        accentSecondary: '#ffd591',
        accentDimRgb: '200, 80, 130',
        accentSecondaryRgb: '255, 213, 145',
        textPrimary: 'rgba(255, 255, 255, 0.9)',
        brandStart: '#ff85c0',
        brandEnd: '#ffd591',
    },
    titanium: {
        name: '高级钛羽灰',
        bgBody: '#050810',
        bgPanelRgb: '16, 26, 44',
        bgNavbarStartRgb: '8, 14, 28',
        bgNavbarEndRgb: '5, 8, 16',
        bgLoadingStartRgb: '12, 20, 36',
        bgLoadingEndRgb: '5, 8, 16',
        bgIframeOverlay: 'rgba(5, 8, 16, 0.9)',
        accentPrimary: '#5cdbd3',
        accentRgb: '92, 219, 211',
        accentSecondary: '#ffd591',
        accentDimRgb: '50, 160, 150',
        accentSecondaryRgb: '255, 213, 145',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#5cdbd3',
        brandEnd: '#ffd591',
    },
    emerald: {
        name: '低碳环保绿',
        bgBody: '#040d0a',
        bgPanelRgb: '12, 34, 27',
        bgNavbarStartRgb: '8, 22, 16',
        bgNavbarEndRgb: '4, 12, 8',
        bgLoadingStartRgb: '10, 28, 20',
        bgLoadingEndRgb: '3, 10, 6',
        bgIframeOverlay: 'rgba(4, 12, 8, 0.9)',
        accentPrimary: '#30bf78',
        accentRgb: '48, 191, 120',
        accentSecondary: '#a2f5ad',
        accentDimRgb: '30, 140, 80',
        accentSecondaryRgb: '162, 245, 173',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#30bf78',
        brandEnd: '#a2f5ad',
    },
    cyberpunk: {
        name: '赛博霓虹紫',
        bgBody: '#0c051a',
        bgPanelRgb: '28, 12, 48',
        bgNavbarStartRgb: '18, 8, 35',
        bgNavbarEndRgb: '10, 4, 22',
        bgLoadingStartRgb: '24, 10, 42',
        bgLoadingEndRgb: '8, 3, 18',
        bgIframeOverlay: 'rgba(10, 4, 22, 0.9)',
        accentPrimary: '#ff007f',
        accentRgb: '255, 0, 127',
        accentSecondary: '#00f0ff',
        accentDimRgb: '180, 0, 90',
        accentSecondaryRgb: '0, 240, 255',
        textPrimary: 'rgba(255, 255, 255, 0.9)',
        brandStart: '#ff007f',
        brandEnd: '#00f0ff',
    },
    amber: {
        name: '琥珀曜石金',
        bgBody: '#0f0b05',
        bgPanelRgb: '34, 25, 14',
        bgNavbarStartRgb: '24, 18, 10',
        bgNavbarEndRgb: '14, 10, 5',
        bgLoadingStartRgb: '30, 22, 12',
        bgLoadingEndRgb: '12, 8, 3',
        bgIframeOverlay: 'rgba(14, 10, 5, 0.9)',
        accentPrimary: '#ff9900',
        accentRgb: '255, 153, 0',
        accentSecondary: '#ffcc00',
        accentDimRgb: '180, 100, 0',
        accentSecondaryRgb: '255, 204, 0',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#ff9900',
        brandEnd: '#ffcc00',
    },
    crimson: {
        name: '红岩重工业',
        bgBody: '#0f0505',
        bgPanelRgb: '36, 14, 14',
        bgNavbarStartRgb: '26, 10, 10',
        bgNavbarEndRgb: '16, 5, 5',
        bgLoadingStartRgb: '32, 12, 12',
        bgLoadingEndRgb: '14, 4, 4',
        bgIframeOverlay: 'rgba(16, 5, 5, 0.9)',
        accentPrimary: '#ff4d4f',
        accentRgb: '255, 77, 79',
        accentSecondary: '#ff7875',
        accentDimRgb: '180, 40, 40',
        accentSecondaryRgb: '255, 120, 117',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#ff4d4f',
        brandEnd: '#ff7875',
    },
    aurora: {
        name: '极光幻境青',
        bgBody: '#030a16',
        bgPanelRgb: '10, 35, 56',
        bgNavbarStartRgb: '6, 22, 40',
        bgNavbarEndRgb: '3, 10, 20',
        bgLoadingStartRgb: '8, 30, 50',
        bgLoadingEndRgb: '2, 8, 16',
        bgIframeOverlay: 'rgba(3, 10, 20, 0.9)',
        accentPrimary: '#10ebd5',
        accentRgb: '16, 235, 213',
        accentSecondary: '#73d13d',
        accentDimRgb: '10, 170, 150',
        accentSecondaryRgb: '115, 209, 61',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#10ebd5',
        brandEnd: '#73d13d',
    },
    carbon: {
        name: '极致纯黑碳',
        bgBody: '#000000',
        bgPanelRgb: '20, 20, 20',
        bgNavbarStartRgb: '14, 14, 14',
        bgNavbarEndRgb: '8, 8, 8',
        bgLoadingStartRgb: '18, 18, 18',
        bgLoadingEndRgb: '6, 6, 6',
        bgIframeOverlay: 'rgba(8, 8, 8, 0.9)',
        accentPrimary: '#ffffff',
        accentRgb: '255, 255, 255',
        accentSecondary: '#1890ff',
        accentDimRgb: '120, 120, 120',
        accentSecondaryRgb: '24, 144, 255',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#ffffff',
        brandEnd: '#1890ff',
        // Special overrides
        special: {
            '--border-light': 'rgba(255, 255, 255, 0.1)',
            '--badge-info': '#1890ff',
            '--badge-info-end': '#096dd9',
        }
    },
    twilight: {
        name: '暮光微醺蓝',
        bgBody: '#0a0b1e',
        bgPanelRgb: '25, 27, 61',
        bgNavbarStartRgb: '16, 18, 44',
        bgNavbarEndRgb: '10, 11, 26',
        bgLoadingStartRgb: '22, 24, 55',
        bgLoadingEndRgb: '8, 9, 22',
        bgIframeOverlay: 'rgba(10, 11, 26, 0.9)',
        accentPrimary: '#b37feb',
        accentRgb: '179, 127, 235',
        accentSecondary: '#ff85c0',
        accentDimRgb: '120, 80, 180',
        accentSecondaryRgb: '255, 133, 192',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#b37feb',
        brandEnd: '#ff85c0',
    },
    ocean: {
        name: '深海寂静蓝',
        bgBody: '#00061a',
        bgPanelRgb: '4, 21, 54',
        bgNavbarStartRgb: '2, 14, 40',
        bgNavbarEndRgb: '1, 6, 22',
        bgLoadingStartRgb: '3, 18, 48',
        bgLoadingEndRgb: '1, 5, 18',
        bgIframeOverlay: 'rgba(1, 6, 22, 0.9)',
        accentPrimary: '#00e5ff',
        accentRgb: '0, 229, 255',
        accentSecondary: '#00a1ff',
        accentDimRgb: '0, 160, 200',
        accentSecondaryRgb: '0, 161, 255',
        textPrimary: 'rgba(255, 255, 255, 0.85)',
        brandStart: '#00e5ff',
        brandEnd: '#00a1ff',
    },
    'light-tech': {
        name: '浅色明亮模式',
        bgBody: '#f0f2f5',
        bgPanelRgb: '255, 255, 255',
        bgNavbarStartRgb: '255, 255, 255',
        bgNavbarEndRgb: '240, 240, 240',
        bgLoadingStartRgb: '255, 255, 255',
        bgLoadingEndRgb: '240, 240, 240',
        bgIframeOverlay: 'rgba(240, 240, 240, 0.95)',
        bgOverlay: 'rgba(255, 255, 255, 0.85)',
        accentPrimary: '#1890ff',
        accentRgb: '24, 144, 255',
        accentSecondary: '#69c0ff',
        accentDimRgb: '24, 110, 200',
        accentSecondaryRgb: '105, 192, 255',
        textPrimary: 'rgba(0, 0, 0, 0.85)',
        textSecondary: 'rgba(0, 0, 0, 0.6)',
        textDim: 'rgba(0, 0, 0, 0.5)',
        textMuted: 'rgba(0, 0, 0, 0.4)',
        textLabel: '#8c8c8c',
        textContent: 'rgba(80, 80, 100, 0.8)',
        textTimeinfo: 'rgba(120, 120, 140, 0.6)',
        brandStart: '#1890ff',
        brandEnd: '#69c0ff',
        shadowSm: 'rgba(0, 0, 0, 0.08)',
        shadowMd: 'rgba(0, 0, 0, 0.12)',
        // Special overrides for light mode
        special: {
            '--border-light': 'rgba(0, 0, 0, 0.08)',
            '--color-positive': '#ff4d4f',
            '--color-negative': '#52c41a',
            '--color-neutral': '#faad14',
        }
    }
};

// Generate theme blocks
let themeBlocks = '';
Object.entries(themes).forEach(([id, t]) => {
    const panelBg = `rgba(${t.bgPanelRgb}, 0.65)${id === 'light-tech' ? ', 0.95)' : ', 0.65)'}`;
    themeBlocks += `\n/* ---- ${t.name} ---- */\n`;
    themeBlocks += `[data-theme="${id}"] {\n`;
    themeBlocks += `    --bg-body: ${t.bgBody};\n`;
    themeBlocks += `    --bg-panel: rgba(${t.bgPanelRgb}, ${id === 'light-tech' ? '0.95' : '0.65'});\n`;
    themeBlocks += `    --bg-navbar-start-rgb: ${t.bgNavbarStartRgb};\n`;
    themeBlocks += `    --bg-navbar-end-rgb: ${t.bgNavbarEndRgb};\n`;
    themeBlocks += `    --bg-loading-start-rgb: ${t.bgLoadingStartRgb};\n`;
    themeBlocks += `    --bg-loading-end-rgb: ${t.bgLoadingEndRgb};\n`;
    themeBlocks += `    --bg-iframe-overlay: ${t.bgIframeOverlay};\n`;
    if (t.bgOverlay) {
        themeBlocks += `    --bg-overlay: ${t.bgOverlay};\n`;
    }
    themeBlocks += `    --accent-primary: ${t.accentPrimary};\n`;
    themeBlocks += `    --accent-rgb: ${t.accentRgb};\n`;
    themeBlocks += `    --accent-secondary: ${t.accentSecondary};\n`;
    themeBlocks += `    --accent-dim-rgb: ${t.accentDimRgb};\n`;
    themeBlocks += `    --accent-secondary-rgb: ${t.accentSecondaryRgb};\n`;
    themeBlocks += `    --text-primary: ${t.textPrimary};\n`;
    themeBlocks += `    --text-secondary: ${t.textSecondary || 'rgba(255, 255, 255, 0.6)'};\n`;
    themeBlocks += `    --text-dim: ${t.textDim || 'rgba(255, 255, 255, 0.5)'};\n`;
    themeBlocks += `    --text-muted: ${t.textMuted || 'rgba(255, 255, 255, 0.4)'};\n`;
    if (t.textLabel) themeBlocks += `    --text-label: ${t.textLabel};\n`;
    if (t.textContent) themeBlocks += `    --text-content: ${t.textContent};\n`;
    if (t.textTimeinfo) themeBlocks += `    --text-timeinfo: ${t.textTimeinfo};\n`;
    if (t.shadowSm) themeBlocks += `    --shadow-sm: ${t.shadowSm};\n`;
    if (t.shadowMd) themeBlocks += `    --shadow-md: ${t.shadowMd};\n`;
    themeBlocks += `    --brand-start: ${t.brandStart};\n`;
    themeBlocks += `    --brand-end: ${t.brandEnd};\n`;
    // Special overrides
    if (t.special) {
        Object.entries(t.special).forEach(([k, v]) => {
            themeBlocks += `    ${k}: ${v};\n`;
        });
    }
    themeBlocks += `}\n`;
});

// Insert before the global reset section
const idx = css.indexOf(insertMarker);
const newCss = css.substring(0, idx) + themeBlocks + css.substring(idx);
fs.writeFileSync(path, newCss, 'utf8');
console.log(`Added ${Object.keys(themes).length} theme blocks`);
console.log('New file size:', newCss.length, 'bytes');
