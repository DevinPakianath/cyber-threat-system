const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('.land-btn-ghost');
  await page.waitForSelector('.login-page');
  await page.fill('input[type="email"]', 'test@cti.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('.login-btn');
  await page.waitForTimeout(2500);

  await page.locator('.nav-item').filter({ hasText: 'Settings' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-settings-top.png') });

  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-settings-bottom.png') });

  await browser.close();
  console.log('Done');
})();
