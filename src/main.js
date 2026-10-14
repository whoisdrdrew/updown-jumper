import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from './config.js';
import GameScene from './scenes/GameScene.js';

function startGame() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#24123e',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: PHYSICS.gravity }, debug: false },
    },
    scene: [GameScene],
  });

  // Handy for debugging from the browser console.
  window.__game = game;
}

// Wait briefly for the pixel font so the HUD uses it from the first frame; fall back to monospace.
const fontLoaded = document.fonts ? document.fonts.load('8px "Press Start 2P"').catch(() => {}) : Promise.resolve();
Promise.race([fontLoaded, new Promise((resolve) => setTimeout(resolve, 2000))]).then(startGame);
