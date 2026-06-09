const fs = require('fs');
const path = 'C:/Users/Dean/Documents/Code/project_dianfei_claude/css/version2-style.css';
let css = fs.readFileSync(path, 'utf8');
const original = css;

// ============================================================
// STEP 1: Define variable block
// ============================================================
const variablesBlock = `/* ========================================
   主题系统 - CSS 变量定义
   在 html 上设置 data-theme="xxx" 切换主题
   ======================================== */

/* ---- 默认主题 (科技蓝) ---- */
:root,
[data-theme="default"] {
    /* 背景色 */
    --bg-body: #06142D;
    --bg-panel: #0B2348;
    --bg-navbar-start-rgb: 6, 20, 50;
    --bg-navbar-end-rgb: 4, 14, 35;
    --bg-overlay: rgba(0, 0, 0, 0.85);
    --bg-loading-start-rgb: 6, 30, 65;
    --bg-loading-end-rgb: 2, 15, 40;
    --bg-iframe-overlay: rgba(2, 8, 20, 0.9);

    /* 强调色 */
    --accent-primary: #00d4ff;
    --accent-rgb: 0, 180, 255;
    --accent-secondary: #3A8BFF;
    --accent-dim-rgb: 0, 120, 200;
    --accent-secondary-rgb: 58, 139, 255;

    /* 文字色 */
    --text-primary: rgba(255, 255, 255, 0.85);
    --text-secondary: rgba(255, 255, 255, 0.6);
    --text-dim: rgba(255, 255, 255, 0.5);
    --text-muted: rgba(255, 255, 255, 0.4);
    --text-label: #596d86;
    --text-content: rgba(150, 180, 220, 0.7);
    --text-timeinfo: rgba(100, 140, 180, 0.5);

    /* 状态色 */
    --color-positive: #ff4d4f;
    --color-negative: #52c41a;
    --color-neutral: #faad14;

    /* 告警等级色 */
    --badge-critical: #ff1744;
    --badge-critical-end: #d50000;
    --badge-warning-start: #ff9100;
    --badge-warning-end: #ff6d00;
    --badge-info: #3A8BFF;
    --badge-info-end: #2B7DE9;
    --badge-normal-start: #69f0ae;
    --badge-normal-end: #00c853;

    /* 品牌色 (导航标题渐变) */
    --brand-start: #00d4ff;
    --brand-end: #4fc3f7;

    /* 通用 */
    --text-white: #ffffff;
    --border-light: rgba(0, 180, 255, 0.1);
    --shadow-sm: rgba(0, 0, 0, 0.3);
    --shadow-md: rgba(0, 0, 0, 0.5);
}

`;

// ============================================================
// STEP 2: Apply replacements in order (specific -> general)
// ============================================================

// Hex colors (specific first)
const hexReplacements = {
    '#06142D': 'var(--bg-body)',
    '#0B2348': 'var(--bg-panel)',
    '#00d4ff': 'var(--accent-primary)',
    '#4fc3f7': 'var(--brand-end)',
    '#3A8BFF': 'var(--accent-secondary)',
    '#2B7DE9': 'var(--badge-info-end)',
    '#ff4d4f': 'var(--color-positive)',
    '#52c41a': 'var(--color-negative)',
    '#faad14': 'var(--color-neutral)',
    '#596d86': 'var(--text-label)',
    '#ff1744': 'var(--badge-critical)',
    '#d50000': 'var(--badge-critical-end)',
    '#ff9100': 'var(--badge-warning-start)',
    '#ff6d00': 'var(--badge-warning-end)',
    '#69f0ae': 'var(--badge-normal-start)',
    '#00c853': 'var(--badge-normal-end)',
    '#00e5ff': 'var(--accent-primary)',
    '#0091ea': 'var(--accent-primary)',
    '#00b0ff': 'var(--accent-primary)',
};

Object.entries(hexReplacements).forEach(([oldC, newC]) => {
    css = css.split(oldC).join(newC);
});

// Handle standalone white -> var(--text-white)
css = css.replace(/: white;/g, ': var(--text-white);');
css = css.replace(/: white,/g, ': var(--text-white),');

// RGBA replacements (most specific first)
// Accent-based rgba - replace ALL 0,180,255 variants with var(--accent-rgb)
css = css.replace(/rgba\(0, 180, 255, /g, 'rgba(var(--accent-rgb), ');
// Also unify the slightly different 0,217,255
css = css.replace(/rgba\(0, 217, 255, /g, 'rgba(var(--accent-rgb), ');

// Accent-dim rgba
css = css.replace(/rgba\(0, 120, 200, /g, 'rgba(var(--accent-dim-rgb), ');

// Text color whites
css = css.replace(/rgba\(255, 255, 255, 0\.85\)/g, 'var(--text-primary)');
css = css.replace(/rgba\(255, 255, 255, 0\.6\)/g, 'var(--text-secondary)');
css = css.replace(/rgba\(255, 255, 255, 0\.5\)/g, 'var(--text-dim)');
css = css.replace(/rgba\(255, 255, 255, 0\.4\)/g, 'var(--text-muted)');

// Navbar/loading backgrounds
css = css.replace(/rgba\(6, 20, 50, 0\.95\)/g, 'rgba(var(--bg-navbar-start-rgb), 0.95)');
css = css.replace(/rgba\(4, 14, 35, 0\.9\)/g, 'rgba(var(--bg-navbar-end-rgb), 0.9)');
css = css.replace(/rgba\(6, 30, 65, 0\.9\)/g, 'rgba(var(--bg-loading-start-rgb), 0.9)');
css = css.replace(/rgba\(2, 15, 40, 0\.95\)/g, 'rgba(var(--bg-loading-end-rgb), 0.95)');
css = css.replace(/rgba\(2, 8, 20, 0\.9\)/g, 'var(--bg-iframe-overlay)');

// Fixed semantic colors (keep as-is or use direct values)
// These are status indicator backgrounds that should stay fixed

// Text content and timeinfo
css = css.replace(/rgba\(150, 180, 220, 0\.7\)/g, 'var(--text-content)');
css = css.replace(/rgba\(100, 140, 180, 0\.5\)/g, 'var(--text-timeinfo)');

// Shadow replacements
css = css.replace(/rgba\(0, 0, 0, 0\.5\)/g, 'var(--shadow-md)');
css = css.replace(/rgba\(0, 0, 0, 0\.3\)/g, 'var(--shadow-sm)');
css = css.replace(/rgba\(0, 0, 0, 0\.85\)/g, 'var(--bg-overlay)');

// ============================================================
// STEP 3: Fix duplicate/broken loading styles
// ============================================================
// There are two .loading-content and .loading-spinner blocks
// The second one (starting ~line 908) is a broken duplicate with white bg
// We need to remove everything from the orphan "display: flex" at line 908
// to the second @keyframes spin

// Find the broken duplicate block pattern
const brokenBlockPattern = `    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-content {
    background-color: var(--text-white);
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 20px var(--shadow-sm);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e3f2fd;
    border-top: 4px solid #1976d2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {`;

const replacementBlock = `    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

@keyframes spin {`;

if (css.includes(brokenBlockPattern)) {
    css = css.replace(brokenBlockPattern, replacementBlock);
    console.log('Removed duplicate/broken loading styles');
} else {
    console.log('Broken block pattern not found exactly, checking...');
    // Try alternative patterns
    if (css.includes('background-color: var(--text-white);') && css.includes('#e3f2fd')) {
        console.log('Found white background content with #e3f2fd - removing manually');
        // Remove the duplicate section more aggressively
        const lines = css.split('\n');
        let newLines = [];
        let skipSection = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('background-color: var(--text-white);') && line.includes('padding: 30px')) {
                skipSection = true;
            }
            if (skipSection && line.includes('@keyframes spin')) {
                skipSection = false;
                newLines.push(line);
                continue;
            }
            if (!skipSection) {
                newLines.push(line);
            }
        }
        css = newLines.join('\n');
    }
}

// ============================================================
// STEP 4: Prepend variables and write
// ============================================================
css = variablesBlock + css;

fs.writeFileSync(path, css, 'utf8');

// Stats
const remainingHex = css.match(/#[0-9a-fA-F]{6}/g) || [];
const uniqueRemaining = [...new Set(remainingHex)].filter(h => h !== '#e3f2fd' && h !== '#1976d2');
console.log('=== Transformation Complete ===');
console.log('Original:', original.length, 'bytes');
console.log('New:', css.length, 'bytes');
console.log('Variable hex colors remaining:', uniqueRemaining.length);
if (uniqueRemaining.length > 0) {
    console.log('Remaining hex:', uniqueRemaining.join(', '));
}
console.log('Spin keyframes:', (css.match(/@keyframes spin/g) || []).length);
