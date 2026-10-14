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
