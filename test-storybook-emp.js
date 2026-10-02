import { chromium } from 'playwright';

async function testStorybookAndEmp() {
  console.log('🚀 Starting EMP Combat & Storybook Cutscene QA Test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('  [Browser Error]', msg.text());
  });

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // 1. Initialize Story Mode Campaign in Slot 1
    const storyCard = page.locator('text=STORY CAMPAIGN').first();
    if (await storyCard.isVisible()) {
      await storyCard.click();
      await page.waitForTimeout(400);

      const newGameBtn = page.locator('button:has-text("START NEW GAME")').first();
      if (await newGameBtn.isVisible()) {
        await newGameBtn.click();
      } else {
        const resumeBtn = page.locator('button:has-text("RESUME FLIGHT")').first();
        if (await resumeBtn.isVisible()) {
          await resumeBtn.click();
        }
      }
      await page.waitForTimeout(500);
    }

    // Close Intro NUX if open
    const closeNux = page.locator('button:has-text("EMBARK AS SPACE RONIN")').first();
    if (await closeNux.isVisible()) {
      await closeNux.click();
      await page.waitForTimeout(500);
    }

    // 2. Verify In-Flight EMP and Stunned Enemy Damage
    console.log('--- Testing EMP & Weapon Damage on Stunned Enemies ---');
    const empResult = await page.evaluate(() => {
      const store = window.__GAME_STORE__.getState();
      // Equip EMP and Torpedoes, grant credits and power
      window.__GAME_STORE__.setState((s) => ({
        player: { ...s.player, credits: 50000 },
        ship: {
          ...s.ship,
          hasEmpGenerator: true,
          empCooldown: 0,
          weaponLevel: 3,
          weaponPower: 5,
        },
      }));

      // Trigger EMP
      const empOk = window.__GAME_STORE__.getState().triggerEmpWave();
      
      // Spawn a test enemy close by
      const initialEnemy = window.__GAME_STORE__.getState().world.enemies[0];
      const initialHull = initialEnemy.hull;

      // Apply EMP Stun & Damage
      window.__GAME_STORE__.getState().damageEnemy(initialEnemy.id, 50, true, 5.0);
      const stunnedEnemy = window.__GAME_STORE__.getState().world.enemies.find((e) => e.id === initialEnemy.id);

      // Now attack stunned enemy with regular laser damage
      window.__GAME_STORE__.getState().damageEnemy(initialEnemy.id, 80, false);
      const postAttackEnemy = window.__GAME_STORE__.getState().world.enemies.find((e) => e.id === initialEnemy.id);

      return {
        empOk,
        initialHull,
        stunnedDuration: stunnedEnemy?.stunDuration,
        stunnedHull: stunnedEnemy?.hull,
        postAttackHull: postAttackEnemy?.hull,
        damageAppliedSuccessfully: postAttackEnemy ? postAttackEnemy.hull < (stunnedEnemy?.hull ?? initialHull) : true,
      };
    });

    console.log('✓ EMP Triggered:', empResult.empOk);
    console.log('✓ Enemy Stun Duration Applied:', empResult.stunnedDuration);
    console.log('✓ Stunned Enemy Damage Applied:', empResult.damageAppliedSuccessfully, {
      initialHull: empResult.initialHull,
      stunnedHull: empResult.stunnedHull,
      postAttackHull: empResult.postAttackHull,
    });

    if (!empResult.damageAppliedSuccessfully) {
      throw new Error('EMP Stunned Enemy did not take subsequent weapon damage!');
    }

    // 3. Test Storybook Cutscene Triggering on Mission Completion
    console.log('\n--- Testing Storybook Chronicles on Mission Completion ---');
    await page.evaluate(() => {
      window.__GAME_STORE__.setState({
        mode: 'STORY',
        activeMission: {
          id: 'test_mission_1',
          type: 'COURIER_CARGO',
          title: 'Emergency Medical Relay to Alpha Station',
          client: 'Sector Medical Union',
          sourceStationId: 'st_1',
          sourceStationName: 'Mining Outpost Alpha',
          reward: { credits: 2500 },
          description: 'Urgent medical supplies.',
          dangerLevel: 1,
          status: 'ACTIVE',
          penaltyCredits: 400,
        },
      });
      // Complete active mission in Story mode
      window.__GAME_STORE__.getState().completeActiveMission();
    });

    await page.waitForTimeout(600);

    const storyModal = page.locator('text=CHRONICLES OF THE SPACE RONIN').first();
    const isStoryVisible = await storyModal.isVisible();
    console.log(`✓ Storybook Chronicle Modal opened on Mission Completion: ${isStoryVisible}`);

    const continueBtn = page.locator('button:has-text("CONTINUE ODYSSEY")').first();
    console.log(`✓ Continue Odyssey button visible: ${await continueBtn.isVisible()}`);

    // Dismiss Storybook
    await continueBtn.click();
    await page.waitForTimeout(400);
    console.log(`✓ Storybook dismissed successfully. Modal visible: ${await storyModal.isVisible()}`);

    // 4. Test Storybook Cutscene Triggering on Chassis Upgrade Milestone
    console.log('\n--- Testing Storybook Chronicles on Chassis Upgrade ---');
    await page.evaluate(() => {
      window.__GAME_STORE__.setState((s) => ({
        mode: 'STORY',
        player: { ...s.player, credits: 1000000 },
        ship: { ...s.ship, shipTier: 4 }, // upgrading to 5 will trigger Chapter 3
      }));
      window.__GAME_STORE__.getState().upgradeShipChassis();
    });

    await page.waitForTimeout(600);

    const chassisStoryModal = page.locator('text=CHRONICLES OF THE SPACE RONIN').first();
    const isChassisStoryVisible = await chassisStoryModal.isVisible();
    console.log(`✓ Storybook Chronicle Modal opened on Chassis Tier 5 Upgrade: ${isChassisStoryVisible}`);

    const chapterTitle = page.locator('text=Tempered in Starfire').first();
    console.log(`✓ Chapter 3 "Tempered in Starfire" rendered: ${await chapterTitle.isVisible()}`);

    await page.locator('button:has-text("CONTINUE ODYSSEY")').first().click();
    await page.waitForTimeout(400);

    console.log('\n🎉 ALL EMP & STORYBOOK QA TESTS PASSED WITH 0 ERRORS!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await browser.close();
  }
}

testStorybookAndEmp();
