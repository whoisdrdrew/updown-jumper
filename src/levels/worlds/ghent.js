// WORLD: GHENT, charlotte-de-witte's world: Ghent at night: the ink-blue canal with amber reflections, the stepped gables of the Graslei as a rooftop route, then Gravensteen castle (levels-input/charlotte-de-witte/world 01, 03, 05, 06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/ghent/), shrunk into
// src/art/world/ghent/ with `python3 tools/hf_world.py <dir> ghent far=0.6,0.6,0.62 mid=0.5,0.75,0.5
// near=0.7,0.765,0.5 repeat=mid:2 seam=mid:mirror dim=near:0.9`; the 'layers' builder in src/art/background.js puts them together.
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
    'sky: ink-blue night sky with faint stars over black water with amber and teal shimmer (fixed)',
    'far: Gravensteen castle floodlit teal and orange, one red light on the keep (0.05)',
    "mid: the Graslei's stepped gables with amber windows, reflected in the canal (0.15)",
    'near: iron street lamps and mooring posts (0.35)',
  ],
  motifs: ['stepped gables as a rooftop route (stairs up and down)', 'drop to street level at the castle', 'the narrow stone gate before the arena', 'a red light pulsing behind her (boss)'],
};
