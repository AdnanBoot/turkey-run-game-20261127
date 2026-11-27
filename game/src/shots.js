import { CONFIG } from './config.js';

// Deterministic ?shot= scene setup for headless-Chrome screenshots.
export function applyShotScene(shotName, world, particles) {
  world.reset();
  particles.reset();

  const { state, runner, farmer, hazards } = world;
  state.time = 12.4;

  if (shotName === 'title') {
    state.scrollX = 280;
    state.distanceM = 10;
    farmer.state.gap = 86;
    farmer.state.displayGap = 86;
    farmer.state.shoutTimer = 0;
    return 'title';
  }

  if (shotName === 'run') {
    // 1-cover.jpg: mid-run, farmer close behind, knife mid-air, HUD lit
    state.distanceM = 485;
    state.scrollX = state.distanceM * CONFIG.PIXELS_PER_METER;
    state.cornCount = 11;
    state.nearMisses = 3;
    state.score = state.distanceM * CONFIG.SCORE_PER_METER + state.cornCount * 50 + state.nearMisses * 35;
    state.speed = 495;

    runner.state.lives = 2;
    runner.state.y = CONFIG.GROUND_Y - 76;
    runner.state.grounded = false;
    runner.state.flapCycle = 2.1;

    farmer.state.gap = 34;
    farmer.state.displayGap = 34;
    farmer.state.shoutTimer = 1.6;
    farmer.state.shoutText = 'COME BACK HERE!';
    farmer.state.runCycle = 1.4;

    hazards.items.push(
      {
        kind: 'fence',
        x: 345,
        y: CONFIG.GROUND_Y - CONFIG.FENCE_H,
        w: CONFIG.FENCE_W,
        h: CONFIG.FENCE_H,
        hit: false,
        nearMissChecked: false,
      },
      {
        kind: 'knife',
        x: 610,
        y: CONFIG.KNIFE_HIGH_Y,
        w: CONFIG.KNIFE_W,
        h: CONFIG.KNIFE_H,
        speedBonus: 220,
        spin: 0.45,
        glint: 1.2,
        isHigh: true,
        hit: false,
        nearMissChecked: false,
        whooshed: true,
      },
      {
        kind: 'corn',
        x: 750,
        y: CONFIG.GROUND_Y - 122,
        r: CONFIG.CORN_R,
        bobPhase: 0.9,
        collected: false,
      },
      {
        kind: 'oven',
        x: 940,
        y: CONFIG.GROUND_Y - CONFIG.OVEN_H,
        w: CONFIG.OVEN_W,
        h: CONFIG.OVEN_H,
        phase: 'telegraph',
        timer: 0.45,
        telegraphTime: 0.9,
        hit: false,
        nearMissChecked: false,
      },
    );

    particles.spawnDust(runner.state.x - 10, CONFIG.GROUND_Y, 6);
    return 'running';
  }

  if (shotName === 'oven') {
    // 3-oven.jpg: flame burst, telegraphed
    state.distanceM = 740;
    state.scrollX = state.distanceM * CONFIG.PIXELS_PER_METER;
    state.cornCount = 16;
    state.nearMisses = 5;
    state.score = state.distanceM * CONFIG.SCORE_PER_METER + state.cornCount * 50 + state.nearMisses * 35;
    state.speed = 540;

    runner.state.lives = 2;
    runner.state.ducking = true;
    runner.state.runCycle = 2.8;

    farmer.state.gap = 52;
    farmer.state.displayGap = 52;
    farmer.state.shoutTimer = 1.4;
    farmer.state.shoutText = 'GET IN THE OVEN!';

    hazards.items.push(
      {
        kind: 'oven',
        x: 620,
        y: CONFIG.GROUND_Y - CONFIG.OVEN_H,
        w: CONFIG.OVEN_W,
        h: CONFIG.OVEN_H,
        phase: 'flame',
        timer: 0.5,
        telegraphTime: 0.85,
        hit: false,
        nearMissChecked: false,
      },
      {
        kind: 'knife',
        x: 470,
        y: CONFIG.KNIFE_HIGH_Y,
        w: CONFIG.KNIFE_W,
        h: CONFIG.KNIFE_H,
        speedBonus: 240,
        spin: 2.1,
        glint: 0.8,
        isHigh: true,
        hit: false,
        nearMissChecked: false,
        whooshed: true,
      },
      {
        kind: 'hay',
        x: 960,
        y: CONFIG.GROUND_Y - CONFIG.HAY_H,
        w: CONFIG.HAY_W,
        h: CONFIG.HAY_H,
        hit: false,
        nearMissChecked: false,
      },
    );

    particles.spawnFlameSparks(668, CONFIG.GROUND_Y - CONFIG.OVEN_H, 12);
    return 'running';
  }

  if (shotName === 'escaped') {
    // 4-escaped.jpg: forest gate + score panel
    state.distanceM = CONFIG.GATE_DISTANCE_M;
    state.scrollX = state.distanceM * CONFIG.PIXELS_PER_METER;
    state.cornCount = 24;
    state.nearMisses = 8;
    state.score = state.distanceM * CONFIG.SCORE_PER_METER + state.cornCount * 50 + state.nearMisses * 35;
    state.speed = 620;
    state.outcome = 'escaped';

    runner.state.lives = 2;
    farmer.state.gap = 62;
    farmer.state.displayGap = 62;
    farmer.state.shoutTimer = 0;

    particles.spawnSparkles(runner.state.x + 20, runner.state.y - 40, 10);
    return 'escaped';
  }

  return 'title';
}
