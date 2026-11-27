import { CONFIG } from './config.js';
import { drawTurkey } from './turkey.js';
import { drawFarmer } from './farmer-view.js';

// Renders the warm autumn-dusk farmyard, hazards, characters, and forest gate.
export function renderWorld(ctx, world, particles) {
  const { state, runner, farmer, hazards } = world;
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;

  ctx.save();

  // Screen shake only on damage
  if (state.shakeTimer > 0) {
    const mag = (state.shakeTimer / CONFIG.SHAKE_DURATION) * CONFIG.SHAKE_INTENSITY;
    const sx = Math.sin(state.time * 75) * mag;
    const sy = Math.cos(state.time * 92) * mag * 0.7;
    ctx.translate(sx, sy);
  }

  drawSkyAndSun(ctx, W, H);
  drawDistantHillsAndBarn(ctx, W, state.scrollX);
  drawBackgroundFence(ctx, W, state.scrollX);
  drawGround(ctx, W, H, state.scrollX);

  // Forest gate appears near the finish
  const remainingMeters = CONFIG.GATE_DISTANCE_M - state.distanceM;
  if (remainingMeters < 46) {
    const gateX = CONFIG.TURKEY_X + remainingMeters * CONFIG.PIXELS_PER_METER;
    drawForestGate(ctx, gateX, state.time);
  }

  // Hazards & collectibles
  for (const item of hazards.items) {
    if (item.kind === 'fence') drawFence(ctx, item);
    else if (item.kind === 'hay') drawHayBale(ctx, item);
    else if (item.kind === 'oven') drawOven(ctx, item, state.time);
    else if (item.kind === 'corn') drawCorn(ctx, item);
  }

  // Particles behind/around characters
  particles.draw(ctx);

  // Characters
  const farmerX = farmer.getScreenX(runner.state.x);
  drawFarmer(ctx, farmer.state, farmerX);
  drawTurkey(ctx, runner.state, state.time);

  // Flying knives in foreground for crisp visibility
  for (const item of hazards.items) {
    if (item.kind === 'knife') drawKnife(ctx, item);
  }

  // Floating score/damage popups
  for (const p of state.popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20, 10, 6, 0.85)';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawSkyAndSun(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
  sky.addColorStop(0, '#2c1635');
  sky.addColorStop(0.38, '#7c2d12');
  sky.addColorStop(0.75, '#ea580c');
  sky.addColorStop(1, '#fbbf24');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Setting sun glow
  const sunX = W * 0.76;
  const sunY = CONFIG.GROUND_Y - 190;
  const glow = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 190);
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
  glow.addColorStop(0.35, 'rgba(251, 146, 60, 0.45)');
  glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
}

function drawDistantHillsAndBarn(ctx, W, scrollX) {
  const gy = CONFIG.GROUND_Y;

  // Far hills
  ctx.fillStyle = '#4a1d1f';
  ctx.beginPath();
  ctx.moveTo(0, gy);
  for (let x = 0; x <= W + 40; x += 40) {
    const h = Math.sin((x + scrollX * 0.08) * 0.006) * 42 + 88;
    ctx.lineTo(x, gy - h);
  }
  ctx.lineTo(W, gy);
  ctx.closePath();
  ctx.fill();

  // Parallax red barn & silo
  const barnPeriod = 980;
  const offset = (scrollX * 0.18) % barnPeriod;
  for (let bx = -offset - 120; bx < W + 240; bx += barnPeriod) {
    drawBarn(ctx, bx + 220, gy - 54);
  }

  // Midground autumn tree silhouettes
  ctx.fillStyle = '#361816';
  ctx.beginPath();
  ctx.moveTo(0, gy);
  for (let x = 0; x <= W + 30; x += 30) {
    const h = Math.sin((x + scrollX * 0.25) * 0.015) * 20 + 44;
    ctx.lineTo(x, gy - h);
  }
  ctx.lineTo(W, gy);
  ctx.closePath();
  ctx.fill();
}

function drawBarn(ctx, x, baseY) {
  ctx.save();
  // Silo
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 92, baseY - 108, 30, 108);
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x + 107, baseY - 108, 15, Math.PI, 0);
  ctx.fill();

  // Barn body
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x, baseY - 82, 92, 82);
  // Roof
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(x - 8, baseY - 82);
  ctx.lineTo(x + 46, baseY - 122);
  ctx.lineTo(x + 100, baseY - 82);
  ctx.closePath();
  ctx.fill();
  // Barn X door
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(x + 28, baseY - 46, 36, 46);
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 28, baseY - 46, 36, 46);
  ctx.beginPath();
  ctx.moveTo(x + 28, baseY - 46);
  ctx.lineTo(x + 64, baseY);
  ctx.moveTo(x + 64, baseY - 46);
  ctx.lineTo(x + 28, baseY);
  ctx.stroke();
  ctx.restore();
}

function drawBackgroundFence(ctx, W, scrollX) {
  const gy = CONFIG.GROUND_Y - 14;
  const spacing = 90;
  const offset = (scrollX * 0.55) % spacing;

  ctx.fillStyle = '#5c3317';
  ctx.fillRect(0, gy - 28, W, 5);
  ctx.fillRect(0, gy - 14, W, 5);

  for (let x = -offset; x < W + spacing; x += spacing) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 4, gy - 36, 8, 38);
  }
}

function drawGround(ctx, W, H, scrollX) {
  const gy = CONFIG.GROUND_Y;
  // Grass strip
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, gy - 10, W, 14);
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(0, gy - 2, W, 6);

  // Dirt road
  const dirt = ctx.createLinearGradient(0, gy, 0, H);
  dirt.addColorStop(0, '#78350f');
  dirt.addColorStop(1, '#3b1808');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, gy + 4, W, H - gy - 4);

  // Scrolling road pebbles & tufts
  const step = 120;
  const offset = scrollX % step;
  ctx.fillStyle = 'rgba(254, 215, 170, 0.16)';
  for (let x = -offset; x < W + step; x += step) {
    ctx.beginPath();
    ctx.ellipse(x + 20, gy + 36, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 78, gy + 74, 24, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFence(ctx, item) {
  const { x, y, w, h } = item;
  ctx.save();
  // Posts
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 4, y, 10, h);
  ctx.fillRect(x + w - 14, y, 10, h);
  // Pointed tops
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 9, y - 8);
  ctx.lineTo(x + 14, y);
  ctx.moveTo(x + w - 14, y);
  ctx.lineTo(x + w - 9, y - 8);
  ctx.lineTo(x + w - 4, y);
  ctx.fill();
  // Rails
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x, y + 12, w, 11);
  ctx.fillRect(x, y + 36, w, 11);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 12, w, 11);
  ctx.strokeRect(x, y + 36, w, 11);
  ctx.restore();
}

function drawHayBale(ctx, item) {
  const { x, y, w, h } = item;
  ctx.save();
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Twine bands
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + 20, y + h);
  ctx.moveTo(x + w - 20, y);
  ctx.lineTo(x + w - 20, y + h);
  ctx.stroke();

  // Straw texture lines
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  for (let i = 10; i < h - 8; i += 10) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y + i);
    ctx.lineTo(x + w - 6, y + i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOven(ctx, item, time) {
  const { x, y, w, h, phase, timer } = item;
  ctx.save();

  const shakeX = phase === 'telegraph' ? Math.sin(time * 55) * 2.5 : 0;
  ctx.translate(shakeX, 0);

  // Chimney
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(x + w - 26, y - 24, 18, 28);

  // Brick oven body
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [22, 22, 4, 4]);
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Brick mortar lines
  ctx.strokeStyle = 'rgba(254, 215, 170, 0.25)';
  ctx.lineWidth = 1.5;
  for (let row = 22; row < h; row += 22) {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + row);
    ctx.lineTo(x + w - 4, y + row);
    ctx.stroke();
  }

  // Glowing oven door arch
  const doorW = w * 0.56;
  const doorH = h * 0.5;
  const doorX = x + (w - doorW) * 0.5;
  const doorY = y + h - doorH - 6;

  const glowIntensity = phase === 'flame' ? 1 : phase === 'telegraph' ? 0.85 : 0.35;
  ctx.fillStyle = phase === 'cooldown' ? '#292524' : `rgba(251, 146, 60, ${glowIntensity})`;
  ctx.beginPath();
  ctx.roundRect(doorX, doorY, doorW, doorH, [24, 24, 2, 2]);
  ctx.fill();

  if (phase !== 'cooldown') {
    ctx.fillStyle = phase === 'flame' ? '#fef08a' : '#fdba74';
    ctx.beginPath();
    ctx.roundRect(doorX + 8, doorY + 10, doorW - 16, doorH - 14, [16, 16, 2, 2]);
    ctx.fill();
  }

  // Telegraph warning indicator + heat shimmer
  if (phase === 'telegraph') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 22);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y - 8);
    ctx.lineTo(x + w * 0.5, y - 56);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y - 74, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#991b1b';
    ctx.font = '900 21px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', x + w * 0.5, y - 73);
  }

  // Roaring flame jet
  if (phase === 'flame') {
    const cx = x + w * 0.5;
    const fh = CONFIG.OVEN_FLAME_H + Math.sin(time * 40) * 12;

    // Outer orange flame
    const grad = ctx.createLinearGradient(cx, y, cx, y - fh);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.55, '#f97316');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - 32, y + 6);
    ctx.quadraticCurveTo(cx - 38, y - fh * 0.55, cx, y - fh);
    ctx.quadraticCurveTo(cx + 38, y - fh * 0.55, cx + 32, y + 6);
    ctx.closePath();
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx - 16, y + 6);
    ctx.quadraticCurveTo(cx - 18, y - fh * 0.4, cx, y - fh * 0.72);
    ctx.quadraticCurveTo(cx + 18, y - fh * 0.4, cx + 16, y + 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawKnife(ctx, item) {
  const cx = item.x + item.w * 0.5;
  const cy = item.y + item.h * 0.5;
  ctx.save();
  ctx.translate(cx, cy);

  // Motion trail
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, -4);
  ctx.lineTo(54, -4);
  ctx.moveTo(18, 5);
  ctx.lineTo(48, 5);
  ctx.stroke();

  ctx.rotate(item.spin);

  // Steel blade
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-30, -2);
  ctx.lineTo(14, -10);
  ctx.lineTo(14, 7);
  ctx.quadraticCurveTo(-10, 11, -30, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Blade glint
  const glintAlpha = 0.45 + 0.55 * Math.abs(Math.sin(item.glint));
  ctx.strokeStyle = `rgba(255, 255, 255, ${glintAlpha})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-18, -1);
  ctx.lineTo(8, -6);
  ctx.stroke();

  // Wooden handle
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(14, -5, 18, 9, 3);
  ctx.fill();

  ctx.restore();
}

function drawCorn(ctx, item) {
  const bobY = item.y + Math.sin(item.bobPhase) * 5;
  ctx.save();
  ctx.translate(item.x, bobY);

  // Soft golden aura
  ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  // Green husks
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(-6, 6, 6, 13, -0.4, 0, Math.PI * 2);
  ctx.ellipse(6, 6, 6, 13, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Golden cob
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.ellipse(0, -2, 8.5, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawForestGate(ctx, gateX, time) {
  const gy = CONFIG.GROUND_Y;
  ctx.save();
  ctx.translate(gateX, gy);

  // Pine trees beyond the gate
  const treeOffsets = [55, 115, 175];
  for (const tx of treeOffsets) {
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(tx, -190);
    ctx.lineTo(tx - 42, -20);
    ctx.lineTo(tx + 42, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(tx - 7, -20, 14, 20);
  }

  // Wooden archway posts
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(-16, -180, 18, 180);
  ctx.fillRect(88, -180, 18, 180);
  ctx.fillRect(-26, -192, 142, 22);

  // Banner sign
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-8, -226, 106, 36, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#14532d';
  ctx.font = '900 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FOREST GATE', 45, -208);

  // Warm lantern glow
  const glow = 0.75 + 0.25 * Math.sin(time * 6);
  ctx.fillStyle = `rgba(253, 224, 71, ${glow * 0.45})`;
  ctx.beginPath();
  ctx.arc(10, -146, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.fillRect(5, -154, 10, 14);

  ctx.restore();
}
