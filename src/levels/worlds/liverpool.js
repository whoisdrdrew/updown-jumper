// WORLD: LIVERPOOL, james-hype's world: Liverpool on a cloudy afternoon: the Royal Liver Building with its clocks, Bold Street shopfronts, Probe Records' blue door, Concert Square (levels-input/james-hype/world 02-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/liverpool/), shrunk into
// src/art/world/liverpool/ with `python3 tools/hf_world.py <dir> liverpool far=0.6,0.56,0.5 mid=0.5,0.75,0.5
// near=0.55,0.765,0.5 repeat=mid:2 dim=near:0.9`; the 'layers' builder in src/art/background.js puts them together.
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
    'sky: grey-blue cloudy British sky (fixed; its own palette, no dusk)',
    'far: the Royal Liver Building with lit clocks and Liver Birds, city towers (0.05)',
    'mid: Bold Street brick shopfronts with string lights, the blue door of Probe Records, a graffiti club wall (0.15)',
    'near: street lamps, a red phone box and a tree in a planter (0.35)',
  ],
  motifs: ['shop awnings and window ledges as platforms', 'rooftops', 'sound waves (boss)'],
};
