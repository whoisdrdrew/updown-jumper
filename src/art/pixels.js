// Turns a small text drawing into a texture. Each character is one pixel, looked up in the palette;
// '.' (or any character not in the palette) is transparent. Rows shorter than the widest are padded.
export function pixelTexture(scene, key, rows, palette) {
  if (scene.textures.exists(key)) return;
  const w = Math.max(...rows.map((r) => r.length));
  const canvas = scene.textures.createCanvas(key, w, rows.length);
  const ctx = canvas.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  canvas.refresh();
}

// Stacks several drawings into one (later ones on top), each at its own offset.
export function compose(width, height, layers) {
  const grid = Array.from({ length: height }, () => Array(width).fill('.'));
  for (const { rows, x: ox = 0, y: oy = 0 } of layers) {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const gx = ox + x;
        const gy = oy + y;
        if (ch !== '.' && gx >= 0 && gx < width && gy >= 0 && gy < height) grid[gy][gx] = ch;
      }),
    );
  }
  return grid.map((r) => r.join(''));
}
