import Phaser from 'phaser';

// Keyboard mapping in one place, so touch or gamepad controls can plug in later.
export default class Controls {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard;
    const keys = (...codes) => codes.map((code) => kb.addKey(code));
    this.leftKeys = keys(K.LEFT, K.A);
    this.rightKeys = keys(K.RIGHT, K.D);
    this.jumpKeys = keys(K.SPACE, K.Z, K.UP, K.W);
    this.runKeys = keys(K.SHIFT, K.X);
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
  }

  left() { return this.leftKeys.some((k) => k.isDown); }
  right() { return this.rightKeys.some((k) => k.isDown); }
  jump() { return this.jumpKeys.some((k) => k.isDown); }
  run() { return this.runKeys.some((k) => k.isDown); }
  jumpJustPressed() { return this.jumpKeys.some((k) => Phaser.Input.Keyboard.JustDown(k)); }
}
