// WORLD: SAN FRANDISCO, dom-dolla's world: San Francisco at dusk, named after his song "San Frandisco": Hyde Street, the Painted Ladies and the Golden Gate (levels-input/dom-dolla/world 01-03).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/sanfrandisco/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'sanfrandisco',
  name: 'SAN FRANDISCO', // top bar
  dj: 'dom-dolla',
  background: 'layers', // builder in src/art/background.js
  art: 'sanfrandisco', // src/art/world/sanfrandisco/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: 'sparkles', // drawn on top of the backdrop, see EFFECTS in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: dusk over the bay (fixed)',
    'far: the Golden Gate Bridge and the Marin hills (0.06)',
    'mid: the Painted Ladies, pastel Victorian houses on a hill (0.16)',
    'near: Hyde Street cable car and rails, a disco ball hanging in the sky (0.35)',
    'effect: disco sparkles',
  ],
  motifs: ['steep hills: stairs of blocks up and down', 'cable-car rails as long flat runs', 'disco balls (boss)'],
};
