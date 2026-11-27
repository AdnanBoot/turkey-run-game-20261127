import { CONFIG } from './config.js';

const SHOUTS = [
  'COME BACK HERE!',
  'GET IN THE OVEN!',
  'MY THANKSGIVING DINNER!',
  'HOLD STILL, TURKEY!',
];

// Farmer chase AI: trails behind, closes gap on turkey stumbles, catches at gap 0.
export function createFarmer() {
  const farmer = {
    gap: CONFIG.FARMER_START_GAP,
    displayGap: CONFIG.FARMER_START_GAP,
    shoutTimer: 1.8,
    shoutText: SHOUTS[0],
    shoutIndex: 0,
    runCycle: 0,
    lungeOffset: 0,
  };

  function reset() {
    farmer.gap = CONFIG.FARMER_START_GAP;
    farmer.displayGap = CONFIG.FARMER_START_GAP;
    farmer.shoutTimer = 1.8;
    farmer.shoutIndex = 0;
    farmer.shoutText = SHOUTS[0];
    farmer.runCycle = 0;
    farmer.lungeOffset = 0;
  }

  function onStumble(gapLoss = CONFIG.FARMER_STUMBLE_LOSS) {
    farmer.gap = Math.max(CONFIG.FARMER_MIN_GAP, farmer.gap - gapLoss);
    farmer.shoutIndex = (farmer.shoutIndex + 1) % SHOUTS.length;
    farmer.shoutText = SHOUTS[farmer.shoutIndex];
    farmer.shoutTimer = CONFIG.FARMER_SHOUT_DURATION;
    farmer.lungeOffset = 18;
  }

  function update(dt, isStumbling, speedRatio = 1) {
    if (!isStumbling && farmer.gap > 0) {
      farmer.gap = Math.min(
        CONFIG.FARMER_MAX_GAP,
        farmer.gap + CONFIG.FARMER_RECOVERY_PER_SEC * dt,
      );
    }

    // Smooth visual interpolation
    farmer.displayGap += (farmer.gap - farmer.displayGap) * Math.min(1, dt * 7);
    farmer.lungeOffset = Math.max(0, farmer.lungeOffset - dt * 36);

    if (farmer.shoutTimer > 0) {
      farmer.shoutTimer = Math.max(0, farmer.shoutTimer - dt);
    }

    farmer.runCycle += dt * (10 + speedRatio * 4.5);
  }

  function getScreenX(turkeyX = CONFIG.TURKEY_X) {
    // gap=100 -> x=70; gap=0 -> x=turkeyX - 38
    const t = Math.max(0, Math.min(1, farmer.displayGap / CONFIG.FARMER_MAX_GAP));
    const farX = 68;
    const catchX = turkeyX - 38;
    return catchX - t * (catchX - farX) + farmer.lungeOffset;
  }

  function isCaught() {
    return farmer.gap <= 0;
  }

  return {
    state: farmer,
    reset,
    onStumble,
    update,
    getScreenX,
    isCaught,
  };
}
