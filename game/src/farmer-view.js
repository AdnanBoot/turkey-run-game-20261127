import { CONFIG } from './config.js';

// Procedural Canvas 2D drawing for the chasing farmer with hat, apron, moustache, and pitchfork.
export function drawFarmer(ctx, farmerState, x) {
  const y = CONFIG.GROUND_Y;
  const bob = Math.abs(Math.sin(farmerState.runCycle * 2)) * -4;

  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(20, 10, 6, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 32, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bob);

  // Running legs & boots
  const strideA = Math.sin(farmerState.runCycle) * 16;
  const strideB = Math.sin(farmerState.runCycle + Math.PI) * 16;
  drawBootLeg(ctx, -8, -28, strideA);
  drawBootLeg(ctx, 8, -28, strideB);

  // Torso (plaid shirt + denim overalls)
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-20, -76, 40, 48, 8);
  ctx.fill();

  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-18, -62, 36, 36, 6);
  ctx.fill();

  // White apron tied around waist
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(-14, -56, 28, 34, 4);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Pitchfork held forward
  ctx.save();
  ctx.translate(10, -56);
  ctx.rotate(Math.sin(farmerState.runCycle * 2) * 0.08 - 0.12);
  // Wooden handle
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, 6);
  ctx.lineTo(44, -8);
  ctx.stroke();
  // Steel prongs
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(44, -8);
  ctx.lineTo(54, -10);
  ctx.moveTo(52, -19);
  ctx.lineTo(52, -1);
  ctx.moveTo(52, -19);
  ctx.lineTo(68, -22);
  ctx.moveTo(52, -10);
  ctx.lineTo(70, -13);
  ctx.moveTo(52, -1);
  ctx.lineTo(68, -4);
  ctx.stroke();
  ctx.restore();

  // Head
  ctx.fillStyle = '#f5c29b';
  ctx.beginPath();
  ctx.arc(2, -92, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Angry eyes & furrowed brow
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(9, -94, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(4, -100);
  ctx.lineTo(14, -97);
  ctx.stroke();

  // Bushy moustache
  ctx.fillStyle = '#5c3317';
  ctx.beginPath();
  ctx.ellipse(9, -86, 10, 4.5, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Straw/felt farm hat
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(0, -105, 25, 5.5, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.roundRect(-13, -120, 26, 15, [6, 6, 0, 0]);
  ctx.fill();
  // Hat band
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(-13, -109, 26, 4);

  // Angry shout bubble
  if (farmerState.shoutTimer > 0 && farmerState.shoutText) {
    drawShoutBubble(ctx, 18, -148, farmerState.shoutText);
  }

  ctx.restore();
}

function drawBootLeg(ctx, lx, ly, strideX) {
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(lx + strideX, -6);
  ctx.stroke();

  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.ellipse(lx + strideX + 4, -3, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawShoutBubble(ctx, bx, by, text) {
  ctx.save();
  ctx.font = 'bold 14px system-ui, sans-serif';
  const paddingX = 12;
  const textW = ctx.measureText(text).width;
  const boxW = textW + paddingX * 2;
  const boxH = 30;

  ctx.fillStyle = '#fffbeb';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(bx - 10, by - boxH, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  // Speech pointer
  ctx.beginPath();
  ctx.moveTo(bx + 6, by);
  ctx.lineTo(bx - 2, by + 10);
  ctx.lineTo(bx + 16, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#991b1b';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx - 10 + paddingX, by - boxH * 0.5 + 1);
  ctx.restore();
}
