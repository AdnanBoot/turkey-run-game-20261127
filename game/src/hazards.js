import { CONFIG } from './config.js';

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function rectNearMiss(a, b, margin) {
  const expanded = {
    x: b.x - margin,
    y: b.y - margin,
    w: b.w + margin * 2,
    h: b.h + margin * 2,
  };
  return rectsOverlap(a, expanded);
}

// Hazard & collectible manager: ovens, carving knives, fences, hay bales, and corn.
export function createHazards(rng) {
  const items = [];
  let spawnCooldown = 0.9;
  let knifeCooldown = 2.4;

  function reset() {
    items.length = 0;
    spawnCooldown = 0.85;
    knifeCooldown = 2.2;
  }

  function spawnGroundSet(difficulty) {
    const roll = rng.next();
    const spawnX = CONFIG.WIDTH + 110;

    if (roll < 0.30) {
      // Wooden fence + optional corn arc above
      items.push({
        kind: 'fence',
        x: spawnX,
        y: CONFIG.GROUND_Y - CONFIG.FENCE_H,
        w: CONFIG.FENCE_W,
        h: CONFIG.FENCE_H,
        hit: false,
        nearMissChecked: false,
      });
      if (rng.next() < 0.72) {
        items.push({
          kind: 'corn',
          x: spawnX + CONFIG.FENCE_W * 0.5,
          y: CONFIG.GROUND_Y - CONFIG.FENCE_H - 72,
          r: CONFIG.CORN_R,
          bobPhase: rng.range(0, Math.PI * 2),
          collected: false,
        });
      }
    } else if (roll < 0.58) {
      // Hay bale + corn trail
      items.push({
        kind: 'hay',
        x: spawnX,
        y: CONFIG.GROUND_Y - CONFIG.HAY_H,
        w: CONFIG.HAY_W,
        h: CONFIG.HAY_H,
        hit: false,
        nearMissChecked: false,
      });
      if (rng.next() < 0.65) {
        items.push({
          kind: 'corn',
          x: spawnX + CONFIG.HAY_W * 0.5,
          y: CONFIG.GROUND_Y - CONFIG.HAY_H - 68,
          r: CONFIG.CORN_R,
          bobPhase: rng.range(0, Math.PI * 2),
          collected: false,
        });
      }
    } else if (roll < 0.86) {
      // Glowing brick oven with telegraphed flame jet
      const telegraphTime =
        CONFIG.OVEN_TELEGRAPH_MAX -
        difficulty * (CONFIG.OVEN_TELEGRAPH_MAX - CONFIG.OVEN_TELEGRAPH_MIN);
      items.push({
        kind: 'oven',
        x: spawnX,
        y: CONFIG.GROUND_Y - CONFIG.OVEN_H,
        w: CONFIG.OVEN_W,
        h: CONFIG.OVEN_H,
        phase: 'telegraph',
        timer: telegraphTime,
        telegraphTime,
        hit: false,
        nearMissChecked: false,
      });
    } else {
      // Bonus corn cluster on the path
      for (let i = 0; i < 3; i++) {
        items.push({
          kind: 'corn',
          x: spawnX + i * 54,
          y: CONFIG.GROUND_Y - 42 - (i === 1 ? 24 : 0),
          r: CONFIG.CORN_R,
          bobPhase: i * 0.8,
          collected: false,
        });
      }
    }
  }

  function spawnKnife(difficulty) {
    const isHigh = rng.next() < 0.68; // mostly high knives to reward ducking
    const y = isHigh ? CONFIG.KNIFE_HIGH_Y : CONFIG.KNIFE_LOW_Y;
    items.push({
      kind: 'knife',
      x: CONFIG.WIDTH + 90,
      y,
      w: CONFIG.KNIFE_W,
      h: CONFIG.KNIFE_H,
      speedBonus: CONFIG.KNIFE_SPEED_BONUS * (0.85 + difficulty * 0.45),
      spin: rng.range(0, Math.PI * 2),
      glint: rng.range(0, Math.PI * 2),
      isHigh,
      hit: false,
      nearMissChecked: false,
      whooshed: false,
    });
  }

  function getHazardHitbox(item) {
    if (item.kind === 'oven') {
      // Only the active flame jet + hot oven mouth hurts
      if (item.phase === 'flame') {
        return {
          x: item.x + 14,
          y: item.y - CONFIG.OVEN_FLAME_H + 22,
          w: item.w - 28,
          h: CONFIG.OVEN_FLAME_H + item.h - 22,
        };
      }
      return null;
    }
    if (item.kind === 'corn') {
      return {
        x: item.x - item.r,
        y: item.y - item.r,
        w: item.r * 2,
        h: item.r * 2,
      };
    }
    // Slight inset for fair hitboxes on fences, hay, and knives
    return {
      x: item.x + 6,
      y: item.y + 5,
      w: item.w - 12,
      h: item.h - 8,
    };
  }

  function update(dt, scrollSpeed, difficulty, allowSpawn) {
    const events = [];

    if (allowSpawn) {
      spawnCooldown -= dt;
      if (spawnCooldown <= 0) {
        spawnGroundSet(difficulty);
        const minGap = 1.25 - difficulty * 0.42;
        const maxGap = 1.95 - difficulty * 0.55;
        spawnCooldown = rng.range(minGap, maxGap);
      }

      knifeCooldown -= dt;
      if (knifeCooldown <= 0) {
        spawnKnife(difficulty);
        const minK = 2.1 - difficulty * 0.9;
        const maxK = 3.5 - difficulty * 1.2;
        knifeCooldown = rng.range(minK, maxK);
      }
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const moveSpeed = item.kind === 'knife' ? scrollSpeed + item.speedBonus : scrollSpeed;
      item.x -= moveSpeed * dt;

      if (item.kind === 'knife') {
        item.spin -= dt * 13;
        item.glint += dt * 7;
        if (!item.whooshed && item.x < CONFIG.TURKEY_X + 360) {
          item.whooshed = true;
          events.push({ type: 'knife_whoosh', x: item.x, y: item.y });
        }
      } else if (item.kind === 'corn') {
        item.bobPhase += dt * 4.5;
      } else if (item.kind === 'oven') {
        item.timer -= dt;
        if (item.phase === 'telegraph' && item.timer <= 0) {
          item.phase = 'flame';
          item.timer = CONFIG.OVEN_ACTIVE_TIME;
          events.push({ type: 'oven_flame', x: item.x + item.w * 0.5, y: item.y });
        } else if (item.phase === 'flame' && item.timer <= 0) {
          item.phase = 'cooldown';
          item.timer = CONFIG.OVEN_COOLDOWN_TIME;
        } else if (item.phase === 'cooldown' && item.timer <= 0) {
          item.phase = 'telegraph';
          item.timer = item.telegraphTime;
        }
      }

      if (item.x < -220 || item.collected) {
        items.splice(i, 1);
      }
    }

    return events;
  }

  function checkCollisions(turkeyBox, turkeyX) {
    const results = [];
    for (const item of items) {
      if (item.kind === 'corn') {
        if (!item.collected && rectsOverlap(turkeyBox, getHazardHitbox(item))) {
          item.collected = true;
          results.push({ type: 'corn', item });
        }
        continue;
      }

      const box = getHazardHitbox(item);
      if (box && !item.hit && rectsOverlap(turkeyBox, box)) {
        item.hit = true;
        item.nearMissChecked = true;
        results.push({ type: 'hit', item });
        continue;
      }

      if (!item.nearMissChecked && !item.hit && item.x + (item.w || 0) < turkeyX - 24) {
        item.nearMissChecked = true;
        if (box && rectNearMiss(turkeyBox, box, CONFIG.NEAR_MISS_MARGIN)) {
          results.push({ type: 'near_miss', item });
        }
      }
    }
    return results;
  }

  return {
    items,
    reset,
    update,
    checkCollisions,
  };
}
