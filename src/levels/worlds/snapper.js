// WORLD: SNAPPER, fisher's world: Snapper Rocks on the Gold Coast: the rock shelf, breaking waves, the patrol tower, dolphins and the skyline across the bay (levels-input/fisher/world 02-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/snapper/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'snapper',
  name: 'SNAPPER', // top bar
  dj: 'fisher',
  background: 'layers', // builder in src/art/background.js
  art: 'snapper', // src/art/world/snapper/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: null,
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: afternoon sky over the sea (fixed)',
    'far: the Gold Coast skyline across the bay (0.05)',
    'mid: breaking wave, dolphins, the patrol tower on the beach (0.15)',
    'near: the dark wet rock shelf (0.35)',
  ],
  motifs: ['rock shelf: uneven low steps', 'wide water gaps (pits)', 'the fishing rod (boss)'],
};
