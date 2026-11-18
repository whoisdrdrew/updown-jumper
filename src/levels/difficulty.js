// The difficulty curve: every level is longer and harder than the one before.
// Level 1 (Solomun) is the baseline: the curve starts at its numbers, so it fits without changes.
// `npm run check-levels` measures every GAMEPLAY file and fails when a level misses its targets or
// isn't longer and harder than the level before it. Only GAMEPLAY files are measured; worlds don't
// count towards difficulty.
import { LEGEND, DUCK, BURGER } from './legend.js';

const MAX_PIT = 5; // a running jump clears about 5.8 tiles, so no pit is wider than 5

// What level n (1, 2, 3, ...) has to reach. k is how many levels after the first it is.
export function targets(n) {
  const k = n - 1;
  return {
    minLength: Math.round(160 * 1.12 ** k), // tiles wide: 160, 179, 201, ... 444 at level 10
    minDanger: 7.5 + 1.0 * k, // enemy weight per 100 tiles (a bouncer is 1, a head of security 2.5)
    minPits: 1.25 + 0.25 * k, // pits per 100 tiles
    minWidestPit: Math.min(2 + Math.floor(k / 3), MAX_PIT), // at least one pit this wide (tiles)
    maxWidestPit: Math.min(2 + Math.floor(k / 2), MAX_PIT), // and none wider
    maxDucks: 21 - 1.2 * k, // rubber ducks lying around per 100 tiles: fewer shots later on
    burgers: k < 5 ? [1, 1] : [0, 1], // burger blocks [min, max]: levels 6+ may have none
    maxTime: 300 + 20 * k, // seconds on the clock: more time, but less per tile
    minBossHits: 3 + Math.floor(k / 3),
    minBossSpeed: 1 + 0.05 * k,
  };
}

// Counts what's in a GAMEPLAY file.
export function measure(gameplay) {
  const { rows } = gameplay;
  const length = Math.max(...rows.map((r) => r.length));
  const per100 = (count) => (count / length) * 100;
  let danger = 0;
  let ducks = 0;
  let burgers = 0;
  for (const row of rows) {
    for (const ch of row) {
      danger += LEGEND[ch]?.danger ?? 0;
      if (ch === DUCK) ducks += 1;
      if (ch === BURGER) burgers += 1;
    }
  }
  // Pits: gaps in the bottom row of ground.
  const ground = rows[rows.length - 1].padEnd(length, ' ');
  const pits = [];
  let gap = 0;
  for (const ch of ground + '#') {
    if (ch === '#') {
      if (gap) pits.push(gap);
      gap = 0;
    } else gap += 1;
  }
  const m = {
    length,
    danger: per100(danger),
    pits: per100(pits.length),
    widestPit: Math.max(0, ...pits),
    ducks: per100(ducks),
    burgers,
    time: gameplay.time,
    bossHits: gameplay.boss?.hits ?? 0,
    bossSpeed: gameplay.boss?.speed ?? 0,
  };
  m.score = score(m);
  return m;
}

// One number for "how hard": each level's must be higher than the level before.
export function score(m) {
  return (
    m.danger +
    2 * m.pits +
    2 * m.widestPit +
    3 * m.bossHits +
    20 * (m.bossSpeed - 1) -
    0.3 * m.ducks -
    2 * m.burgers -
    (m.time / m.length) // seconds per tile: less is harder
  );
}

// Everything level n's gameplay does wrong, as sentences ([] = it fits the curve).
export function problems(n, gameplay, previous) {
  const t = targets(n);
  const m = measure(gameplay);
  const out = [];
  const fix = (v) => Math.round(v * 100) / 100;
  if (m.length < t.minLength) out.push(`is ${m.length} tiles long, needs at least ${t.minLength}`);
  if (m.danger < t.minDanger) out.push(`enemy weight ${fix(m.danger)} per 100 tiles, needs at least ${t.minDanger}`);
  if (m.pits < t.minPits) out.push(`${fix(m.pits)} pits per 100 tiles, needs at least ${t.minPits}`);
  if (m.widestPit < t.minWidestPit) out.push(`widest pit is ${m.widestPit}, needs one at least ${t.minWidestPit} wide`);
  if (m.widestPit > t.maxWidestPit) out.push(`widest pit is ${m.widestPit}, at most ${t.maxWidestPit} allowed`);
  if (m.ducks > t.maxDucks) out.push(`${fix(m.ducks)} ducks per 100 tiles, at most ${fix(t.maxDucks)}`);
  if (m.burgers < t.burgers[0] || m.burgers > t.burgers[1]) out.push(`${m.burgers} burger blocks, needs ${t.burgers.join(' to ')}`);
  if (!(m.time <= t.maxTime)) out.push(`clock is ${m.time}s, at most ${t.maxTime}s`);
  if (m.bossHits < t.minBossHits) out.push(`boss takes ${m.bossHits} hits, needs at least ${t.minBossHits}`);
  if (m.bossSpeed < t.minBossSpeed - 1e-9) out.push(`boss speed ${m.bossSpeed}, needs at least ${fix(t.minBossSpeed)}`);
  if (previous) {
    const p = measure(previous);
    if (m.length <= p.length) out.push(`must be longer than level ${n - 1} (${p.length} tiles)`);
    if (m.score <= p.score) out.push(`must be harder than level ${n - 1} (score ${fix(m.score)} vs ${fix(p.score)})`);
  }
  return out;
}
