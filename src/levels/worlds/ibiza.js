// WORLD: IBIZA, miss-monique's world: Ibiza at sunset, for Miss Monique's famous Ibiza set (no world pictures in Drive, so taken from her set screenshots and the existing IBIZA club look).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/ibiza/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'ibiza',
  name: 'IBIZA', // top bar
  dj: 'miss-monique',
  background: 'layers', // builder in src/art/background.js
  art: 'ibiza', // src/art/world/ibiza/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: 'beams', // drawn on top of the backdrop, see EFFECTS in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: sunset over the sea, the low sun and its glitter on the water (fixed)',
    'far: Es Vedra, the rock island off Ibiza (0.05)',
    'mid: the white town on the hill, lit pink by the sunset (0.15)',
    'near: palm trees and the crowd with hands up (0.35)',
    'effect: coloured light beams sweeping from the stage',
  ],
  motifs: ['white cube houses as stepped platforms', 'stage risers and speaker stacks', 'vinyl records (boss)'],
};
