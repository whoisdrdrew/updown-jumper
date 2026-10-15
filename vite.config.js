import { defineConfig } from 'vite';

// Relative base so the built game works from any folder (GitHub Pages, an iframe, any web host).
export default defineConfig({
  base: './',
  server: { host: true },
  // Phaser itself is ~1.2 MB. All pictures (the biggest is the 48 KB hut roof) are built into the script,
  // so the game is a single file that works wherever it is hosted.
  build: { chunkSizeWarningLimit: 3000, assetsInlineLimit: 100000 },
});
