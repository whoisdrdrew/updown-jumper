// WORLD: IBIZA, miss-monique's world: Ibiza at sunset, for Miss Monique's famous Ibiza set (no world pictures in Drive, so taken from her set screenshots and the existing IBIZA club look).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/ibiza/), shrunk into
// src/art/world/ibiza/ with `python3 tools/hf_world.py <dir> ibiza far=0.55,0.415,0.15 mid=0.7,0.5,0.73 dim=near:0.7 drop=near:40:240`;
// the 'layers' builder in src/art/background.js puts them together.
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
    'far: Es Vedra, the rock island off Ibiza, on the left (0.05)',
    'mid: Dalt Vila, the old town and cathedral on its hill, lit pink by the sunset (0.15)',
    'near: palm trees and the crowd with hands up (0.35)',
    'effect: coloured light beams sweeping from the stage',
  ],
  motifs: ['white cube houses as stepped platforms', 'stage risers and speaker stacks', 'vinyl records (boss)'],
};
