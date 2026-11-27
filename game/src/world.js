import { CONFIG } from './config.js';
import { createRunner } from './runner.js';
import { createFarmer } from './farmer.js';
import { createHazards } from './hazards.js';

// Core Gobble Run world simulation: scrolling farmyard, difficulty ramp, scoring, and win/loss.
export function createWorld(rng) {
  const runner = createRunner();
  const farmer = createFarmer();
  const hazards = createHazards(rng);

  const state = {
    scrollX: 0,
    distanceM: 0,
    score: 0,
    cornCount: 0,
    nearMisses: 0,
    speed: CONFIG.BASE_SCROLL_SPEED,
    difficulty: 0,
    shakeTimer: 0,
    outcome: null, // null | 'caught' | 'escaped'
    catchReason: '',
    popups: [],
    time: 0,
  };

  function reset() {
    runner.reset();
    farmer.reset();
    hazards.reset();
    state.scrollX = 0;
    state.distanceM = 0;
    state.score = 0;
    state.cornCount = 0;
    state.nearMisses = 0;
    state.speed = CONFIG.BASE_SCROLL_SPEED;
    state.difficulty = 0;
    state.shakeTimer = 0;
    state.outcome = null;
    state.catchReason = '';
    state.popups = [];
    state.time = 0;
  }

  function addPopup(text, x, y, color = '#ffe082') {
    state.popups.push({ text, x, y, color, life: 0.95, maxLife: 0.95 });
  }

  function update(dt, input) {
    const events = [];
    if (state.outcome) return events;

    state.time += dt;
    state.difficulty = Math.min(1, state.distanceM / CONFIG.GATE_DISTANCE_M);

    const baseSpeed =
      CONFIG.BASE_SCROLL_SPEED +
      state.difficulty * (CONFIG.MAX_SCROLL_SPEED - CONFIG.BASE_SCROLL_SPEED);
    const boost = runner.state.cornBoostTimer > 0 ? CONFIG.CORN_SPEED_BOOST * 3 : 0;
    const stumbleSlow = runner.state.stumbleTimer > 0 ? 0.68 : 1;
    state.speed = (baseSpeed + boost) * stumbleSlow;

    const dx = state.speed * dt;
    state.scrollX += dx;
    state.distanceM = Math.min(
      CONFIG.GATE_DISTANCE_M,
      state.scrollX / CONFIG.PIXELS_PER_METER,
    );

    const speedRatio =
      (state.speed - CONFIG.BASE_SCROLL_SPEED) /
      (CONFIG.MAX_SCROLL_SPEED - CONFIG.BASE_SCROLL_SPEED);

    runner.update(dt, input, Math.max(0, speedRatio));
    if (runner.state.justJumped) events.push({ type: 'jump', x: runner.state.x, y: runner.state.y });
    if (runner.state.justLanded) events.push({ type: 'land', x: runner.state.x, y: runner.state.y });

    farmer.update(dt, runner.state.stumbleTimer > 0, Math.max(0, speedRatio));

    const allowSpawn = state.distanceM < CONFIG.GATE_DISTANCE_M - 60;
    const hazardEvents = hazards.update(dt, state.speed, state.difficulty, allowSpawn);
    for (const ev of hazardEvents) events.push(ev);

    const collisions = hazards.checkCollisions(runner.getHitbox(), runner.state.x);
    for (const col of collisions) {
      if (col.type === 'corn') {
        state.cornCount += 1;
        state.score += CONFIG.CORN_SCORE;
        runner.state.cornBoostTimer = CONFIG.CORN_BOOST_DURATION;
        addPopup(`+${CONFIG.CORN_SCORE}`, col.item.x, col.item.y - 14, '#ffd54f');
        events.push({ type: 'corn', x: col.item.x, y: col.item.y });
      } else if (col.type === 'near_miss') {
        state.nearMisses += 1;
        state.score += CONFIG.NEAR_MISS_SCORE;
        addPopup(`+${CONFIG.NEAR_MISS_SCORE} CLOSE!`, runner.state.x + 18, runner.state.y - 82, '#80e5ff');
        events.push({ type: 'near_miss' });
      } else if (col.type === 'hit') {
        const damaged = runner.takeDamage(1);
        if (damaged) {
          state.shakeTimer = CONFIG.SHAKE_DURATION;
          farmer.onStumble(CONFIG.FARMER_STUMBLE_LOSS);
          const label =
            col.item.kind === 'oven'
              ? 'ROASTED!'
              : col.item.kind === 'knife'
                ? 'CARVED!'
                : 'STUMBLED!';
          addPopup(label, runner.state.x, runner.state.y - 88, '#ff7043');
          events.push({ type: 'hit', kind: col.item.kind, x: runner.state.x, y: runner.state.y - 30 });

          if (runner.state.lives <= 0) {
            state.outcome = 'caught';
            state.catchReason =
              col.item.kind === 'oven'
                ? 'Scorched by the Thanksgiving oven!'
                : col.item.kind === 'knife'
                  ? 'Clipped by a flying carving knife!'
                  : 'Out of lives — the farmer caught you!';
            events.push({ type: 'caught' });
          } else if (farmer.isCaught()) {
            state.outcome = 'caught';
            state.catchReason = 'The farmer closed the gap and caught you!';
            events.push({ type: 'caught' });
          }
        }
      }
    }

    if (state.shakeTimer > 0) {
      state.shakeTimer = Math.max(0, state.shakeTimer - dt);
    }

    for (let i = state.popups.length - 1; i >= 0; i--) {
      const p = state.popups[i];
      p.y -= 42 * dt;
      p.life -= dt;
      if (p.life <= 0) state.popups.splice(i, 1);
    }

    // Score = distance + corn + near-misses
    const distanceScore = Math.floor(state.distanceM * CONFIG.SCORE_PER_METER);
    state.score =
      distanceScore +
      state.cornCount * CONFIG.CORN_SCORE +
      state.nearMisses * CONFIG.NEAR_MISS_SCORE;

    if (!state.outcome && state.distanceM >= CONFIG.GATE_DISTANCE_M) {
      state.outcome = 'escaped';
      events.push({ type: 'escaped' });
    }

    return events;
  }

  return {
    state,
    runner,
    farmer,
    hazards,
    reset,
    update,
  };
}
