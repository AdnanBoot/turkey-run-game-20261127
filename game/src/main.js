import { CONFIG } from './config.js';
import { createRandom } from './random.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { renderWorld } from './render.js';
import { drawHUD } from './hud.js';
import { createParticles } from './particles.js';
import { createAudio } from './audio.js';
import { applyShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const baseSeed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 20261127;
const shotName = params.get('shot');

let rng = createRandom(baseSeed);
const input = createInput(canvas);
const world = createWorld(rng);
const particles = createParticles(rng);
const audio = createAudio();

let screen = 'title'; // 'title' | 'running' | 'paused' | 'caught' | 'escaped'
let actionRect = null;
let accumulator = 0;
let lastTime = performance.now();

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function pointInRect(pt, rect) {
  return (
    pt &&
    rect &&
    pt.x >= rect.x &&
    pt.x <= rect.x + rect.w &&
    pt.y >= rect.y &&
    pt.y <= rect.y + rect.h
  );
}

function startNewRun() {
  rng = createRandom(baseSeed);
  world.reset();
  particles.reset();
  screen = 'running';
  announce('Gobble Run started. Jump with Space or click, duck with Down or S.');
}

function handleWorldEvents(events) {
  for (const ev of events) {
    if (ev.type === 'jump') {
      audio.playJump();
      particles.spawnDust(ev.x, ev.y, 6);
    } else if (ev.type === 'land') {
      particles.spawnDust(ev.x, ev.y, 8);
    } else if (ev.type === 'corn') {
      audio.playGobble();
      particles.spawnSparkles(ev.x, ev.y, 9);
    } else if (ev.type === 'knife_whoosh') {
      audio.playWhoosh();
    } else if (ev.type === 'oven_flame') {
      audio.playFlame();
      particles.spawnFlameSparks(ev.x, ev.y, 10);
    } else if (ev.type === 'hit') {
      audio.playHit();
      particles.spawnFeathers(ev.x, ev.y, 14);
      announce(`Hit! ${world.runner.state.lives} lives remaining.`);
    } else if (ev.type === 'escaped') {
      audio.playWin();
      screen = 'escaped';
      announce(`Escaped to the Forest Gate! Final score ${world.state.score}.`);
    } else if (ev.type === 'caught') {
      audio.playLose();
      screen = 'caught';
      announce(`Caught! ${world.state.catchReason} Final score ${world.state.score}.`);
    }
  }
}

function stepSimulation(dt) {
  if (input.wasPressed('KeyM')) {
    const m = audio.toggleMute();
    announce(m ? 'Sound muted.' : 'Sound unmuted.');
  }

  const clickPos = input.wasPointerClicked();

  if (screen === 'title') {
    if (input.wasPressed('Space') || input.wasPressed('Enter') || pointInRect(clickPos, actionRect) || clickPos) {
      startNewRun();
    }
    input.endFrame();
    return;
  }

  if (screen === 'paused') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape') || pointInRect(clickPos, actionRect)) {
      screen = 'running';
      announce('Resumed.');
    } else if (input.wasPressed('KeyR')) {
      startNewRun();
    }
    input.endFrame();
    return;
  }

  if (screen === 'caught' || screen === 'escaped') {
    if (input.wasPressed('KeyR') || input.wasPressed('Space') || input.wasPressed('Enter') || pointInRect(clickPos, actionRect)) {
      startNewRun();
    }
    input.endFrame();
    return;
  }

  // Running state
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    screen = 'paused';
    announce('Game paused.');
    input.endFrame();
    return;
  }
  if (input.wasPressed('KeyR')) {
    startNewRun();
    input.endFrame();
    return;
  }

  const events = world.update(dt, input);
  particles.update(dt, world.state.speed);
  handleWorldEvents(events);
  input.endFrame();
}

function renderFrame() {
  renderWorld(ctx, world, particles);
  actionRect = drawHUD(ctx, world, screen, audio.isMuted());
}

if (shotName) {
  screen = applyShotScene(shotName, world, particles);
  renderFrame();
} else {
  announce('Gobble Run ready. Press Space or click Start Run to play.');
  function loop(now) {
    const frameDt = Math.min(CONFIG.MAX_FRAME_DT, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    accumulator += frameDt;

    while (accumulator >= CONFIG.STEP) {
      stepSimulation(CONFIG.STEP);
      accumulator -= CONFIG.STEP;
    }

    renderFrame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
