import Phaser from 'phaser';
import { FIREBALL } from '../config.js';

// Bouncing fireballs, Super Mario World style: they hop along the ground and pop on walls.
export default class Fireballs {
  constructor(scene, layer) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: true, maxSize: FIREBALL.maxOnScreen });
    scene.physics.add.collider(this.group, layer, (ball) => this.onHitLevel(ball));
  }

  shoot(x, y, dir) {
    if (this.group.countActive(true) >= FIREBALL.maxOnScreen) return false;
    const ball = this.group.get(x, y, 'fireball');
    if (!ball) return false;
    ball.setActive(true).setVisible(true);
    ball.body.enable = true;
    ball.body.reset(x, y);
    ball.body.setCircle(3);
    ball.body.setMaxVelocityY(FIREBALL.maxFallSpeed);
    ball.body.setVelocity(dir * FIREBALL.speed, FIREBALL.launchSpeed);
    ball.dir = dir;
    return true;
  }

  onHitLevel(ball) {
    if (ball.body.blocked.left || ball.body.blocked.right) return this.pop(ball);
    if (ball.body.blocked.down) ball.body.setVelocity(ball.dir * FIREBALL.speed, -FIREBALL.bounceSpeed);
  }

  update() {
    const view = this.scene.cameras.main.worldView;
    this.group.children.each((ball) => {
      if (!ball.active) return;
      ball.rotation += 0.3 * ball.dir;
      if (!Phaser.Geom.Rectangle.Overlaps(view, ball.getBounds())) this.pop(ball);
    });
  }

  pop(ball) {
    this.group.killAndHide(ball);
    ball.body.stop();
    ball.body.enable = false;
  }
}
