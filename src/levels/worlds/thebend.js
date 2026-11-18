// WORLD: THE BEND, carl-cox's world: an Australian drag strip at dusk (The Bend): open pit garages, tyre stacks, red dirt and a starting-light tower (levels-input/carl-cox/world 01-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/thebend/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'thebend',
  name: 'THE BEND', // top bar
  dj: 'carl-cox',
  background: 'layers', // builder in src/art/background.js
  art: 'thebend', // src/art/world/thebend/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: 'embers', // drawn on top of the backdrop, see EFFECTS in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: outback dusk over red dirt (fixed)',
    'far: low hills and the grandstand (0.05)',
    'mid: open pit garages, the starting-light tower, the striped barrier (0.15)',
    'near: stacks of tyres (0.35)',
    'effect: sparks in the air',
  ],
  motifs: ['tyre stacks as small steps', 'the long flat strip before the arena', "the starting lights and the red '32 roadster (boss)"],
};
