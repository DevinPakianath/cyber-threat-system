const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('.land-btn-ghost');
  await page.waitForSelector('.login-page');
  await page.screenshot({ path: path.join(SCREENSHOTS, 'compare-login.png') });

  // Register
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('.land-btn-primary');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'compare-register.png') });

  await browser.close();
  console.log('Done');
})();
