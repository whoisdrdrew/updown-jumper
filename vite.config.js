import { defineConfig } from 'vite';

// Relative base so the built game works from any folder (GitHub Pages, an iframe, any web host).
export default defineConfig({
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 }, // Phaser itself is ~1.2 MB
});
