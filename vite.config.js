import { defineConfig } from 'vite';

// Relative base so the built game works from any folder (GitHub Pages, an iframe, any web host).
export default defineConfig({
  base: './',
  server: { host: true },
  // Phaser itself is ~1.2 MB. Sprite pictures are small, so they're built into the script.
  build: { chunkSizeWarningLimit: 2000, assetsInlineLimit: 16384 },
});
