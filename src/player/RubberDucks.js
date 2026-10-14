import Phaser from 'phaser';
import { SHOT } from '../config.js';

// Rubber ducks thrown with the shoot button. They hop along the ground and pop on walls.
export default class RubberDucks {
  constructor(scene, layer) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: true, maxSize: SHOT.maxOnScreen });
    scene.physics.add.collider(this.group, layer, (duck) => this.onHitLevel(duck));
  }

  shoot(x, y, dir) {
    if (this.group.countActive(true) >= SHOT.maxOnScreen) return false;
    const duck = this.group.get(x, y, 'rubber-duck');
    if (!duck) return false;
    duck.setActive(true).setVisible(true).setFlipX(dir < 0).setAngle(0);
    duck.body.enable = true;
    duck.body.reset(x, y);
    duck.body.setSize(7, 6);
    duck.body.setMaxVelocityY(SHOT.maxFallSpeed);
    duck.body.setVelocity(dir * SHOT.speed, SHOT.launchSpeed);
    duck.dir = dir;
    return true;
  }

  onHitLevel(duck) {
    if (duck.body.blocked.left || duck.body.blocked.right) return this.pop(duck);
    if (duck.body.blocked.down) duck.body.setVelocity(duck.dir * SHOT.speed, -SHOT.bounceSpeed);
  }

  update() {
    const view = this.scene.cameras.main.worldView;
    this.group.children.each((duck) => {
      if (!duck.active) return;
      duck.setAngle(Phaser.Math.Clamp(duck.body.velocity.y / 8, -25, 25) * duck.dir); // bob nose up and down
      if (!Phaser.Geom.Rectangle.Overlaps(view, duck.getBounds())) this.pop(duck);
    });
  }

  pop(duck) {
    this.group.killAndHide(duck);
    duck.body.stop();
    duck.body.enable = false;
  }
}
