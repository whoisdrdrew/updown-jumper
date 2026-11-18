// WORLD: LIVERPOOL, james-hype's world: Liverpool at dusk: the Royal Liver Building with its clocks, Bold Street shopfronts, Probe Records' blue door, Concert Square (levels-input/james-hype/world 02-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/liverpool/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'liverpool',
  name: 'LIVERPOOL', // top bar
  dj: 'james-hype',
  background: 'layers', // builder in src/art/background.js
  art: 'liverpool', // src/art/world/liverpool/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: null,
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: dusk (fixed)',
    'far: the Royal Liver Building, clock towers and Liver Birds (0.05)',
    'mid: brick shopfronts on Bold Street with the blue door of Probe Records (0.15)',
    'near: street lamps and bunting over Concert Square (0.35)',
  ],
  motifs: ['shop awnings and window ledges as platforms', 'rooftops', 'sound waves (boss)'],
};
