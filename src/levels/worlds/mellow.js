// WORLD: MELLOW, marshmello's world: a white marshmallow world: wooden sticks, campfires, a soft white land under a moonlit sky (Sandro's notes; no world pictures).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/mellow/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'mellow',
  name: 'MELLOW', // top bar
  dj: 'marshmello',
  background: 'layers', // builder in src/art/background.js
  art: 'mellow', // src/art/world/mellow/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: 'embers', // drawn on top of the backdrop, see EFFECTS in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: lilac night sky with stars and a crescent moon (fixed)',
    'far: hills of giant marshmallows (0.05)',
    'mid: marshmallows on long wooden sticks, toasted on one side (0.15)',
    'near: campfires with logs and stones (0.35)',
    'effect: embers drifting up from the fires',
  ],
  motifs: ['marshmallows as soft round platforms', 'wooden sticks as thin poles', 'fire (boss: burning marshmallows)'],
};
