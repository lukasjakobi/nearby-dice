/** Returns a float in [0, 1). */
export type Rng = () => number;

/** Small, fast seeded PRNG (mulberry32). */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Combines numbers into one 32-bit seed (FNV-1a style). */
export function mixSeed(...parts: number[]): number {
  let hash = 2166136261;
  for (const part of parts) {
    hash ^= part >>> 0;
    hash = Math.imul(hash, 16777619);
    hash ^= hash >>> 13;
  }

  return hash >>> 0;
}

export function rollDie(rng: Rng): number {
  return 1 + Math.floor(rng() * 6);
}

export function randomSeed(rng: Rng = Math.random): number {
  return Math.floor(rng() * 2 ** 32);
}
