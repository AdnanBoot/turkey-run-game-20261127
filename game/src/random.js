// Seeded PRNG (mulberry32) so runs and screenshot scenes are deterministic.
export function createRandom(seed = 1) {
  let state = seed | 0;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, maxInclusive) {
      return Math.floor(min + next() * (maxInclusive - min + 1));
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
  };
}
