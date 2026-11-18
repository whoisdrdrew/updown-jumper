// The letters a GAMEPLAY file's rows are drawn with. One character = one 16x16 tile.
// GameScene.buildLevel turns them into the level; difficulty.js counts them to rate a level.
// danger: how much a thing counts towards a level's difficulty (a bouncer is 1).
// A new enemy or hazard gets a letter here first, then code in GameScene.buildLevel.
export const LEGEND = {
  '#': { what: 'ground (bottom three rows; a gap in them is a pit)' },
  B: { what: 'solid block' },
  '=': { what: 'thin platform: jump up through it, land on top' },
  b: { what: 'breakable brick' },
  N: { what: 'music-note block with a rubber duck' },
  H: { what: 'music-note block with the burger box (power-up)' },
  Y: { what: 'music-note block with the duck egg (ride-on duck)' },
  P: { what: 'player start' },
  S: { what: 'suitcase with the mask (jump on it)' },
  F: { what: 'goal flag' },
  K: { what: 'end boss; the arena is one screen wide around it' },
  V: { what: 'VIP door to the duck bonus room' },
  E: { what: 'duck egg lying in the level' },
  o: { what: 'rubber duck to collect (one shot each)' },
  G: { what: 'security bouncer: paces, shoves', danger: 1 },
  C: { what: 'head of security: spots, charges, punches, two stomps', danger: 2.5 },
};

export const DUCK = 'o';
export const BURGER = 'H';
