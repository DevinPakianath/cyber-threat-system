const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();

  // Login
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('.land-btn-ghost');
  await page.waitForSelector('.login-page');
  await page.fill('input[type="email"]', 'test@cti.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('.login-btn');
  await page.waitForTimeout(2500);

  // ── Threats view ────────────────────────────────
  await page.locator('.nav-item').filter({ hasText: 'Threats' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-threats.png') });
  console.log('[screenshot] view-threats.png');

  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-threats-scroll.png') });
  console.log('[screenshot] view-threats-scroll.png');

  // ── Live Feed view ───────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.nav-item').filter({ hasText: 'Live Feed' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-livefeed.png') });
  console.log('[screenshot] view-livefeed.png');

  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'view-livefeed-scroll.png') });
  console.log('[screenshot] view-livefeed-scroll.png');

  await browser.close();
  console.log('Done');
})();
