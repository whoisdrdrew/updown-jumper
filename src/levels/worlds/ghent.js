// WORLD: GHENT, charlotte-de-witte's world: Ghent at night: the ink-blue canal with amber reflections, the stepped gables of the Graslei as a rooftop route, then Gravensteen castle (levels-input/charlotte-de-witte/world 01, 03, 05, 06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: tools/world_djs.py draws the four layers into src/art/world/ghent/ (a first pass, made to be
// redrawn); the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'ghent',
  name: 'GHENT', // top bar
  dj: 'charlotte-de-witte',
  background: 'layers', // builder in src/art/background.js
  art: 'ghent', // src/art/world/ghent/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  effect: null,
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: night sky over the ink-blue canal (fixed)',
    'far: Gravensteen castle towers, lit from below (0.05)',
    "mid: the Graslei's stepped gables, amber windows reflected in the water (0.15)",
    'near: the canal wall, street lamps and mooring posts (0.35)',
  ],
  motifs: ['stepped gables as a rooftop route (stairs up and down)', 'drop to street level at the castle', 'the narrow stone gate before the arena', 'a red light pulsing behind her (boss)'],
};
