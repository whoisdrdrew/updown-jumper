// WORLD: SNAPPER, fisher's world: Snapper Rocks on the Gold Coast: the rock shelf, breaking waves, the patrol tower, dolphins and the skyline across the bay (levels-input/fisher/world 02-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/snapper/), shrunk into
// src/art/world/snapper/ with `python3 tools/hf_world.py <dir> snapper far=0.9,0.415,0.5 mid=1,0.7,0.5
// near=0.8,0.775,0.5 seam=mid:edge dim=near:0.9`; the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'snapper',
  name: 'SNAPPER', // top bar
  dj: 'fisher',
  background: 'layers', // builder in src/art/background.js
  art: 'snapper', // src/art/world/snapper/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  // The wave moves (Sandro, 2026-11-21): the mid picture is cut into the big breaking wave and the
  // front line of foam, which swell up and down out of step, the wave sways and the foam rolls along.
  // rows: picture rows of 2-mid.png; swell/sway in screen pixels, drift in pixels per second.
  motion: {
    2: [
      { rows: [140, 216], swell: 3, period: 3.6, sway: 6, swayPeriod: 7 },
      { rows: [216, 252], swell: 2, period: 2.8, phase: 0.4, drift: 6 },
    ],
  },
  effect: 'glints', // sun glinting on the sea, see EFFECTS in src/art/background.js
  effectArea: [74, 132], // the sea, in screen pixels
  effectUnder: 3, // under the tower and the rocks
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: bright midday sky and the open turquoise sea (fixed; its own palette, no dusk)',
    'far: the Gold Coast skyline and a green headland on the horizon (0.05)',
    'mid: a big breaking turquoise wave with two dolphins and tiny surfers (0.15)',
    'near: the yellow patrol tower with a palm and surfboards on sand, and the dark rock shelf (0.35)',
    'motion: the wave swells and sways, the foam rolls along, the sun glints on the water',
  ],
  motifs: ['rock shelf: uneven low steps', 'wide water gaps (pits)', 'the fishing rod (boss)'],
};
