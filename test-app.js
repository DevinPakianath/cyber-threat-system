const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS = 'D:\\cyber threat system\\screenshots';
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

async function shot(page, name) {
  const p = path.join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[screenshot] ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  // ── 1. Landing page ─────────────────────────────
  console.log('\n=== 1. Landing page ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await shot(page, '1-landing');
  const heading = await page.textContent('h1').catch(() => null);
  console.log('H1:', heading?.trim());
  const navBrand = await page.textContent('.land-nav-brand').catch(() => null);
  console.log('Nav brand:', navBrand?.trim());
  const statsCount = await page.locator('.land-stat').count();
  console.log('Stat items:', statsCount);
  const featureCount = await page.locator('.land-feature-card').count();
  console.log('Feature cards:', featureCount);

  // ── 2. Click "Sign in" → Login page ─────────────
  console.log('\n=== 2. Navigate to Login ===');
  await page.click('.land-btn-ghost');
  await page.waitForSelector('.login-page', { timeout: 5000 });
  await shot(page, '2-login');
  const loginH2 = await page.textContent('h2').catch(() => null);
  console.log('Login heading:', loginH2?.trim());

  // ── 3. Bad credentials → error message ──────────
  console.log('\n=== 3. Login error handling ===');
  await page.fill('input[type="email"]', 'bad@test.com');
  await page.fill('input[type="password"]', 'wrongpass');
  await page.click('.login-btn');
  await page.waitForTimeout(2000);
  const errMsg = await page.textContent('.login-error').catch(() => null);
  console.log('Error shown:', errMsg ? 'YES — ' + errMsg.trim() : 'NO');
  await shot(page, '3-login-error');

  // ── 4. Back to landing via reload ───────────────
  console.log('\n=== 4. Reload → landing ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const onLanding = await page.locator('.land-page').count();
  console.log('Landing page shown on reload:', onLanding > 0 ? 'YES' : 'NO');
  await shot(page, '4-reload-landing');

  // ── 5. Get started → Register page ──────────────
  console.log('\n=== 5. Navigate to Register ===');
  await page.click('.land-btn-primary');
  await page.waitForTimeout(1000);
  const registerVisible = await page.locator('.login-split').count();
  console.log('Register/form page shown:', registerVisible > 0 ? 'YES' : 'NO');
  await shot(page, '5-register');

  // ── 6. Console errors ────────────────────────────
  console.log('\n=== Console errors ===');
  if (errors.length === 0) {
    console.log('No JS errors detected.');
  } else {
    errors.forEach(e => console.log('ERROR:', e));
  }

  await browser.close();
  console.log('\nAll screenshots saved to:', SCREENSHOTS);
})();
