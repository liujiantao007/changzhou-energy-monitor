// 测试浏览器环境的简单脚本
const http = require('http');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const targetUrl = 'http://localhost:65080';

console.log('=== 正在检查页面 ===');

// 获取页面内容
http.get(targetUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✓ 页面加载成功');

        // 创建 DOM
        const dom = new JSDOM(data, {
            runScripts: "dangerously"
        });

        const document = dom.window.document;

        // 检查版本切换按钮
        const versionToggle = document.getElementById('version-toggle');
        if (versionToggle) {
            console.log('✓ 找到版本切换按钮');
            console.log('  按钮文字:', versionToggle.textContent.trim());
            console.log('  按钮样式:', versionToggle.style.cssText);
        } else {
            console.log('✗ 未找到版本切换按钮');
        }

        // 检查 body 类名
        const body = document.body;
        if (body) {
            console.log('✓ 找到 body 标签');
            console.log('  body 类名:', body.className);
        }

        // 检查 app.js 引用
        const scripts = document.querySelectorAll('script');
        const appScript = Array.from(scripts).find(script => script.src.includes('app.js'));

        if (appScript) {
            console.log('✓ 找到 app.js 引用:', appScript.src);
        } else {
            console.log('✗ 未找到 app.js 引用');
        }

        console.log('=== 检查 app.js 文件 ===');

        const appJsUrl = 'http://localhost:65080/js/app.js';

        http.get(appJsUrl, (appRes) => {
            let appData = '';

            appRes.on('data', (chunk) => {
                appData += chunk;
            });

            appRes.on('end', () => {
                console.log('✓ app.js 文件加载成功 (大小:', appData.length, '字节)');

                // 检查函数定义
                const functions = ['initVersionToggle', 'checkVersionPreference', 'toggleVersion', 'switchToNewVersion', 'switchToOldVersion'];
                functions.forEach(func => {
                    const regex = new RegExp(`function\\s+${func}`, 'g');
                    const found = (appData.match(regex) || []).length;
                    if (found > 0) {
                        console.log(`✓ 找到函数: ${func}`);
                    } else {
                        console.log(`✗ 未找到函数: ${func}`);
                    }
                });

                // 检查 window.onload
                if (appData.includes('window.onload')) {
                    console.log('✓ 找到 window.onload');
                    const onLoadMatch = appData.match(/window\.onload\s*=\s*function\s*\(\)[\s\S]*?(\{[\s\S]*?\})/);
                    if (onLoadMatch) {
                        console.log(`  函数内容 (前 50 个字符):`, onLoadMatch[1].substring(0, 50));
                    }
                }
            });
        }).on('error', (e) => {
            console.log('✗ 无法加载 app.js 文件:', e.message);
        });
    });
}).on('error', (e) => {
    console.log('✗ 无法加载页面:', e.message);
});
