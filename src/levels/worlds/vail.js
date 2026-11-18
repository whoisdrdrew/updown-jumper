// WORLD: VAIL, john-summit's world: Vail ski mountain: the downhill run, the gondola through green pines, golden sky over layered ridgelines (levels-input/john-summit/world 01, 02, 04, 05).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/vail/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'vail',
  name: 'VAIL', // top bar
  dj: 'john-summit',
  background: 'layers', // builder in src/art/background.js
  art: 'vail', // src/art/world/vail/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: 'snow', // drawn on top of the backdrop, see EFFECTS in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: golden mountain sky (fixed)',
    'far: layered ridgelines with snow (0.05)',
    'mid: the ski run, pines and the gondola with red cabins (0.15)',
    'near: big snowy pines and a skier (0.35)',
    'effect: falling snow',
  ],
  motifs: ['gondola cabins as floating platforms', 'slopes: long runs downhill', 'snowballs (boss)'],
};
