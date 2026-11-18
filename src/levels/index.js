// The levels in play order. Each level is a GAMEPLAY file (src/levels/gameplay/: blocks, enemies,
// pits, boss tuning, clock) that names its WORLD (src/levels/worlds/: backdrop, palette, decor).
// The two are kept apart on purpose: tuning gameplay never touches a world.
// New levels: docs/BATCH_LEVELS.md. `npm run check-levels` checks they get longer and harder.
import { WORLDS } from './worlds/index.js';
import level01 from './gameplay/01-solomun.js';

export const LEVELS = [level01];

// Level n's gameplay and world, or null if it isn't built yet.
export function levelData(n) {
  const gameplay = LEVELS.find((l) => l.level === n);
  if (!gameplay) return null;
  return { gameplay, world: WORLDS[gameplay.world] };
}

export const BUILT_LEVELS = new Set(LEVELS.map((l) => l.level));
