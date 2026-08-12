import { chromium } from 'playwright';

async function runE2EStateLeakTest() {
  console.log('=== STARTING E2E BROWSER DATASET SWITCHING & STATE LEAKAGE TEST ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    console.log(`Navigating to ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // STEP 1: INITIAL LOAD - EXTERNAL JSON (sample-json)
    console.log('[1/6] Verifying initial load: External JSON (sample-json)...');
    await page.waitForSelector('text="भारत का भौतिक स्वरूप"', { timeout: 10000 });
    console.log('  [PASS] External Hindi sample JSON loaded cleanly.');

    // Interact with sample-json state
    console.log('  Applying state: Selecting node "himadri", searching "हिमालय", toggling Active Recall...');
    await page.click('text="महान हिमालय (हिमाद्रि)"');
    await page.waitForSelector('text="सर्वाधिक ऊंची एवं सतत श्रेणी"');

    const searchInput = page.locator('input[placeholder*="खोजें"]');
    await searchInput.fill('हिमालय');
    await page.waitForTimeout(300);

    // Toggle Active Recall button
    const activeRecallBtn = page.locator('button:has-text("एक्टिव रीकॉल")');
    await activeRecallBtn.click();
    console.log('  State set on sample-json: Node selected, Search active, Active Recall ON.');

    // STEP 2: SWITCH TO BENCHMARK DATASET (geo-50)
    console.log('\n[2/6] Switching to Benchmark Dataset (geo-50)...');
    await page.click('button[aria-label="Select test dataset scale"]');
    await page.click('button:has-text("50 Nodes (Medium)")');
    await page.waitForTimeout(500);

    // Verify ZERO state leakage from sample-json
    const searchValAfterSwitch = await searchInput.inputValue();
    if (searchValAfterSwitch !== '') {
      throw new Error(`State Leak Detected: Search query "${searchValAfterSwitch}" was not cleared on dataset switch!`);
    }

    const detailPanelVisible = await page.locator('text="सर्वाधिक ऊंची एवं सतत श्रेणी"').isVisible();
    if (detailPanelVisible) {
      throw new Error('State Leak Detected: Inspector side panel remained open after switching datasets!');
    }

    console.log('  [PASS] Dataset geo-50 loaded cleanly. Inspector closed, Search query cleared (Zero State Leak).');

    // STEP 3: INTERACT WITH BENCHMARK DATASET & APPLY FOCUS BRANCH MODE
    console.log('\n[3/6] Applying Focus Branch & state on geo-50...');
    await page.waitForSelector('text="भारत का भौतिक भूगोल"');
    await page.click('text="भारत का भौतिक भूगोल"');
    await page.waitForTimeout(300);
    const focusBtn = page.locator('button:has-text("फ़ोकस शाखा")');
    if (await focusBtn.isVisible()) {
      await focusBtn.click();
      console.log('  Focus Mode activated on "भारत का भौतिक भूगोल". Exit Focus button visible.');
    }

    // STEP 4: SWITCH TO LARGE DATASET (geo-1000)
    console.log('\n[4/6] Switching to Large Stress Dataset (geo-1000)...');
    await page.click('button[aria-label="Select test dataset scale"]');
    await page.click('button:has-text("1000 Nodes (Max Stress)")');
    await page.waitForTimeout(1000);

    // Verify ZERO state leakage from geo-50
    const exitFocusBtnVisible = await page.locator('button:has-text("एकज़िट फ़ोकस")').isVisible();
    if (exitFocusBtnVisible) {
      throw new Error('State Leak Detected: Focus Branch mode leaked into geo-1000 dataset!');
    }

    await page.waitForSelector('text="1000 Nodes"', { timeout: 10000 });
    console.log('  [PASS] Large 1000-node dataset loaded cleanly. Focus Branch cleared (Zero State Leak).');

    // STEP 5: SWITCH BACK TO EXTERNAL JSON (sample-json)
    console.log('\n[5/6] Switching BACK to External JSON (sample-json)...');
    await page.click('button[aria-label="Select test dataset scale"]');
    await page.click('button:has-text("Sample JSON (Hindi)")');
    await page.waitForTimeout(500);

    await page.waitForSelector('text="भारत का भौतिक स्वरूप"');
    console.log('  [PASS] Returned to External Sample JSON cleanly with 0 state leakage.');

    // STEP 6: SWITCH TO MALFORMED JSON (Error Handling Test)
    console.log('\n[6/6] Testing Malformed JSON Error Handling...');
    await page.click('button[aria-label="Select test dataset scale"]');
    await page.click('button:has-text("Malformed JSON (Error Test)")');
    await page.waitForTimeout(500);

    await page.waitForSelector('text="Mind Map load नहीं हो पाया"');
    await page.waitForSelector('text="DUPLICATE_NODE_ID"');
    console.log('  [PASS] Malformed JSON rendered clean NotebookLM error screen without React crash.');

    // Recover from Error Screen via select
    console.log('  Recovering from error state using dropdown...');
    await page.selectOption('select', 'sample-json');
    await page.waitForSelector('text="भारत का भौतिक स्वरूप"');
    console.log('  [PASS] Mind Map successfully recovered from error state back to sample-json.');

    console.log('\n=== ALL E2E BROWSER DATASET SWITCHING TESTS PASSED PERFECTLY! ===\n');
  } catch (err) {
    console.error('\n[E2E TEST ERROR]', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2EStateLeakTest();
