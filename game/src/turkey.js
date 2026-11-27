// Procedural Canvas 2D drawing for the fleeing turkey.
export function drawTurkey(ctx, runnerState, time) {
  const { x, y, grounded, ducking, invulnTimer, stumbleTimer, runCycle, flapCycle } = runnerState;

  // Blink during invulnerability frames
  if (invulnTimer > 0 && Math.floor(invulnTimer * 16) % 2 === 1) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawTurkeyBody(ctx, x, y, grounded, ducking, stumbleTimer, runCycle, flapCycle, time);
    ctx.restore();
    return;
  }

  drawTurkeyBody(ctx, x, y, grounded, ducking, stumbleTimer, runCycle, flapCycle, time);
}

function drawTurkeyBody(ctx, x, y, grounded, ducking, stumbleTimer, runCycle, flapCycle, time) {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  const groundOffset = Math.max(0, 580 - y);
  const shadowScale = Math.max(0.4, 1 - groundOffset / 260);
  ctx.save();
  ctx.translate(0, groundOffset);
  ctx.fillStyle = 'rgba(20, 10, 6, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 28 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (ducking) {
    ctx.scale(1.12, 0.62);
  } else if (stumbleTimer > 0) {
    ctx.rotate(Math.sin(time * 32) * 0.16 - 0.12);
  } else if (!grounded) {
    ctx.rotate(-0.1);
  }

  const bob = grounded ? Math.abs(Math.sin(runCycle * 2)) * -4 : 0;
  ctx.translate(0, bob);

  // Running legs
  const legA = grounded ? Math.sin(runCycle) * 14 : -10;
  const legB = grounded ? Math.sin(runCycle + Math.PI) * 14 : 10;
  drawLeg(ctx, -6, -16, legA);
  drawLeg(ctx, 8, -16, legB);

  // Fanned tail feathers (behind body, to the left)
  const featherColors = ['#8c2d19', '#d95f02', '#f59e0b', '#b45309', '#9a3412'];
  for (let i = 0; i < 7; i++) {
    const angle = -2.75 + i * 0.24 + Math.sin(runCycle + i) * 0.03;
    ctx.save();
    ctx.translate(-14, -28);
    ctx.rotate(angle);
    ctx.fillStyle = featherColors[i % featherColors.length];
    ctx.beginPath();
    ctx.ellipse(18, 0, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Feather tip accent
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(31, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Plump brown body
  ctx.fillStyle = '#6b3e26';
  ctx.beginPath();
  ctx.ellipse(0, -28, 25, 20, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3b1f10';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Warm breast highlight
  ctx.fillStyle = '#8b5436';
  ctx.beginPath();
  ctx.ellipse(6, -26, 15, 13, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Flapping wing
  const wingAngle = grounded ? Math.sin(runCycle * 2) * 0.14 : Math.sin(flapCycle) * 0.55 - 0.35;
  ctx.save();
  ctx.translate(-2, -30);
  ctx.rotate(wingAngle);
  ctx.fillStyle = '#532e1a';
  ctx.beginPath();
  ctx.ellipse(-2, 4, 15, 9, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3b1f10';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Neck & head
  ctx.fillStyle = '#7c472c';
  ctx.beginPath();
  ctx.ellipse(18, -44, 8, 13, 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8b5436';
  ctx.beginPath();
  ctx.arc(22, -55, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3b1f10';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Red snood (over beak) & wattle (under chin)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(29, -56, 4.5, 7.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(27, -45, 4.5, 6.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Yellow beak
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(31, -57);
  ctx.lineTo(43, -53);
  ctx.lineTo(31, -49);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Expressive eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(24, -57, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(25.2, -57, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(25.9, -58, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLeg(ctx, lx, ly, strideX) {
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(lx + strideX * 0.55, ly + 8);
  ctx.lineTo(lx + strideX, 0);
  ctx.stroke();

  // Foot
  ctx.beginPath();
  ctx.moveTo(lx + strideX - 3, 0);
  ctx.lineTo(lx + strideX + 7, 0);
  ctx.stroke();
}
