import { ITEM_SCALE } from '../art/sprites.js';
import { MANGO, TILE } from '../config.js';

// Mangos roll back and forth along the floor, like Goombas in Mario 3. Touching one makes the
// player slip. Shoot them away or jump over them. They start rolling (toward the player) once
// they come on screen, turn around at walls and at the edge of a drop, and never leave their floor.
export default class Mangos {
  constructor(scene, positions, layer) {
    this.scene = scene;
    this.layer = layer;
    this.group = scene.physics.add.group();
    for (const { x, y } of positions) {
      const mango = this.group.create(x, y - 5, 'mango').setScale(ITEM_SCALE);
      mango.body.setSize(20, 14); // picture pixels: 10x7 in the world
      mango.dir = 0; // asleep until it comes on screen
    }
    scene.physics.add.collider(this.group, layer);
  }

  update() {
    const view = this.scene.cameras.main.worldView;
    this.group.children.each((mango) => {
      if (!mango.body.enable) return;
      const body = mango.body;
      if (!mango.dir) {
        if (mango.x > view.right + 24 || mango.x < view.left - 24) return;
        mango.dir = this.scene.player.x < mango.x ? -1 : 1;
      }
      if (body.blocked.down) {
        // Turn at a wall, or where the floor ends one step ahead.
        const aheadX = mango.x + mango.dir * (body.halfWidth + 2);
        const floor = this.layer.getTileAtWorldXY(aheadX, body.bottom + 2);
        if (body.blocked.left || body.blocked.right || !floor?.collides) mango.dir = -mango.dir;
      }
      body.setVelocityX(mango.dir * MANGO.rollSpeed);
      // Roll: spin the picture with the distance travelled.
      mango.angle += (mango.dir * MANGO.rollSpeed) / 60 * (180 / Math.PI) / (TILE / 4);
      if (mango.y > this.scene.physics.world.bounds.bottom + 32) mango.destroy();
    });
  }

  // The player stepped on it: it gets squashed flat and disappears.
  squash(mango) {
    mango.body.enable = false;
    mango.setAngle(0);
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
