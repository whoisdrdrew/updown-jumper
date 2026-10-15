// The level tileset, drawn in code: warm stone bricks with a gold rim, like the club reference.
// Order must match T in objects/Blocks.js: grass(top), block, platform, dirt(fill), note, used, brick.
const C = {
  stone: '#8a6a50',
  stoneLight: '#b08a64',
  stoneDark: '#5e4434',
  mortar: '#3a261c',
  gold: '#f2c230',
  goldLight: '#ffe680',
  goldDark: '#b07a10',
  outline: '#150b22',
  brick: '#b8642a',
  brickLight: '#e08a50',
  brickDark: '#5a2a10',
  used: '#6a5048',
};

export function createTiles(scene) {
  if (scene.textures.exists('tiles')) return;
  const tex = scene.textures.createCanvas('tiles', 112, 16);
  const ctx = tex.getContext();
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  // Stone bricks in two staggered rows, from row y0 down to the bottom of the tile.
  const stoneWall = (ox, y0) => {
    rect(ox, y0, 16, 16 - y0, C.stone);
    for (let y = y0; y < 16; y += 8) {
      const shift = ((y - y0) / 8) % 2 ? 4 : 0;
      rect(ox, y, 16, 1, C.mortar);
      for (let x = -shift; x < 16; x += 8) {
        const left = Math.max(ox, ox + x);
        rect(left, y + 1, Math.min(7, ox + x + 7 - left), 1, C.stoneLight);
        if (x + 7 >= 0 && x + 7 < 16) rect(ox + x + 7, y + 1, 1, 7, C.mortar);
      }
      rect(ox, Math.min(y + 7, 15), 16, 1, C.stoneDark);
    }
  };
  const goldRim = (ox, h) => {
    rect(ox, 0, 16, h, C.gold);
    rect(ox, 0, 16, 1, C.goldLight);
    rect(ox, h - 1, 16, 1, C.goldDark);
    for (let x = 2; x < 16; x += 6) rect(ox + x, 1, 2, 1, C.goldLight);
  };

  // 0 ground top: stone with a gold rim
  stoneWall(0, 0);
  goldRim(0, 4);
  // 1 solid block: bevelled stone
  rect(16, 0, 16, 16, C.outline);
  rect(17, 1, 14, 14, C.stone);
  rect(17, 1, 14, 2, C.stoneLight);
  rect(17, 1, 2, 14, C.stoneLight);
  rect(17, 13, 14, 2, C.stoneDark);
  rect(29, 1, 2, 14, C.stoneDark);
  rect(22, 6, 4, 4, C.stoneDark);
  // 2 thin platform: gold-rimmed stone ledge
  goldRim(32, 3);
  rect(32, 3, 16, 3, C.stone);
  rect(32, 6, 16, 1, C.mortar);
  // 3 ground fill: stone wall
  stoneWall(48, 0);
  // 4 music-note block (our "?" block)
  rect(64, 0, 16, 16, C.outline);
  rect(65, 1, 14, 14, C.gold);
  rect(65, 1, 14, 1, C.goldLight);
  rect(65, 1, 1, 14, C.goldLight);
  rect(65, 14, 14, 1, C.goldDark);
  rect(78, 1, 1, 14, C.goldDark);
  rect(72, 3, 1, 8, C.outline); // eighth note
  rect(73, 3, 3, 1, C.outline);
  rect(75, 4, 1, 2, C.outline);
  rect(69, 10, 4, 3, C.outline);
  // 5 used (empty) block
  rect(80, 0, 16, 16, C.outline);
  rect(81, 1, 14, 14, C.used);
  for (const [x, y] of [[83, 3], [92, 3], [83, 12], [92, 12]]) rect(x, y, 1, 1, C.outline);
  // 6 breakable brick
  rect(96, 0, 16, 16, C.brick);
  rect(96, 0, 16, 1, C.brickLight);
  rect(96, 7, 16, 1, C.brickDark);
  rect(96, 15, 16, 1, C.brickDark);
  rect(103, 0, 1, 7, C.brickDark);
  rect(99, 8, 1, 7, C.brickDark);
  rect(107, 8, 1, 7, C.brickDark);
  tex.refresh();
}
