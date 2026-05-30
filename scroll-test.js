const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Stats section
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-stats.png') });

  // Features grid
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-features-top.png') });

  // Features grid lower half
  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-features-bottom.png') });

  // CTA banner + footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-cta-footer.png') });

  // Full page
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-full.png'), fullPage: true });

  await browser.close();
  console.log('Done');
})();
