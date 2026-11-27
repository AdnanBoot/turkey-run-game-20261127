import { CONFIG } from './config.js';

// Turkey runner state: jump, duck, stumble, lives, and hitbox.
export function createRunner() {
  const runner = {
    x: CONFIG.TURKEY_X,
    y: CONFIG.GROUND_Y,
    vy: 0,
    grounded: true,
    ducking: false,
    lives: CONFIG.MAX_LIVES,
    invulnTimer: 0,
    stumbleTimer: 0,
    cornBoostTimer: 0,
    runCycle: 0,
    flapCycle: 0,
    justLanded: false,
    justJumped: false,
  };

  function reset() {
    runner.x = CONFIG.TURKEY_X;
    runner.y = CONFIG.GROUND_Y;
    runner.vy = 0;
    runner.grounded = true;
    runner.ducking = false;
    runner.lives = CONFIG.MAX_LIVES;
    runner.invulnTimer = 0;
    runner.stumbleTimer = 0;
    runner.cornBoostTimer = 0;
    runner.runCycle = 0;
    runner.flapCycle = 0;
    runner.justLanded = false;
    runner.justJumped = false;
  }

  function update(dt, input, speedRatio = 1) {
    runner.justLanded = false;
    runner.justJumped = false;

    if (runner.invulnTimer > 0) runner.invulnTimer = Math.max(0, runner.invulnTimer - dt);
    if (runner.stumbleTimer > 0) runner.stumbleTimer = Math.max(0, runner.stumbleTimer - dt);
    if (runner.cornBoostTimer > 0) runner.cornBoostTimer = Math.max(0, runner.cornBoostTimer - dt);

    const wantsDuck = input.isDuckHeld();
    runner.ducking = runner.grounded && wantsDuck;

    if (input.wasJumpPressed() && runner.grounded) {
      runner.vy = CONFIG.JUMP_VELOCITY;
      runner.grounded = false;
      runner.ducking = false;
      runner.justJumped = true;
    }

    if (!runner.grounded) {
      const grav = wantsDuck ? CONFIG.FAST_FALL_GRAVITY : CONFIG.GRAVITY;
      runner.vy += grav * dt;
      runner.y += runner.vy * dt;
      runner.flapCycle += dt * 16;

      if (runner.y >= CONFIG.GROUND_Y) {
        runner.y = CONFIG.GROUND_Y;
        runner.vy = 0;
        runner.grounded = true;
        runner.justLanded = true;
        runner.ducking = wantsDuck;
      }
    } else {
      runner.runCycle += dt * (11 + speedRatio * 5);
    }
  }

  function getHitbox() {
    const w = runner.ducking ? CONFIG.TURKEY_DUCK_W : CONFIG.TURKEY_STAND_W;
    const h = runner.ducking ? CONFIG.TURKEY_DUCK_H : CONFIG.TURKEY_STAND_H;
    // Slight forgiveness inset so near-misses feel fair
    return {
      x: runner.x - w * 0.42,
      y: runner.y - h + 6,
      w: w * 0.84,
      h: h - 8,
    };
  }

  function takeDamage(lifeCost = 1) {
    if (runner.invulnTimer > 0) return false;
    runner.lives = Math.max(0, runner.lives - lifeCost);
    runner.invulnTimer = CONFIG.INVULN_DURATION;
    runner.stumbleTimer = CONFIG.STUMBLE_DURATION;
    return true;
  }

  return {
    state: runner,
    reset,
    update,
    getHitbox,
    takeDamage,
  };
}
