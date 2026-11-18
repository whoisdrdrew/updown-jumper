// WORLD: BAKERY, steve-aoki's world: the cake factory: bakery racks, a cake production line, conveyor belts and robot arms (levels-input/steve-aoki/world 01-05).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/bakery/), shrunk into
// src/art/world/bakery/ with `python3 tools/hf_world.py <dir> bakery far=0.65,0.6,0.5 mid=1,0.745,0.5
// near=1,0.8,0.5 seam=mid:mirror dim=near:0.85`; the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'bakery',
  name: 'BAKERY', // top bar
  dj: 'steve-aoki',
  background: 'layers', // builder in src/art/background.js
  art: 'bakery', // src/art/world/bakery/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: null,
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: a bright, clean factory hall by day: white and mint tiles, big windows, steel ducts and lamps (fixed; Sandro: no night or party colours here)',
    'far: a steel mixing tank, three racks of cakes and an oven (0.05)',
    'mid: a steel conveyor belt of cakes with two orange robot arms (0.15)',
    'near: bakers at steel work tables with bowls and cakes; no crowd (0.35)',
  ],
  motifs: ['conveyor belts as long platforms', 'stacked trays as stairs', 'cakes (boss)'],
};
