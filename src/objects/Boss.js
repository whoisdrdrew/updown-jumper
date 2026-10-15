import Phaser from 'phaser';
import { BOSS, GAME_WIDTH } from '../config.js';

const SCALE = 0.5; // like the hero: one picture pixel is one screen pixel

// Solomun, the end boss of world 1. He floats cross-legged around the arena, waves his sauna
// towel as a warning, then dives at the player and glides low over the floor before rising again.
// Jump on his head or hit him with a rubber duck. Touching him any other way costs a hit.
// Events: 'hit' (hitsLeft), 'defeated'.
export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, arena) {
    super(scene, arena.centerX, arena.top - 40, 'solomun-meditate');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE).setDepth(5);
    this.body.setAllowGravity(false);
    // Hitbox: head and body, a little inside the outline (picture pixels).
    this.body.setSize(26, 40);

    this.arena = arena;
    this.hitsLeft = BOSS.hits;
    this.speedFactor = 1;
    this.mode = 'enter';
    this.modeAt = scene.time.now;
    this.safeUntil = 0;
    this.swoop = null;
  }

  get hoverY() {
    return this.arena.floor - BOSS.hoverHeight;
  }

  // Centre height that puts his folded legs just above the floor, low enough for a hopping duck.
  get lowY() {
    return this.arena.floor - this.displayHeight / 2 + 1;
  }

  get hurtable() {
    return this.mode !== 'enter' && this.mode !== 'defeated' && this.scene.time.now >= this.safeUntil;
  }

  setMode(state) {
    this.mode = state;
    this.modeAt = this.scene.time.now;
    const towel = state === 'windup' || state === 'swoop' || state === 'low';
    this.setTexture(towel ? 'solomun-attack' : 'solomun-meditate');
    // Keep the hitbox on the body whichever picture is showing.
    this.body.setSize(26, 40);
    this.body.setOffset((this.width - 26) / 2, this.height - 42);
  }

  update(time) {
    if (!this.active) return;
    const t = time - this.modeAt;
    const player = this.scene.player;
    let target = null;
    let maxSpeed = BOSS.maxSpeed * this.speedFactor;

    switch (this.mode) {
      case 'enter':
        target = { x: this.arena.centerX, y: this.hoverY };
        maxSpeed = 60;
        if (Math.abs(this.y - this.hoverY) < 2) this.setMode('float');
        break;
      case 'float': {
        // Cross-legged drift across the arena with a gentle bob.
        const s = (time / 1000) * BOSS.floatSpeed * this.speedFactor;
        target = { x: this.arena.centerX + Math.sin(s) * BOSS.floatRange, y: this.hoverY + Math.sin(s * 3) * 5 };
        if (t > BOSS.floatMs / this.speedFactor) this.setMode('windup');
        break;
      }
      case 'windup':
        // Towel over the head, swaying: the warning that he is about to dive.
        target = { x: this.x, y: this.hoverY };
        this.setAngle(Math.sin(t / 50) * 8);
        if (t > BOSS.windupMs) {
          this.setAngle(0);
          this.swoop = { x: Phaser.Math.Clamp(player.x, this.arena.left + 20, this.arena.right - 20) };
          this.setMode('swoop');
        }
        break;
      case 'swoop':
        target = { x: this.swoop.x, y: this.lowY };
        maxSpeed = BOSS.swoopSpeed * this.speedFactor;
        if (Math.abs(this.y - this.lowY) < 3 || t > 1500) {
          // Glide on along the floor, away from where he came from.
          this.swoop.dir = this.x < this.arena.centerX ? 1 : -1;
          this.setMode('low');
        }
        break;
      case 'low':
        target = { x: this.x + this.swoop.dir * 40, y: this.lowY };
        maxSpeed = 70 * this.speedFactor;
        if (t > BOSS.lowMs) this.setMode('float');
        break;
      case 'hurt':
        // Spins up and away from the player, so one jump can't bounce on him twice.
        target = { x: this.fleeX, y: this.hoverY };
        if (t > BOSS.hurtMs) {
          this.setAngle(0);
          this.setMode('float');
        }
        break;
      default:
        return;
    }

    // Fly toward the target, easing in as he gets close.
    const vx = Phaser.Math.Clamp((target.x - this.x) * 4, -maxSpeed, maxSpeed);
    const vy = Phaser.Math.Clamp((target.y - this.y) * 4, -maxSpeed, maxSpeed);
    this.body.setVelocity(vx, vy);
    this.x = Phaser.Math.Clamp(this.x, this.arena.left + 12, this.arena.right - 12);
    this.setFlipX(player.x < this.x && this.mode !== 'hurt');
  }

  // A stomp or a rubber duck.
  takeHit() {
    if (!this.hurtable) return false;
    this.hitsLeft -= 1;
    this.emit('hit', this.hitsLeft);
    if (this.hitsLeft <= 0) {
      this.defeat();
      return true;
    }
    this.speedFactor *= BOSS.speedUpPerHit;
    this.safeUntil = this.scene.time.now + BOSS.hurtMs;
    const away = this.x < this.scene.player.x ? -1 : 1;
    this.fleeX = Phaser.Math.Clamp(this.x + away * 100, this.arena.left + 24, this.arena.right - 24);
    this.setMode('hurt');
    // Spin and flash, like a Koopaling in its shell.
    this.scene.tweens.add({ targets: this, angle: 720, duration: BOSS.hurtMs - 200, ease: 'Cubic.easeOut' });
    this.flash();
    return true;
  }

  flash() {
    this.setTintFill(0xffffff);
    this.scene.time.addEvent({ delay: 70, repeat: 5, callback: () => (this.tintFill ? this.clearTint() : this.setTintFill(0xffffff)) });
  }

  defeat() {
    const scene = this.scene;
    this.mode = 'defeated';
    this.body.enable = false;
    this.setAngle(0).setFlipX(false).setTexture('solomun-defeat');
    this.flash();
    // He throws in the towel...
    const towel = scene.add.image(this.x, this.y - 8, 'solomun-towel').setScale(SCALE).setDepth(5);
    scene.tweens.add({ targets: towel, x: this.x + 40, y: this.y - 50, angle: 540, duration: 700, ease: 'Quad.easeOut' });
    scene.tweens.add({ targets: towel, y: this.arena.floor - 3, delay: 700, duration: 500, ease: 'Bounce.easeOut' });
    // ...then floats up and out of the club.
    scene.tweens.add({
      targets: this,
      y: this.y - GAME_WIDTH,
      delay: 900,
      duration: 1600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.emit('defeated');
        this.destroy();
      },
    });
  }
}
