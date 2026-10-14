import Phaser from 'phaser';
import { PHYSICS, PLAYER, MANGO, RIDE_DUCK } from '../config.js';

// Hitbox sizes on foot and riding the big duck.
const SIZE = { foot: { w: PLAYER.width, h: PLAYER.height }, riding: { w: 16, h: 22 } };

// The Up-Down-Jumper. For now a colored box; the real sprite comes in the art milestone.
// Events it emits for the scene: 'hurt' (hitsTaken), 'dead', 'dismount' (x, y, dir), 'ammo' (count).
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, input) {
    super(scene, x, y, 'hero-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.controls = input;
    this.fitBody(SIZE.foot);
    this.body.setMaxVelocityY(PLAYER.maxFallSpeed);
    this.setCollideWorldBounds(true);

    this.lastGroundedAt = -Infinity;
    this.jumpPressedAt = -Infinity;
    this.power = PLAYER.startPower;
    this.shots = null; // set by the scene
    this.hits = 0;
    this.ammo = PLAYER.startAmmo;
    this.riding = false;
    this.dead = false;
    this.safeUntil = 0;
    this.steerLockedUntil = 0;
  }

  get facing() {
    return this.flipX ? -1 : 1;
  }

  get invulnerable() {
    return this.dead || this.scene.time.now < this.safeUntil;
  }

  update(time, delta) {
    if (this.dead) return;
    const dt = delta / 1000;
    const body = this.body;
    const c = this.controls;
    const onGround = body.blocked.down;
    const canSteer = time >= this.steerLockedUntil;

    if (onGround) this.lastGroundedAt = time;
    if (c.jumpJustPressed()) this.jumpPressedAt = time;

    // Horizontal movement: accelerate toward the target speed instead of snapping to it.
    const dir = canSteer ? (c.right() ? 1 : 0) - (c.left() ? 1 : 0) : 0;
    const maxSpeed = c.run() ? PLAYER.runSpeed : PLAYER.walkSpeed;
    let vx = body.velocity.x;

    if (!canSteer) {
      // Slipping: slide along, steering returns in a moment.
    } else if (dir !== 0) {
      const turning = vx !== 0 && Math.sign(vx) !== dir;
      const accel = !onGround ? PLAYER.airAccel : turning ? PLAYER.skidDecel : PLAYER.groundAccel;
      vx = approach(vx, dir * maxSpeed, accel * dt);
      this.setFlipX(dir < 0);
    } else if (onGround) {
      vx = approach(vx, 0, PLAYER.groundDecel * dt);
    }
    // Letting go of run while above walk speed bleeds speed off gradually.
    if (canSteer && Math.abs(vx) > maxSpeed) vx = approach(vx, Math.sign(vx) * maxSpeed, PLAYER.groundDecel * dt);
    body.setVelocityX(vx);

    // Jump, with coyote time and an input buffer so it never feels like a press was eaten.
    const canJump = canSteer && time - this.lastGroundedAt <= PLAYER.coyoteMs;
    const buffered = time - this.jumpPressedAt <= PLAYER.jumpBufferMs;
    if (canJump && buffered) {
      const boost = this.riding ? RIDE_DUCK.jumpBoost : 1;
      body.setVelocityY(-(PLAYER.jumpSpeed + Math.abs(vx) * PLAYER.runJumpBonus) * boost);
      this.lastGroundedAt = -Infinity;
      this.jumpPressedAt = -Infinity;
    }

    // Variable jump height: heavier gravity once the button is released or the jump peaks.
    const rising = body.velocity.y < 0;
    const extra = rising && c.jump() ? 0 : PLAYER.releaseGravity - PHYSICS.gravity;
    body.setGravityY(extra);

    this.animate(time, onGround);

    // Each shot uses up one collected rubber duck.
    if (c.shootJustPressed() && this.power === 'ducks' && this.ammo > 0 && this.shots) {
      if (this.shots.shoot(this.x + this.facing * 8, this.y - 2, this.facing)) this.addAmmo(-1);
    }
  }

  addAmmo(n) {
    this.ammo += n;
    this.emit('ammo', this.ammo);
  }

  // Stepped on a mango: slip forward. Riding, the duck runs off; on foot, it costs a hit.
  slipOnMango() {
    if (this.invulnerable) return;
    const dir = this.facing;
    this.body.setVelocity(dir * MANGO.slipSpeed, -MANGO.slipHop);
    this.steerLockedUntil = this.scene.time.now + MANGO.slipLockMs;
    this.takeHit();
  }

  // Any hit (mango, later enemies and bosses).
  takeHit() {
    if (this.invulnerable) return;
    if (this.riding) {
      this.dismount();
      this.blink();
      return;
    }
    this.hits += 1;
    this.emit('hurt', this.hits);
    if (this.hits >= PLAYER.maxHits) this.die();
    else this.blink();
  }

  blink() {
    this.safeUntil = this.scene.time.now + PLAYER.blinkMs;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.15,
      duration: 80,
      yoyo: true,
      repeat: Math.floor(PLAYER.blinkMs / 160) - 1,
      onComplete: () => this.setAlpha(1),
    });
  }

  // Mario-style death: pop up and fall through the floor.
  die() {
    this.dead = true;
    this.body.checkCollision.none = true;
    this.setCollideWorldBounds(false);
    this.body.setGravityY(0);
    this.body.setVelocity(0, -260);
    this.emit('dead');
  }

  mount() {
    if (this.riding || this.dead) return;
    this.riding = true;
    this.resize('rider', SIZE.riding);
  }

  dismount() {
    if (!this.riding) return;
    this.riding = false;
    const { x } = this;
    const bottom = this.body.bottom;
    this.resize('hero-idle', SIZE.foot);
    this.body.setVelocityY(-200); // jump off the duck
    this.emit('dismount', x, bottom - 8, -this.facing);
  }

  // Hitbox centred horizontally, standing on the bottom edge of the sprite.
  fitBody(size) {
    this.body.setSize(size.w, size.h, false);
    this.body.setOffset((this.width - size.w) / 2, this.height - size.h);
  }

  // Run, jump and stand poses (riding uses one picture for now).
  animate(time, onGround) {
    if (this.riding) return;
    let pose = 'idle';
    if (!onGround) pose = 'jump';
    else if (Math.abs(this.body.velocity.x) > 10) pose = Math.floor(time / (Math.abs(this.body.velocity.x) > 120 ? 70 : 110)) % 2 ? 'run1' : 'run2';
    this.setTexture(`hero-${pose}`);
  }

  // Swap texture and hitbox while keeping the feet where they were.
  resize(texture, size) {
    const bottom = this.body.bottom;
    const velocity = this.body.velocity.clone();
    this.setTexture(texture);
    this.fitBody(size);
    this.body.reset(this.x, bottom - this.height / 2);
    this.body.setVelocity(velocity.x, velocity.y);
  }
}

function approach(value, target, step) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
