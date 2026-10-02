import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runDeviceTests() {
  console.log('🚀 Starting Playwright Responsive & Station Modal Device QA Tests...');
  const browser = await chromium.launch({ headless: true });

  const testConfigs = [
    {
      name: 'Mobile_Small_Android',
      viewport: { width: 360, height: 780 },
      isMobile: true,
      hasTouch: true,
    },
    {
      name: 'Mobile_iPhone_14',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    },
    {
      name: 'Tablet_iPad_Air',
      viewport: { width: 820, height: 1180 },
      isMobile: true,
      hasTouch: true,
    },
    {
      name: 'Desktop_1080p',
      viewport: { width: 1920, height: 1080 },
      isMobile: false,
      hasTouch: false,
    },
  ];

  const screenshotsDir = path.resolve('scratch_tests');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = [];

  for (const config of testConfigs) {
    console.log(`\n📱 Testing profile: ${config.name} (${config.viewport.width}x${config.viewport.height})`);
    const context = await browser.newContext({
      viewport: config.viewport,
      isMobile: config.isMobile,
      hasTouch: config.hasTouch,
    });

    const page = await context.newPage();

    // Listen for console logs & errors
    const errors = [];
    page.on('console', (msg) => console.log(`  [Browser] ${msg.text()}`));
    page.on('pageerror', (err) => errors.push(err.message));

    // 1. Navigate to local dev server
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    console.log(`  ✓ Loaded page`);

    // 2. Ensure in-flight game status
    const startBtn = page.locator('button:has-text("CONTINUE EXPEDITION"), button:has-text("NEW GAME")').first();
    const isMenuVisible = await startBtn.isVisible();
    if (isMenuVisible) {
      await startBtn.click();
      await page.waitForTimeout(800);
      console.log(`  ✓ Clicked start button from Main Menu`);
    } else {
      // Ensure game is in EXPLORING state
      await page.evaluate(() => {
        if (window.__GAME_STORE__) {
          const st = window.__GAME_STORE__.getState();
          if (st.gameStatus !== 'EXPLORING' && st.gameStatus !== 'COMBAT') {
            st.startGame(false);
          }
        }
      });
      await page.waitForTimeout(600);
      console.log(`  ✓ Game in flight state`);
    }

    // Take screenshot of In-Flight HUD
    const flightShotPath = path.join(screenshotsDir, `${config.name}_1_in_flight.png`);
    await page.screenshot({ path: flightShotPath });
    console.log(`  ✓ In-Flight screenshot saved`);

    // 3. Verify Touch Controls on mobile/tablet
    if (config.hasTouch) {
      const dpadCenter = page.locator('div:has-text("RCS")').first();
      const isDpadVisible = await dpadCenter.isVisible();
      console.log(`  ✓ Virtual Flight D-Pad visible: ${isDpadVisible}`);

      const fireBtn = page.locator('button:has-text("FIRE")').first();
      const isFireBtnVisible = await fireBtn.isVisible();
      console.log(`  ✓ Virtual FIRE Button visible: ${isFireBtnVisible}`);

      const mineBtn = page.locator('button:has-text("MINE")').first();
      const isMineBtnVisible = await mineBtn.isVisible();
      console.log(`  ✓ Virtual MINE Button visible: ${isMineBtnVisible}`);

      // Simulate Virtual Flight Controls
      const thrustBtn = page.locator('button[title*="Thrust Forward"]').first();
      if (await thrustBtn.isVisible()) {
        await thrustBtn.dispatchEvent('touchstart');
        await page.waitForTimeout(200);
        await thrustBtn.dispatchEvent('touchend');
        console.log(`  ✓ Dispatched virtual thrust forward`);
      }

      if (isFireBtnVisible) {
        await fireBtn.dispatchEvent('touchstart');
        await page.waitForTimeout(150);
        await fireBtn.dispatchEvent('touchend');
        console.log(`  ✓ Dispatched virtual plasma cannons`);
      }
    }

    // 4. Test Station Docking & Station Modal Top Bar Visibility
    await page.evaluate(() => {
      const store = window.__GAME_STORE__;
      if (store) {
        const state = store.getState();
        const st = state.world.stations[0];
        if (st) {
          store.setState((s) => ({
            player: {
              ...s.player,
              inventory: [
                { id: 'iron_ore', name: 'Ferrous Iron Ore', quantity: 12, avgBuyPrice: 45, category: 'ORE' },
                { id: 'titanium_ore', name: 'Refined Titanium', quantity: 6, avgBuyPrice: 120, category: 'ORE' },
                { id: 'quantum_crystal', name: 'Quantum Hyper-Crystal', quantity: 2, avgBuyPrice: 1200, category: 'ORE' },
              ],
            },
          }));
          store.getState().dockAtStation(st.id);
        }
      }
    });

    await page.waitForTimeout(800);

    const undockBtn = page.locator('button:has-text("UNDOCK")').first();
    const isUndockVisible = await undockBtn.isVisible();
    const undockBox = await undockBtn.boundingBox();
    console.log(`  ✓ Station Modal open: ${isUndockVisible}`);

    let topBarFullyVisible = false;
    if (undockBox) {
      topBarFullyVisible = undockBox.y >= 0 && undockBox.y + undockBox.height <= config.viewport.height;
      console.log(`  ✓ UNDOCK button position: top=${Math.round(undockBox.y)}px, right=${Math.round(undockBox.x + undockBox.width)}px (within viewport: ${topBarFullyVisible})`);
    }

    // Take screenshot of Space Station Modal on this device profile
    const stationShotPath = path.join(screenshotsDir, `${config.name}_2_station_modal.png`);
    await page.screenshot({ path: stationShotPath });
    console.log(`  ✓ Station Modal screenshot saved: ${stationShotPath}`);

    // Test Mineral Selling Button
    const sellAllBtn = page.locator('button:has-text("SELL ALL MINERALS")').first();
    if (await sellAllBtn.isVisible()) {
      await sellAllBtn.click();
      await page.waitForTimeout(400);
      console.log(`  ✓ Tested SELL ALL MINERALS button successfully`);
    }

    // Test Switching to Ship Upgrades Tab if on mobile/tablet
    const upgradesTabBtn = page.locator('button:has-text("SHIP UPGRADES")').first();
    if (await upgradesTabBtn.isVisible()) {
      await upgradesTabBtn.click();
      await page.waitForTimeout(400);
      const upgradesShotPath = path.join(screenshotsDir, `${config.name}_3_station_upgrades_tab.png`);
      await page.screenshot({ path: upgradesShotPath });
      console.log(`  ✓ Upgrades tab screenshot saved: ${upgradesShotPath}`);
    }

    // Undock
    if (await undockBtn.isVisible()) {
      await undockBtn.click();
      await page.waitForTimeout(500);
      console.log(`  ✓ Undocked successfully`);
    }

    results.push({
      config: config.name,
      viewport: `${config.viewport.width}x${config.viewport.height}`,
      touchMode: config.hasTouch,
      stationTopBarVisible: topBarFullyVisible,
      errorCount: errors.length,
      errors,
    });

    await context.close();
  }

  await browser.close();
  console.log('\n📊 Station Modal & Mobile Device QA Test Results Summary:');
  console.table(results);
  return results;
}

runDeviceTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
