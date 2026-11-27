import { CONFIG } from './config.js';

// Draws the lit HUD (score, distance, lives, farmer-gap bar, corn, speed) and screen overlays.
export function drawHUD(ctx, world, screen, muted) {
  const { state, runner, farmer } = world;
  const W = CONFIG.WIDTH;

  ctx.save();

  // Top-left: Score, Corn, Speed
  drawPanel(ctx, 20, 16, 252, 86);
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 36, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.fillText(String(state.score).padStart(5, '0'), 36, 66);

  ctx.fillStyle = '#facc15';
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText(`CORN ${state.cornCount}`, 36, 90);
  const kmh = Math.round((state.speed / CONFIG.PIXELS_PER_METER) * 3.6);
  ctx.fillStyle = '#fdba74';
  ctx.fillText(`${kmh} km/h`, 132, 90);

  // Top-center: Distance to Forest Gate + Farmer Gap Bar
  const centerW = 460;
  const centerX = (W - centerW) * 0.5;
  drawPanel(ctx, centerX, 16, centerW, 86);

  const distInt = Math.floor(state.distanceM);
  const progress = Math.min(1, state.distanceM / CONFIG.GATE_DISTANCE_M);

  ctx.fillStyle = '#fde68a';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`FOREST GATE`, centerX + 18, 36);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${distInt}m / ${CONFIG.GATE_DISTANCE_M}m`, centerX + centerW - 18, 36);

  // Distance progress track
  const barX = centerX + 18;
  const barW = centerW - 36;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(barX, 44, barW, 11, 6);
  ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.roundRect(barX, 44, Math.max(10, barW * progress), 11, 6);
  ctx.fill();

  // Farmer-gap bar
  const gapPct = Math.max(0, Math.min(1, farmer.state.displayGap / CONFIG.FARMER_MAX_GAP));
  ctx.textAlign = 'left';
  ctx.fillStyle = gapPct < 0.36 ? '#fca5a5' : '#fed7aa';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.fillText('FARMER GAP', barX, 74);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(gapPct * 100)}%`, centerX + centerW - 18, 74);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(barX, 80, barW, 11, 6);
  ctx.fill();
  ctx.fillStyle = gapPct < 0.35 ? '#ef4444' : gapPct < 0.65 ? '#f59e0b' : '#fbbf24';
  ctx.beginPath();
  ctx.roundRect(barX, 80, Math.max(8, barW * gapPct), 11, 6);
  ctx.fill();

  // Top-right: 3 Turkey Lives + Mute/Pause hint
  drawPanel(ctx, W - 242, 16, 222, 86);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('LIVES', W - 224, 36);

  for (let i = 0; i < CONFIG.MAX_LIVES; i++) {
    drawMiniTurkeyIcon(ctx, W - 196 + i * 52, 62, i < runner.state.lives);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(muted ? 'MUTED (M)' : 'SOUND ON (M) · PAUSE (P)', W - 34, 92);

  // Screen overlays return interactive button rects
  let actionRect = null;
  if (screen === 'title') {
    actionRect = drawTitleOverlay(ctx);
  } else if (screen === 'paused') {
    actionRect = drawPausedOverlay(ctx);
  } else if (screen === 'caught' || screen === 'escaped') {
    actionRect = drawEndOverlay(ctx, world, screen === 'escaped');
  }

  ctx.restore();
  return actionRect;
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(28, 14, 12, 0.78)';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
}

function drawMiniTurkeyIcon(ctx, cx, cy, active) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = active ? 1 : 0.24;

  // Tail fan
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(-5, -2, 12, Math.PI * 0.65, Math.PI * 1.65);
  ctx.fill();

  // Head
  ctx.fillStyle = '#8b5436';
  ctx.beginPath();
  ctx.arc(3, -3, 10, 0, Math.PI * 2);
  ctx.fill();

  // Wattle
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(9, 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(11, -5);
  ctx.lineTo(19, -2);
  ctx.lineTo(11, 1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTitleOverlay(ctx) {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;

  ctx.fillStyle = 'rgba(18, 8, 6, 0.48)';
  ctx.fillRect(0, 0, W, H);

  const cardW = 640;
  const cardH = 360;
  const cardX = (W - cardW) * 0.5;
  const cardY = 148;

  drawPanel(ctx, cardX, cardY, cardW, cardH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fb923c';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText('THANKSGIVING ESCAPE RUNNER', W * 0.5, cardY + 46);

  ctx.fillStyle = '#fef3c7';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText('GOBBLE RUN', W * 0.5, cardY + 114);

  ctx.fillStyle = '#fed7aa';
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.fillText('Outrun the farmer, dodge ovens & carving knives, reach the Forest Gate!', W * 0.5, cardY + 158);

  ctx.fillStyle = '#fde68a';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('JUMP: Space / W / Up / Click   ·   DUCK: S / Down   ·   PAUSE: P   ·   MUTE: M', W * 0.5, cardY + 206);

  const btnW = 260;
  const btnH = 62;
  const btnX = (W - btnW) * 0.5;
  const btnY = cardY + 252;

  ctx.fillStyle = '#ea580c';
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillText('START RUN', W * 0.5, btnY + 40);

  return { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawPausedOverlay(ctx) {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  ctx.fillStyle = 'rgba(18, 8, 6, 0.56)';
  ctx.fillRect(0, 0, W, H);

  const cardW = 420;
  const cardH = 220;
  const cardX = (W - cardW) * 0.5;
  const cardY = (H - cardH) * 0.5;
  drawPanel(ctx, cardX, cardY, cardW, cardH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef3c7';
  ctx.font = '900 42px system-ui, sans-serif';
  ctx.fillText('PAUSED', W * 0.5, cardY + 72);

  ctx.fillStyle = '#fed7aa';
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('Press P to resume or R to restart', W * 0.5, cardY + 114);

  const btnW = 200;
  const btnH = 50;
  const btnX = (W - btnW) * 0.5;
  const btnY = cardY + 142;

  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText('RESUME', W * 0.5, btnY + 32);

  return { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawEndOverlay(ctx, world, escaped) {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  const { state } = world;

  ctx.fillStyle = 'rgba(18, 8, 6, 0.58)';
  ctx.fillRect(0, 0, W, H);

  const cardW = 580;
  const cardH = 340;
  const cardX = (W - cardW) * 0.5;
  const cardY = 165;
  drawPanel(ctx, cardX, cardY, cardW, cardH);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#4ade80' : '#f87171';
  ctx.font = '900 46px system-ui, sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', W * 0.5, cardY + 68);

  ctx.fillStyle = '#fef3c7';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText(
    escaped
      ? 'You made it past the Forest Gate — no Thanksgiving dinner today!'
      : state.catchReason || 'The farmer caught you before the Forest Gate!',
    W * 0.5,
    cardY + 106,
  );

  // Stats row
  const statsY = cardY + 164;
  drawStatBox(ctx, cardX + 46, statsY, 148, 'SCORE', String(state.score));
  drawStatBox(ctx, cardX + 216, statsY, 148, 'DISTANCE', `${Math.floor(state.distanceM)}m`);
  drawStatBox(ctx, cardX + 386, statsY, 148, 'CORN', String(state.cornCount));

  const btnW = 240;
  const btnH = 56;
  const btnX = (W - btnW) * 0.5;
  const btnY = cardY + 256;

  ctx.fillStyle = escaped ? '#16a34a' : '#ea580c';
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('PLAY AGAIN (R)', W * 0.5, btnY + 36);

  return { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawStatBox(ctx, x, y, w, label, value) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(x, y - 24, w, 68, 10);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(label, x + w * 0.5, y - 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px system-ui, sans-serif';
  ctx.fillText(value, x + w * 0.5, y + 28);
}
