// 测试测量页面的脚本
const http = require('http');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const targetUrl = 'http://localhost:65081/measure-button-width.html';

console.log('=== 正在检查测量页面 ===');

// 获取页面内容
http.get(targetUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✓ 测量页面加载成功');

        // 创建 DOM
        const dom = new JSDOM(data, {
            runScripts: "dangerously"
        });

        const document = dom.window.document;

        // 检查按钮
        const displayToggle = document.getElementById('display-mode-toggle');
        if (displayToggle) {
            console.log('✓ 找到弹出模式按钮');
            console.log('  按钮文字:', displayToggle.textContent.trim());
            console.log('  按钮样式:', displayToggle.style.cssText);
        } else {
            console.log('✗ 未找到弹出模式按钮');
        }

        const versionToggle = document.getElementById('version-toggle');
        if (versionToggle) {
            console.log('✓ 找到版本切换按钮');
            console.log('  按钮文字:', versionToggle.textContent.trim());
            console.log('  按钮样式:', versionToggle.style.cssText);
        } else {
            console.log('✗ 未找到版本切换按钮');
        }

        // 检查按钮尺寸
        const measurementDiv = document.getElementById('measurement');
        if (measurementDiv) {
            console.log('✓ 找到测量结果区域');
            console.log('  内容:', measurementDiv.textContent.trim());
        } else {
            console.log('✗ 未找到测量结果区域');
        }
    });
}).on('error', (e) => {
    console.log('✗ 无法加载测量页面:', e.message);
});
