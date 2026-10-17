import { BURGER } from '../config.js';
import { ITEM_SCALE } from '../art/sprites.js';
import { T } from './Blocks.js';

// The burger power-up, our Mario mushroom. A burger box hops out of a music-note block like the
// duck egg, slides off the blocks like a Mario mushroom, lands on the ground, wobbles and pops its lid; the burger rises out and waits on the open box.
// Touch it to eat it: Boris grows big, and the next hit only shrinks him back.
export default class Burgers {
  constructor(scene, layer) {
    this.scene = scene;
    this.layer = layer;
    this.boxes = scene.physics.add.group();
    scene.physics.add.collider(this.boxes, layer);
    this.burgers = scene.physics.add.group({ allowGravity: false, immovable: true });
  }

  popBox(x, blockTop, dir) {
    const box = this.boxes.create(x, blockTop - 7, 'burger-box').setScale(ITEM_SCALE);
    box.dir = dir;
    box.body.setVelocity(dir * BURGER.boxHopSpeedX, -BURGER.boxHopSpeedY);
  }

  update() {
    const bottom = this.scene.physics.world.bounds.bottom;
    this.boxes.children.each((box) => {
      if (box.y > bottom + 32) return box.destroy();
      if (!box.body.blocked.down || box.wobbling) return;
      // On a block or platform it keeps sliding (turning at walls) until it drops to the ground.
      const under = this.layer.getTileAtWorldXY(box.x, box.body.bottom + 2);
      if (under?.index !== T.GRASS) {
        if (box.body.blocked.left) box.dir = 1;
        if (box.body.blocked.right) box.dir = -1;
        box.body.setVelocityX(box.dir * BURGER.boxSlideSpeed);
        return;
      }
      box.wobbling = true;
      box.body.setVelocityX(0);
      this.scene.tweens.add({ targets: box, angle: { from: -10, to: 10 }, duration: 80, yoyo: true, repeat: 3 });
      this.scene.time.delayedCall(BURGER.openDelayMs, () => this.open(box));
    });
  }

  // The lid flies off and the burger rises out of the box.
  open(box) {
    if (!box.active) return;
    const { scene } = this;
    const x = box.x;
    const floor = box.body.bottom;
    box.destroy();
    const base = scene.add.image(x, floor, 'burger-box-base').setOrigin(0.5, 1).setScale(ITEM_SCALE);
    const lid = scene.add.image(x, floor - 7, 'burger-box-lid').setOrigin(0.5, 1).setScale(ITEM_SCALE);
    scene.tweens.add({ targets: lid, x: x - 14, y: lid.y - 14, angle: -100, alpha: 0, duration: 450, ease: 'Quad.easeOut',
      onComplete: () => lid.destroy() });

    const burger = this.burgers.create(x, floor - 4, 'burger').setOrigin(0.5, 1).setScale(ITEM_SCALE).setDepth(1);
    burger.base = base;
    burger.ready = false;
    scene.tweens.add({
      targets: burger,
      y: floor - 9,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        burger.ready = true;
        scene.tweens.add({ targets: burger, y: burger.y - 2, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });
  }

  // Touching the box (or hitting it with a rubber duck) opens it at once.
  touchBox(box) {
    if (box.body.enable) {
      box.body.enable = false;
      this.open(box);
    }
  }

  // Touching the burger eats it, once it has risen out of the box. Returns true when eaten.
  eat(burger) {
    if (!burger.ready) return false;
    burger.ready = false;
    burger.body.enable = false;
    this.scene.tweens.killTweensOf(burger);
    this.scene.tweens.add({ targets: burger, scale: ITEM_SCALE * 1.4, alpha: 0, duration: 200, onComplete: () => burger.destroy() });
    this.scene.tweens.add({ targets: burger.base, alpha: 0, delay: 600, duration: 400, onComplete: () => burger.base.destroy() });
    return true;
  }
}
