import Phaser from 'phaser';
import exitButton from '../art/exit-button.png';

const SCALE = 0.5; // drawn at the hero's pixel size, like the intro's SKIP button
export const EXIT_BUTTON_WIDTH = 26; // world pixels

export function preloadExitButton(scene) {
  scene.load.image('exit-button', exitButton);
}

// EXIT, top left of the screen: back to the studio (the home screen). Esc does the same.
// The tap area is a little bigger than the button, for thumbs.
// scale 1 in the scenes that aren't zoomed (the Afterparty).
export function addExitButton(scene, exit, scale = SCALE) {
  const { x: ux, y: uy } = scene.ui;
  const pad = (3 * scale) / SCALE;
  const button = scene.add.image(ux + pad, uy + pad, 'exit-button').setOrigin(0).setScale(scale).setScrollFactor(0).setDepth(25)
    .setInteractive({ hitArea: new Phaser.Geom.Rectangle(-6, -6, 64, 30), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    button.setTint(0xffe680);
    scene.cameras.main.fadeOut(200, 18, 8, 28);
    scene.cameras.main.once('camerafadeoutcomplete', exit);
  };
  button.on('pointerdown', (_p, _x, _y, event) => {
    event?.stopPropagation();
    go();
  });
  scene.input.keyboard.on('keydown-ESC', go);
  return button;
}
