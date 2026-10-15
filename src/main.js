import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ZOOM, PHYSICS } from './config.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import BonusScene from './scenes/BonusScene.js';
import { setupTouchControls, touch } from './touch/TouchControls.js';

function startGame() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH * ZOOM,
    height: GAME_HEIGHT * ZOOM,
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
    scene: [IntroScene, GameScene, BonusScene], // the story intro first, then level 1; the bonus room behind the VIP door
  });

  // Handy for debugging from the browser console.
  window.__game = game;
}

// Phones get on-screen controls over the game; set up before the game starts so it is sized to
// the whole screen.
setupTouchControls(() => window.__game);

// Wait briefly for the pixel font so the HUD uses it from the first frame; fall back to monospace.
const fontLoaded = document.fonts ? document.fonts.load('8px "Press Start 2P"').catch(() => {}) : Promise.resolve();
Promise.race([fontLoaded, new Promise((resolve) => setTimeout(resolve, 2000))]).then(() => {
  startGame();
  window.__game.events.once('ready', () => touch.applyOrientation?.());
});
