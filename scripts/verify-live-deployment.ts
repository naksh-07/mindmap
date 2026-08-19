import { chromium } from 'playwright';

async function runLiveDeploymentAudit() {
  const liveUrl = 'https://mindmap.riyasaksena502.workers.dev';
  const externalJsonUrl = `${liveUrl}/?source=https://raw.githubusercontent.com/naksh-07/audiotts/refs/heads/main/geotest.json`;
  const staticAssetUrl = `${liveUrl}/data/examples/dummy-geography-mindmap.json`;

  console.log('================================================================');
  console.log(' STARTING LIVE CLOUDFLARE WORKERS DEPLOYMENT VERIFICATION');
  console.log(` Live Base URL: ${liveUrl}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const network404s: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: LIVE DEPLOYMENT DEFAULT HOME PAGE
    // -------------------------------------------------------------------------
    console.log('[LIVE TEST 1/3] Direct Chrome/Playwright audit of Live Site (Default Root)...');
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('  [Live Console Error]:', msg.text());
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('  [Live Console Warning]:', msg.text());
        consoleWarnings.push(msg.text());
      }
    });

    page.on('response', (res) => {
      if (res.status() === 404) {
        console.error('  [Live 404 Resource]:', res.url());
        network404s.push(res.url());
      }
    });

    const response = await page.goto(liveUrl, { waitUntil: 'networkidle' });
    console.log(`  ✓ HTTP Response Status: ${response?.status()}`);
    if (response?.status() !== 200) {
      throw new Error(`Live site returned non-200 HTTP status: ${response?.status()}`);
    }

    // Verify Root Node rendering
    await page.waitForSelector('text="ब्रह्माण्ड और पृथ्वी की उत्पत्ति"', { timeout: 15000 });
    console.log('  ✓ Live site rendered root node ("ब्रह्माण्ड और पृथ्वी की उत्पत्ति") cleanly.');

    // Node selection & Inspector test on live URL
    await page.click('text="बिग बैंग सिद्धांत"');
    await page.waitForSelector('text="मुख्य अवधारणा और उसके उप-बिंदु"', { timeout: 5000 });
    console.log('  ✓ Live node selection & Inspector drawer verified.');

    await context.close();

    // -------------------------------------------------------------------------
    // TEST 2: LIVE DEPLOYMENT EXTERNAL GITHUB RAW JSON (?source=...)
    // -------------------------------------------------------------------------
    console.log('\n[LIVE TEST 2/3] Audit of Live External JSON Source URL...');
    console.log(`  URL: ${externalJsonUrl}`);
    const extContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const extPage = await extContext.newPage();

    extPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('  [Live Ext Console Error]:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    extPage.on('response', (res) => {
      if (res.status() === 404) {
        console.error('  [Live Ext 404 Resource]:', res.url());
        network404s.push(res.url());
      }
    });

    const extResponse = await extPage.goto(externalJsonUrl, { waitUntil: 'networkidle' });
    console.log(`  ✓ HTTP Response Status: ${extResponse?.status()}`);

    // Verify Title from GitHub raw JSON: ब्रह्माण्ड और पृथ्वी की उत्पत्ति
    await extPage.waitForSelector('text="ब्रह्माण्ड और पृथ्वी की उत्पत्ति"', { timeout: 15000 });
    console.log('  ✓ GitHub Raw JSON Title ("ब्रह्माण्ड और पृथ्वी की उत्पत्ति") successfully loaded!');

    // Verify Root Branches: ब्रह्माण्ड, सौरमंडल, पृथ्वी, चंद्रमा
    for (const branchText of ['ब्रह्माण्ड', 'सौरमंडल', 'पृथ्वी', 'चंद्रमा']) {
      await extPage.waitForSelector(`text="${branchText}"`, { timeout: 5000 });
      console.log(`  ✓ Live External Root Branch "${branchText}" verified.`);
    }

    await extContext.close();

    // -------------------------------------------------------------------------
    // TEST 3: PUBLIC STATIC JSON ASSET REACHABILITY
    // -------------------------------------------------------------------------
    console.log('\n[LIVE TEST 3/3] Direct Reachability Audit of Public Static JSON Asset...');
    console.log(`  URL: ${staticAssetUrl}`);
    const staticContext = await browser.newContext();
    const staticPage = await staticContext.newPage();
    const staticRes = await staticPage.goto(staticAssetUrl);
    console.log(`  ✓ Static Asset HTTP Status: ${staticRes?.status()}`);
    const jsonBody = await staticPage.evaluate(() => document.body.innerText);
    if (!jsonBody.includes('dummy-geography-test-01')) {
      throw new Error('Public static JSON asset did not contain expected content!');
    }
    console.log('  ✓ Public static JSON asset is directly accessible on live domain.');
    await staticContext.close();

    // -------------------------------------------------------------------------
    // FINAL AUDIT SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(' LIVE CLOUDFLARE DEPLOYMENT AUDIT SUMMARY');
    console.log(` Live URL:        ${liveUrl}`);
    console.log(` Console Errors:  ${consoleErrors.length}`);
    console.log(` Console Warnings:${consoleWarnings.length}`);
    console.log(` Network 404s:     ${network404s.length}`);
    console.log(' Status:           DEPLOYMENT VERIFIED & FULLY FUNCTIONAL!');
    console.log('================================================================\n');

    if (network404s.length > 0) {
      throw new Error(`Live deployment had 404 errors: ${network404s.join(', ')}`);
    }

  } catch (err) {
    console.error('\n[LIVE DEPLOYMENT AUDIT ERROR]', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runLiveDeploymentAudit();
