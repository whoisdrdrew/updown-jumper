import Phaser from 'phaser';
import { touch } from '../touch/TouchControls.js';

// Keyboard and on-screen touch controls in one place (touch/TouchControls.js on phones).
// Like the SNES Y button in Super Mario World, the action button shoots when tapped and runs when held.
export default class Controls {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard;
    this.leftKey = kb.addKey(K.LEFT);
    this.rightKey = kb.addKey(K.RIGHT);
    this.jumpKey = kb.addKey(K.UP);
    this.downKey = kb.addKey(K.DOWN);
    this.actionKey = kb.addKey(K.SPACE);
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);

    // Remember presses as events, so even a very quick tap between two frames is never lost.
    this.jumpQueued = false;
    this.shootQueued = false;
    this.downQueued = false;
    this.jumpKey.on('down', () => { this.jumpQueued = true; });
    this.downKey.on('down', () => { this.downQueued = true; });
    this.actionKey.on('down', () => { this.shootQueued = true; });
  }

  left() { return this.leftKey.isDown || touch.left; }
  right() { return this.rightKey.isDown || touch.right; }
  // Down (keyboard or the cross) goes through doors and presses the bonus room buttons.
  down() { return this.downKey.isDown || touch.down; }
  downJustPressed() { return this.consume('downQueued') | consumeTouch('downQueued'); }
  // The up arrow and the A button jump.
  jump() { return this.jumpKey.isDown || touch.jump; }
  jumpJustPressed() { return this.consume('jumpQueued') | consumeTouch('jumpQueued'); }
  run() { return this.actionKey.isDown || touch.action; }
  shootJustPressed() { return this.consume('shootQueued') | consumeTouch('shootQueued'); }

  consume(flag) {
    const pressed = this[flag];
    this[flag] = false;
    return pressed;
  }
}

function consumeTouch(flag) {
  const pressed = touch[flag];
  touch[flag] = false;
  return pressed;
}
