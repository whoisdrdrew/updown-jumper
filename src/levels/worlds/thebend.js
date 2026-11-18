// WORLD: THE BEND, carl-cox's world: an Australian drag strip at dusk (The Bend): open pit garages, tyre stacks, red dirt and a starting-light tower (levels-input/carl-cox/world 01-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/thebend/), shrunk into
// src/art/world/thebend/ with `python3 tools/hf_world.py <dir> thebend far=0.75,0.5,0.5 mid=1,0.665,0.45
// near=1,0.78,0.5 seam=near:mirror dim=near:0.9`; the 'layers' builder in src/art/background.js puts them together.
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
    'sky: burnt-orange outback dusk with a low sun over red dirt and scrub (fixed)',
    'far: the grandstand with a red and blue roof, a tiny crowd and floodlights (0.05)',
    'mid: open pit garages and the starting-light tower (0.15)',
    'near: tyre stacks behind the red and white striped barrier (0.35)',
    'effect: sparks in the air',
  ],
  motifs: ['tyre stacks as small steps', 'the long flat strip before the arena', "the starting lights and the red '32 roadster (boss)"],
};
