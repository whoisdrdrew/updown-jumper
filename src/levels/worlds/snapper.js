// WORLD: SNAPPER, fisher's world: Snapper Rocks on the Gold Coast: the rock shelf, breaking waves, the patrol tower, dolphins and the skyline across the bay (levels-input/fisher/world 02-06).
// Looks only. Gameplay files (src/levels/gameplay/) name this world but never change it.
// Art: made in Higgsfield (pictures in project files art/worlds/snapper/), shrunk into
// src/art/world/snapper/ with (2-mid.png is now wave-0 from tools/hf_wave.py) `python3 tools/hf_world.py <dir> snapper far=0.9,0.415,0.5 mid=1,0.7,0.5
// near=0.8,0.775,0.5 seam=mid:edge dim=near:0.9`; the 'layers' builder in src/art/background.js puts them together.
export default {
  id: 'snapper',
  name: 'SNAPPER', // top bar
  dj: 'fisher',
  background: 'layers', // builder in src/art/background.js
  art: 'snapper', // src/art/world/snapper/0-sky.png .. 3-near.png
  parallax: [0, 0.05, 0.15, 0.35], // how fast each layer scrolls with the camera
  // The sea moves (Sandro, 2026-11-21): the big wave builds, curls, crashes and settles again, and
  // dolphins jump out of the water and dive back in. Higgsfield sprite sheets, cut by
  // `python3 tools/hf_wave.py <wave-sheet> <dolphin-sheet>` (project files art/worlds/snapper/motion/).
  animate: { layer: 2, frames: 'wave', ms: [1600, 450, 400, 550, 500, 750] }, // calm, rises, curls, barrels, crashes, settles
  jumpers: { layer: 2, frames: 'dolphin', count: 8, frameMs: 120, every: [2500, 5500], waterY: 114, drift: 3 },
  effect: null,
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black',
  layers: [
    'sky: bright midday sky and the open turquoise sea (fixed; its own palette, no dusk)',
    'far: the Gold Coast skyline and a green headland on the horizon (0.05)',
    'mid: a big turquoise wave that builds, breaks and reforms (6 frames), dolphins jumping in front of it (0.15)',
    'near: the yellow patrol tower with a palm and surfboards on sand, and the dark rock shelf (0.35)',
  ],
  motifs: ['rock shelf: uneven low steps', 'wide water gaps (pits)', 'the fishing rod (boss)'],
};
