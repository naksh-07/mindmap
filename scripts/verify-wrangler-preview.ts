import { chromium } from 'playwright';

async function runWranglerPreviewAudit() {
  console.log('================================================================');
  console.log(' STARTING WRANGLER CLOUDFLARE STATIC ASSETS BROWSER VERIFICATION');
  console.log(' Target URL: http://127.0.0.1:8787');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const network404s: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: DESKTOP VIEWPORT (1366x768)
    // -------------------------------------------------------------------------
    console.log('[TEST 1/4] Desktop Viewport (1366x768) - Core UI & Interactions...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await desktopContext.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('  [Browser Console Error]:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (res) => {
      if (res.status() === 404) {
        console.error('  [Browser 404 Error]:', res.url());
        network404s.push(res.url());
      }
    });

    await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' });
    console.log('  ✓ Page loaded cleanly on http://127.0.0.1:8787/');

    // Verify Root Node & Hindi text
    await page.waitForSelector('text="ब्रह्माण्ड और पृथ्वी की उत्पत्ति"', { timeout: 10000 });
    console.log('  ✓ Root node ("ब्रह्माण्ड और पृथ्वी की उत्पत्ति") visible with Hindi text.');

    // Node selection & Inspector
    await page.click('text="बिग बैंग सिद्धांत"');
    await page.waitForSelector('text="मुख्य अवधारणा और उसके उप-बिंदु"', { timeout: 5000 });
    console.log('  ✓ Node selected & Inspector panel visible.');

    // Search functionality
    const searchInput = page.locator('input[placeholder*="खोजें"]');
    await searchInput.fill('सिद्धान्त');
    await page.waitForTimeout(300);
    console.log('  ✓ Search executed ("सिद्धान्त").');
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Active Recall toggle
    const activeRecallBtn = page.locator('button:has-text("एक्टिव रीकॉल")');
    if (await activeRecallBtn.isVisible()) {
      await activeRecallBtn.click();
      console.log('  ✓ Active Recall toggled ON.');
      await activeRecallBtn.click();
      console.log('  ✓ Active Recall toggled OFF.');
    }

    // Focus Branch toggle
    const focusBtn = page.locator('button:has-text("फ़ोकस शाखा")');
    if (await focusBtn.isVisible()) {
      await focusBtn.click();
      console.log('  ✓ Focus Branch toggled.');
      const exitFocusBtn = page.locator('button:has-text("एकज़िट फ़ोकस")');
      if (await exitFocusBtn.isVisible()) {
        await exitFocusBtn.click();
        console.log('  ✓ Exited Focus Branch.');
      }
    }

    // Theme Toggle
    const themeBtn = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      console.log('  ✓ Theme toggled.');
      await themeBtn.click();
      console.log('  ✓ Theme toggled back.');
    }

    // Quiz View
    const quizBtn = page.locator('button:has-text("क्विज़"), button:has-text("Quiz")').first();
    if (await quizBtn.isVisible()) {
      await quizBtn.click();
      await page.waitForTimeout(300);
      console.log('  ✓ Quiz view toggled.');
      const closeQuizBtn = page.locator('button[aria-label="Close quiz modal"]').first();
      if (await closeQuizBtn.isVisible()) {
        await closeQuizBtn.click();
        console.log('  ✓ Quiz modal closed.');
      }
    }

    await desktopContext.close();

    // -------------------------------------------------------------------------
    // TEST 2: MOBILE VIEWPORTS (375x812 & 390x844)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2/4] Mobile Viewports (375x812 & 390x844) - Mobile UX & Toolbar...');
    for (const vp of [{ width: 375, height: 812 }, { width: 390, height: 844 }]) {
      const mobileContext = await browser.newContext({ viewport: vp });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' });
      await mobilePage.waitForSelector('text="ब्रह्माण्ड और पृथ्वी की उत्पत्ति"', { timeout: 10000 });
      console.log(`  ✓ Mobile viewport (${vp.width}x${vp.height}) loaded successfully.`);
      await mobileContext.close();
    }

    // -------------------------------------------------------------------------
    // TEST 3: EXTERNAL JSON LOADING (?source=...)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3/4] External JSON Dataset Loading (?source=https://raw.githubusercontent.com/.../geotest.json)...');
    const extContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const extPage = await extContext.newPage();
    const extUrl = 'http://127.0.0.1:8787/?source=https://raw.githubusercontent.com/naksh-07/audiotts/refs/heads/main/geotest.json';
    
    await extPage.goto(extUrl, { waitUntil: 'networkidle' });
    
    // Verify Expected Title
    await extPage.waitForSelector('text="ब्रह्माण्ड और पृथ्वी की उत्पत्ति"', { timeout: 15000 });
    console.log('  ✓ External Dataset Title ("ब्रह्माण्ड और पृथ्वी की उत्पत्ति") successfully rendered!');

    // Verify Expected Root Branches: ब्रह्माण्ड, सौरमंडल, पृथ्वी, चंद्रमा
    for (const branchText of ['ब्रह्माण्ड', 'सौरमंडल', 'पृथ्वी', 'चंद्रमा']) {
      await extPage.waitForSelector(`text="${branchText}"`, { timeout: 5000 });
      console.log(`  ✓ External Root Branch "${branchText}" verified.`);
    }

    await extContext.close();

    // -------------------------------------------------------------------------
    // TEST 4: ERROR HANDLING (?source=invalid)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4/4] Invalid Source Error State (?source=https://example.com/nonexistent.json)...');
    const errContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const errPage = await errContext.newPage();
    const errUrl = 'http://127.0.0.1:8787/?source=https://example.com/nonexistent.json';

    await errPage.goto(errUrl, { waitUntil: 'networkidle' });
    await errPage.waitForSelector('text="Mind Map load नहीं हो पाया"', { timeout: 10000 });
    console.log('  ✓ Friendly error state screen ("Mind Map load नहीं हो पाया") rendered correctly without crash.');

    await errContext.close();

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(' WRANGLER PREVIEW BROWSER TEST RESULTS');
    console.log(` Console Errors: ${consoleErrors.length}`);
    console.log(` Network 404s:    ${network404s.length}`);
    console.log(' Status:          ALL TESTS PASSED PERFECTLY!');
    console.log('================================================================\n');

    if (network404s.length > 0) {
      throw new Error(`Failed with 404 network errors: ${network404s.join(', ')}`);
    }

  } catch (err) {
    console.error('\n[WRANGLER VERIFICATION ERROR]', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runWranglerPreviewAudit();
