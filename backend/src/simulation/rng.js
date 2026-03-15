const DEFAULT_SEED = 42;

let activeSeed = DEFAULT_SEED >>> 0;
let lcgState = activeSeed;

function hashStringSeed(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function normalizeSeed(seedInput) {
  if (typeof seedInput === "number" && Number.isFinite(seedInput)) {
    const numeric = Math.floor(seedInput);
    return numeric >>> 0 || DEFAULT_SEED;
  }

  if (typeof seedInput === "string" && seedInput.trim().length > 0) {
    const trimmed = seedInput.trim();
    const parsed = Number.parseInt(trimmed, 10);

    if (Number.isFinite(parsed)) {
      return parsed >>> 0 || DEFAULT_SEED;
    }

    return hashStringSeed(trimmed) || DEFAULT_SEED;
  }

  return DEFAULT_SEED;
}

export function setSeed(seedInput) {
  activeSeed = normalizeSeed(seedInput);
  lcgState = activeSeed;
  return activeSeed;
}

export function getSeed() {
  return activeSeed;
}

export function random() {
  lcgState = (Math.imul(1664525, lcgState) + 1013904223) >>> 0;
  return lcgState / 4294967296;
}

export function randomInt(maxExclusive) {
  const max = Math.floor(maxExclusive);

  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.floor(random() * max);
}

export default {
  normalizeSeed,
  setSeed,
  getSeed,
  random,
  randomInt,
};
