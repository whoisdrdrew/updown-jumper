// WORLD: VAIL, john-summit's world: Vail ski mountain: the downhill run, the gondola through green pines, golden sky over layered ridgelines (levels-input/john-summit/world 01, 02, 04, 05).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/vail/), shrunk into
// src/art/world/vail/ with `python3 tools/hf_world.py <dir> vail far=1,0.56,0.5 mid=1,0.72,0.5
// near=0.5,0.765,0.5 repeat=near:2 seam=far:mirror seam=mid:mirror seam=near:mirror dim=near:0.85`;
// the 'layers' builder in src/art/background.js puts them together.
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
    'sky: clear blue winter sky with the sun and small clouds (fixed; its own palette, no dusk)',
    'far: jagged snowy peaks and blue ridgelines (0.05)',
    'mid: pine forest, a ski run with tiny skiers and the gondola with red cabins (0.15)',
    'near: groups of snowy pines on snow banks (0.35)',
    'effect: falling snow',
  ],
  motifs: ['gondola cabins as floating platforms', 'slopes: long runs downhill', 'snowballs (boss)'],
};
