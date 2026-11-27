import { CONFIG } from './config.js';

// Particle system for dust puffs, falling autumn leaves, flame sparks, and feathers.
export function createParticles(rng) {
  const items = [];
  let leafTimer = 0;

  function reset() {
    items.length = 0;
    leafTimer = 0;
  }

  function spawnDust(x, y, count = 7) {
    for (let i = 0; i < count; i++) {
      items.push({
        kind: 'dust',
        x: x + rng.range(-14, 14),
        y: y - rng.range(0, 6),
        vx: rng.range(-120, -20),
        vy: rng.range(-85, -20),
        r: rng.range(4, 9),
        life: rng.range(0.28, 0.52),
        maxLife: 0.52,
        color: '#d6b48c',
      });
    }
  }

  function spawnFeathers(x, y, count = 12) {
    const colors = ['#9a3412', '#d97706', '#f59e0b', '#dc2626'];
    for (let i = 0; i < count; i++) {
      items.push({
        kind: 'feather',
        x,
        y,
        vx: rng.range(-190, 140),
        vy: rng.range(-260, -60),
        rot: rng.range(0, Math.PI * 2),
        vrot: rng.range(-8, 8),
        r: rng.range(6, 11),
        life: rng.range(0.55, 0.95),
        maxLife: 0.95,
        color: colors[i % colors.length],
      });
    }
  }

  function spawnSparkles(x, y, count = 9) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      items.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(angle) * rng.range(70, 150),
        vy: Math.sin(angle) * rng.range(70, 150),
        r: rng.range(3, 6),
        life: 0.42,
        maxLife: 0.42,
        color: '#fde047',
      });
    }
  }

  function spawnFlameSparks(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      items.push({
        kind: 'spark',
        x: x + rng.range(-22, 22),
        y: y - rng.range(10, 60),
        vx: rng.range(-90, 40),
        vy: rng.range(-240, -100),
        r: rng.range(3, 6),
        life: rng.range(0.35, 0.65),
        maxLife: 0.65,
        color: rng.next() < 0.5 ? '#fb923c' : '#fef08a',
      });
    }
  }

  function update(dt, scrollSpeed) {
    leafTimer -= dt;
    if (leafTimer <= 0) {
      leafTimer = rng.range(0.14, 0.32);
      const leafColors = ['#ea580c', '#f59e0b', '#b91c1c', '#d97706'];
      items.push({
        kind: 'leaf',
        x: CONFIG.WIDTH + 20,
        y: rng.range(40, CONFIG.GROUND_Y - 120),
        vx: -scrollSpeed * rng.range(0.45, 0.8),
        vy: rng.range(28, 64),
        rot: rng.range(0, Math.PI * 2),
        vrot: rng.range(-3, 3),
        r: rng.range(5, 8),
        life: 4.5,
        maxLife: 4.5,
        color: leafColors[rng.int(0, leafColors.length - 1)],
      });
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0 || p.x < -60) {
        items.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'feather') {
        p.vy += 420 * dt;
        p.rot += p.vrot * dt;
      } else if (p.kind === 'leaf') {
        p.vy += Math.sin(p.life * 5) * 18 * dt;
        p.rot += p.vrot * dt;
      }
    }
  }

  function draw(ctx) {
    for (const p of items) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = p.kind === 'leaf' ? Math.min(0.85, alpha * 1.4) : alpha;
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;

      if (p.kind === 'feather' || p.kind === 'leaf') {
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.4, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  return {
    reset,
    spawnDust,
    spawnFeathers,
    spawnSparkles,
    spawnFlameSparks,
    update,
    draw,
  };
}
