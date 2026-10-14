import Phaser from 'phaser';

// Keyboard mapping in one place, so touch or gamepad controls can plug in later.
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
    this.jumpKey.on('down', () => { this.jumpQueued = true; });
    this.actionKey.on('down', () => { this.shootQueued = true; });
  }

  left() { return this.leftKey.isDown; }
  right() { return this.rightKey.isDown; }
  down() { return this.downKey.isDown; }
  jump() { return this.jumpKey.isDown; }
  jumpJustPressed() { return this.consume('jumpQueued'); }
  run() { return this.actionKey.isDown; }
  shootJustPressed() { return this.consume('shootQueued'); }

  consume(flag) {
    const pressed = this[flag];
    this[flag] = false;
    return pressed;
  }
}
