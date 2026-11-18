// The end bosses, by id. A boss is its own design, separate from the same DJ's playable look
// (src/art/<dj>/playable/). Every boss class works like Boss.js (Solomun): constructor(scene,
// arena, tuning), .takeHit(), .hurtable, .mode ('defeated' when beaten), .standForPhoto(x, y, flip)
// for Felix's winner photo, and the events 'hit' (hitsLeft) and 'defeated'.
// name: the banner when the fight starts; portrait: texture next to his hearts on the top bar.
import Boss from '../objects/Boss.js';

export const BOSSES = {
  solomun: { name: 'SOLOMUN', portrait: 'solomun-portrait', create: (scene, arena, tuning) => new Boss(scene, arena, tuning) },
};
