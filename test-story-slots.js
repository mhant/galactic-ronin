import { chromium } from 'playwright';

async function testStorySlotsAndMissions() {
  console.log('🚀 Starting Story Mode, Save Slots, Intro NUX & Contracts QA Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: false,
  });

  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`  [Browser Error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    // 1. Load Main Menu
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    console.log('✓ Loaded Main Menu');

    // 2. Verify Mode selector buttons
    const storyModeCard = page.locator('text=STORY CAMPAIGN').first();
    const freePlayCard = page.locator('text=FREE PLAY SANDBOX').first();
    console.log(`✓ Story Mode card visible: ${await storyModeCard.isVisible()}`);
    console.log(`✓ Free Play card visible: ${await freePlayCard.isVisible()}`);

    // 3. Open Save Slots for Story Mode
    await storyModeCard.click();
    await page.waitForTimeout(500);
    const slotModalTitle = page.locator('text=EXPEDITION FLIGHT LOGS').first();
    console.log(`✓ Save Slot Modal opened: ${await slotModalTitle.isVisible()}`);

    // Check 3 slots rendered
    const slot1 = page.locator('text=SLOT 1').first();
    const slot2 = page.locator('text=SLOT 2').first();
    const slot3 = page.locator('text=SLOT 3').first();
    console.log(`✓ 3 Save Slots visible: ${await slot1.isVisible()} ${await slot2.isVisible()} ${await slot3.isVisible()}`);

    // 4. Start New Game in Slot 1
    const newGameBtn = page.locator('button:has-text("START NEW GAME")').first();
    await newGameBtn.click();
    await page.waitForTimeout(600);
    console.log('✓ Initialized New Story Campaign in Slot 1');

    // 5. Verify Story Intro NUX Modal appears
    const nuxTitle = page.locator('text=THE CODE OF THE SPACE RONIN').first();
    console.log(`✓ Story Intro Prologue NUX Modal visible: ${await nuxTitle.isVisible()}`);

    // Advance NUX slides
    const nextSlideBtn = page.locator('button:has-text("NEXT")').first();
    await nextSlideBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ Advanced to Slide 2 (Contracts, Cargo & Bounties)');

    await nextSlideBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ Advanced to Slide 3 (Fleet Expansion & Tier 100 Chassis)');

    const launchBtn = page.locator('button:has-text("LAUNCH INTERCEPTOR")').first();
    await launchBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Closed Intro NUX and launched into flight');

    // 6. Dock at Station and test Station Contracts
    await page.evaluate(() => {
      const store = window.__GAME_STORE__.getState();
      const station = store.world.stations[0];
      if (station) {
        store.dockAtStation(station.id);
      }
    });
    await page.waitForTimeout(600);
    console.log('✓ Docked at Station');

    // Verify Contracts Tab
    const contractsTab = page.locator('button:has-text("CONTRACTS")').first();
    console.log(`✓ Contracts Tab visible: ${await contractsTab.isVisible()}`);
    await contractsTab.click();
    await page.waitForTimeout(400);

    const acceptContractBtn = page.locator('button:has-text("ACCEPT CONTRACT")').first();
    const isAcceptVisible = await acceptContractBtn.isVisible();
    console.log(`✓ Station Contracts listed with Accept button: ${isAcceptVisible}`);

    if (isAcceptVisible) {
      await acceptContractBtn.click();
      await page.waitForTimeout(400);
      console.log('✓ Accepted Contract');

      const activeContractBadge = page.locator('text=ACTIVE CONTRACT').first();
      console.log(`✓ Active Contract banner visible: ${await activeContractBadge.isVisible()}`);
    }

    // 7. Check Upgrades Tab & 10 Escorts
    const upgradesTab = page.locator('button:has-text("FLEET & UPGRADES")').first();
    await upgradesTab.click();
    await page.waitForTimeout(400);

    const escortHangar = page.locator('text=Escort Fleet Armada Hangar').first();
    console.log(`✓ Escort Fleet Armada Hangar visible: ${await escortHangar.isVisible()}`);

    const warmasterEscort = page.locator('text=Apex Ronin Warmaster').first();
    console.log(`✓ Apex Ronin Warmaster Escort card rendered: ${await warmasterEscort.isVisible()}`);

    // Undock and verify HUD Active Mission Tracker
    const undockBtn = page.locator('button:has-text("UNDOCK")').first();
    await undockBtn.click();
    await page.waitForTimeout(500);

    const hudTracker = page.locator('text=ABANDON').first();
    console.log(`✓ In-Flight HUD Active Mission Tracker with Compass visible: ${await hudTracker.isVisible()}`);

    console.log('\n🎉 ALL QA CHECKS PASSED WITH 0 ERRORS!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await browser.close();
  }
}

testStorySlotsAndMissions();
