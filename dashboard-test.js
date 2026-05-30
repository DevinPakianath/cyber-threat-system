const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Go to login
  await page.click('.land-btn-ghost');
  await page.waitForSelector('.login-page');

  // Fill credentials and submit
  await page.fill('input[type="email"]', 'test@cti.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('.login-btn');

  // Wait for dashboard to appear
  await page.waitForSelector('.dashboard', { timeout: 8000 }).catch(() => null);
  await page.waitForTimeout(2000); // let data load

  // Dashboard top (overview)
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dash-1-overview.png') });

  // Scroll down to see charts / tables
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dash-2-mid.png') });

  // Scroll further
  await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dash-3-bottom.png') });

  // Try sidebar nav items if present
  const navItems = await page.locator('.sidebar-item, .nav-item, [data-view]').all();
  console.log('Nav items found:', navItems.length);

  // Full page snapshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dash-full.png'), fullPage: true });

  await browser.close();
  console.log('Done');
})();
