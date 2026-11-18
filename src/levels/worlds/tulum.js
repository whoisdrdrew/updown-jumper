// WORLD: Tulum, Solomun's world (level 1). Everything you look at but don't play on: the backdrop,
// its colours and decor, and the name on the top bar. The GAMEPLAY files (src/levels/gameplay/)
// name a world and may take ideas from `motifs`, but tuning gameplay never edits this file.
// Art: tools/world_solomun.py draws the layers into src/art/world/solomun/; the backdrop is put
// together in src/art/background.js under the `background` key.
export default {
  id: 'tulum',
  name: 'TULUM', // top bar: "TULUM WORLD 1-1"
  dj: 'solomun', // whose world it is (the level's boss)
  background: 'tulum', // builder in src/art/background.js
  tiles: 'tiles', // tileset (src/art/world/tiles.png, shared for now)
  pit: 'black', // pits are plain black gaps, like Mario 3
  palette: {
    // the colour rows in tools/world_solomun.py, darkest first
    thatch: ['#1a0c10', '#2c1612', '#432216', '#5e331c', '#7e4822', '#a4642a'],
    wood: ['#2a140e', '#4e2a16', '#7a4a24', '#a8723a'],
    lamp: ['#7a2a0e', '#b8501a', '#e0801e', '#f5b04a', '#ffe08a', '#fff4cc'],
  },
  layers: [
    'roof: inside of the thatched beach-hut roof, rafters, far lamps (scrolls 0.15)',
    'lamps: big wicker lamps hanging close, flickering warm glow (scrolls 0.25)',
    'crowd: the dancing crowd under the SOLO ROOM sign, holds still (scrolls 0.4)',
  ],
  // Ideas the world gives the gameplay (a list to pick from, not rules): what fits this place.
  motifs: ['wooden beach-hut beams as thin platforms', 'low roof: short, flat jumps', 'sauna steam (boss)'],
};
