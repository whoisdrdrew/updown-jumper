// The levels in play order. Each level is a GAMEPLAY file (src/levels/gameplay/: blocks, enemies,
// pits, boss tuning, clock) that names its WORLD (src/levels/worlds/: backdrop, palette, decor).
// The two are kept apart on purpose: tuning gameplay never touches a world.
// New levels: docs/BATCH_LEVELS.md. `npm run check-levels` checks they get longer and harder.
import { WORLDS } from './worlds/index.js';
import level01 from './gameplay/01-solomun.js';
import level02 from './gameplay/02-miss-monique.js';
import level03 from './gameplay/03-marshmello.js';
import level04 from './gameplay/04-dom-dolla.js';
import level05 from './gameplay/05-steve-aoki.js';
import level06 from './gameplay/06-john-summit.js';
import level07 from './gameplay/07-charlotte-de-witte.js';
import level08 from './gameplay/08-fisher.js';
import level09 from './gameplay/09-james-hype.js';
import level10 from './gameplay/10-carl-cox.js';

export const LEVELS = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10];

// Level n's gameplay and world, or null if it isn't built yet.
export function levelData(n) {
  const gameplay = LEVELS.find((l) => l.level === n);
  if (!gameplay) return null;
  return { gameplay, world: WORLDS[gameplay.world] };
}

export const BUILT_LEVELS = new Set(LEVELS.map((l) => l.level));
