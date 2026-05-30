const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('.land-btn-primary'); // Get started
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'register.png') });

  await browser.close();
  console.log('Done');
})();
