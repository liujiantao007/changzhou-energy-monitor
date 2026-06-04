// 在浏览器中运行测量
const puppeteer = require('puppeteer');

async function runMeasurement() {
    console.log('=== 正在启动浏览器测量 ===');

    try {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        });
        const page = await browser.newPage();

        // 导航到测量页面
        await page.goto('http://localhost:65081/measure-button-width.html', {
            waitUntil: 'networkidle0'
        });

        // 等待测量完成
        await page.waitForSelector('#measurement', { visible: true });

        // 测量按钮尺寸
        const measurementText = await page.evaluate(() => {
            const measurementDiv = document.getElementById('measurement');

            // 点击重新测量按钮
            document.getElementById('refresh').click();

            // 等待测量完成
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(measurementDiv.textContent.trim());
                }, 500);
            });
        });

        console.log('=== 测量结果 ===');
        console.log(measurementText);

        // 点击计算按钮
        const distanceText = await page.evaluate(() => {
            document.getElementById('calculate').click();

            // 等待计算完成
            return new Promise((resolve) => {
                setTimeout(() => {
                    const measurementDiv = document.getElementById('measurement');
                    resolve(measurementDiv.textContent.trim());
                }, 500);
            });
        });

        console.log('=== 20%距离计算 ===');
        console.log(distanceText);

        await browser.close();
    } catch (error) {
        console.error('测量过程中出错:', error);
    }
}

runMeasurement();
