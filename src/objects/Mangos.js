import { ITEM_SCALE } from '../art/sprites.js';

// Mangos lying on the floor. Touching one makes the player slip. Shoot them away or jump over them.
export default class Mangos {
  constructor(scene, positions) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    for (const { x, y } of positions) {
      const mango = this.group.create(x, y - 5, 'mango').setScale(ITEM_SCALE);
      mango.body.setSize(20, 14); // picture pixels: 10x7 in the world
    }
  }

  // The player stepped on it: it gets squashed flat and disappears.
  squash(mango) {
    mango.body.enable = false;
    this.scene.tweens.add({
      targets: mango,
      scaleY: 0.2,
      scaleX: 1.5,
      y: mango.y + 3,
      alpha: 0,
      duration: 250,
      onComplete: () => mango.destroy(),
    });
  }

  // Hit by a rubber duck: it flies off spinning, like a knocked-out enemy in Mario.
  knockAway(mango, dir) {
    mango.body.enable = false;
    this.scene.tweens.add({
      targets: mango,
      x: mango.x + dir * 60,
      y: mango.y - 30,
      angle: dir * 360,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: mango,
          y: mango.y + 200,
          x: mango.x + dir * 30,
          angle: dir * 720,
          duration: 700,
          ease: 'Quad.easeIn',
          onComplete: () => mango.destroy(),
        }),
    });
  }
}
