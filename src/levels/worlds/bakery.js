// WORLD: BAKERY, steve-aoki's world: the cake factory: bakery racks, a cake production line, conveyor belts and robot arms (levels-input/steve-aoki/world 01-05).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/bakery/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
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
    'sky: the factory hall, tall windows and roof trusses (fixed)',
    'far: racks of finished cakes on trolleys (0.06)',
    'mid: conveyor belts carrying cakes, orange robot arms (0.16)',
    'near: flour sacks and stacked trays (0.35)',
  ],
  motifs: ['conveyor belts as long platforms', 'stacked trays as stairs', 'cakes (boss)'],
};
