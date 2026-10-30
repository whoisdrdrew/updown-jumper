import Phaser from 'phaser';

// The studio menu's small pixel letters (3x5, like the name plates baked into the studio art), made
// into a Phaser bitmap font at runtime, one per colour: pixText(scene, x, y, 'TEXT', '#ffd34a', 2).
const GLYPHS = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '###|#..|#..|#..|###', D: '##.|#.#|#.#|#.#|##.',
  E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '###|#..|#.#|#.#|###', H: '#.#|#.#|###|#.#|#.#',
  I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|###', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
  M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '###|#.#|#.#|#.#|###', P: '##.|#.#|##.|#..|#..',
  Q: '###|#.#|#.#|###|..#', R: '##.|#.#|##.|#.#|#.#', S: '###|#..|###|..#|###', T: '###|.#.|.#.|.#.|.#.',
  U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
  Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
  0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '###|..#|###|#..|###', 3: '###|..#|.##|..#|###',
  4: '#.#|#.#|###|..#|..#', 5: '###|#..|###|..#|###', 6: '###|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
  8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|###',
  '/': '..#|..#|.#.|#..|#..', ':': '...|.#.|...|.#.|...', '.': '...|...|...|...|.#.', '-': '...|...|###|...|...',
  '!': '.#.|.#.|.#.|...|.#.', '?': '###|..#|.##|...|.#.', '#': '#.#|###|#.#|###|#.#', '<': '..#|.#.|#..|.#.|..#',
  '>': '#..|.#.|..#|.#.|#..', '+': '...|.#.|###|.#.|...', ',': '...|...|...|.#.|#..', "'": '.#.|.#.|...|...|...',
  '&': '.#.|#.#|.#.|#.#|.##', ' ': '...|...|...|...|...',
};
const CHARS = Object.keys(GLYPHS).join('');
const CELL_W = 4; // 3 px glyph and 1 px gap
const CELL_H = 5;
const PER_ROW = 16;

function fontKey(scene, color) {
  const key = `pix-${color.replace('#', '')}`;
  if (scene.cache.bitmapFont.exists(key)) return key;
  const rows = Math.ceil(CHARS.length / PER_ROW);
  const canvas = scene.textures.createCanvas(key, PER_ROW * CELL_W, rows * CELL_H);
  const ctx = canvas.getContext();
  ctx.fillStyle = color;
  [...CHARS].forEach((ch, i) => {
    const ox = (i % PER_ROW) * CELL_W;
    const oy = Math.floor(i / PER_ROW) * CELL_H;
    GLYPHS[ch].split('|').forEach((row, y) => {
      [...row].forEach((v, x) => v === '#' && ctx.fillRect(ox + x, oy + y, 1, 1));
    });
  });
  canvas.refresh();
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: key, width: CELL_W, height: CELL_H, chars: CHARS, charsPerRow: PER_ROW,
    spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, lineSpacing: 2,
  });
  scene.cache.bitmapFont.add(key, data);
  return key;
}

// Width in screen pixels of a line at this scale (the last letter's gap not counted).
export const pixWidth = (text, scale = 1) => (text.length * CELL_W - 1) * scale;

export function pixText(scene, x, y, text, color = '#ffffff', scale = 1) {
  return scene.add.bitmapText(x, y, fontKey(scene, color), String(text).toUpperCase()).setScale(scale);
}
