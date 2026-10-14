import Phaser from 'phaser';
import { PHYSICS, PLAYER } from '../config.js';

// The Up-Down-Jumper. For now a colored box; the real sprite comes in the art milestone.
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, input) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.controls = input;
    this.body.setSize(PLAYER.width, PLAYER.height);
    this.body.setMaxVelocityY(PLAYER.maxFallSpeed);
    this.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;

    this.lastGroundedAt = -Infinity;
    this.jumpPressedAt = -Infinity;
  }

  update(time, delta) {
    const dt = delta / 1000;
    const body = this.body;
    const c = this.controls;
    const onGround = body.blocked.down;

    if (onGround) this.lastGroundedAt = time;
    if (c.jumpJustPressed()) this.jumpPressedAt = time;

    // Horizontal movement: accelerate toward the target speed instead of snapping to it.
    const dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
    const maxSpeed = c.run() ? PLAYER.runSpeed : PLAYER.walkSpeed;
    let vx = body.velocity.x;

    if (dir !== 0) {
      const turning = vx !== 0 && Math.sign(vx) !== dir;
      const accel = !onGround ? PLAYER.airAccel : turning ? PLAYER.skidDecel : PLAYER.groundAccel;
      vx = approach(vx, dir * maxSpeed, accel * dt);
      this.setFlipX(dir < 0);
    } else if (onGround) {
      vx = approach(vx, 0, PLAYER.groundDecel * dt);
    }
    // Letting go of run while above walk speed bleeds speed off gradually.
    if (Math.abs(vx) > maxSpeed) vx = approach(vx, Math.sign(vx) * maxSpeed, PLAYER.groundDecel * dt);
    body.setVelocityX(vx);

    // Jump, with coyote time and an input buffer so it never feels like a press was eaten.
    const canJump = time - this.lastGroundedAt <= PLAYER.coyoteMs;
    const buffered = time - this.jumpPressedAt <= PLAYER.jumpBufferMs;
    if (canJump && buffered) {
      body.setVelocityY(-(PLAYER.jumpSpeed + Math.abs(vx) * PLAYER.runJumpBonus));
      this.lastGroundedAt = -Infinity;
      this.jumpPressedAt = -Infinity;
    }

    // Variable jump height: heavier gravity once the button is released or the jump peaks.
    const rising = body.velocity.y < 0;
    const extra = rising && c.jump() ? 0 : PLAYER.releaseGravity - PHYSICS.gravity;
    body.setGravityY(extra);

  }
}

function approach(value, target, step) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
