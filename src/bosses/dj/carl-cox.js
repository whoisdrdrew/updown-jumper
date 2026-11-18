import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// Carl Cox, the level 10 boss (THE BEND). The payoff Sandro asked for: Carl strapped into his red
// '32 Ford roadster. The starting lights count down (red, amber, amber, green), then he drags
// across the arena: jump over the car. He climbs out at the far wall to wave: stomp him then.
export const info = {
  id: 'carl-cox',
  name: 'CARL COX',
  level: 10,
  // Pounding techno in A minor, our own placeholder.
  song: {
    bpm: 132,
    bass: [33, 0, 45, 0, 33, 0, 45, 0, 33, 0, 45, 0, 36, 0, 48, 0],
    chords: [[57, 60, 64], [57, 60, 64], [55, 59, 62], [53, 57, 60]],
    stabs: [4, 12],
  },
};

const DRAG_SPEED = 230;
const LIGHTS = [0xdb3a3a, 0xf5b04a, 0xf5b04a, 0x3cae4a];
const LIGHT_MS = 260;

export default class CarlCox extends DjBoss {
  constructor(scene, arena, tuning) {
    // Long windup: the countdown of the starting lights.
    super(scene, arena, tuning, info.id, { windupMs: LIGHTS.length * LIGHT_MS + 100, attackMs: 2600, restMs: 1300, bodyW: 32 });
    this.car = scene.physics.add.image(this.x, arena.floor, `${this.id}-roadster`).setScale(0.5).setOrigin(0.5, 1).setDepth(6).setVisible(false);
    this.car.body.setAllowGravity(false).setImmovable(true);
    this.car.body.setSize(80, 26).setOffset(6, 12);
    this.car.body.enable = false;
    // Touching the car hurts; landing on its bonnet is safe (and doesn't count as a stomp).
    scene.physics.add.overlap(scene.player, this.car, () => {
      const player = scene.player;
      if (!this.carOn || player.dead || this.mode === 'defeated') return;
      if (player.body.velocity.y > 0 && player.body.bottom < this.car.body.top + 8) player.body.setVelocityY(-220);
      else player.takeHit();
    });
    // The starting-light tower at the back of the arena, and the big light that counts him in.
    this.tower = scene.add.image(arena.left + 24, arena.floor, `${this.id}-roadster-lights`).setScale(0.5).setOrigin(0.5, 1).setDepth(2);
    this.lamp = scene.add.circle(arena.centerX, arena.floor - 78, 6, 0x30233f).setStrokeStyle(1, 0x150b22).setDepth(9).setVisible(false);
    this.on('destroy', () => [this.car, this.tower, this.lamp].forEach((o) => o.destroy()));
  }

  onWindup() {
    // He jumps into the car and the lights count down.
    this.inCar(true);
    this.lamp.setVisible(true);
    LIGHTS.forEach((color, i) => {
      this.scene.time.delayedCall(i * LIGHT_MS, () => this.mode === 'windup' && this.lamp.setFillStyle(color));
    });
    this.scene.time.delayedCall(LIGHTS.length * LIGHT_MS + 300, () => this.lamp.setVisible(false));
  }

  inCar(on) {
    this.car.setVisible(on);
    this.car.body.enable = on;
    this.car.setPosition(this.x, this.arena.floor);
    this.carOn = on;
  }

  attack() {
    this.dragDir = this.x < this.arena.centerX ? 1 : -1;
    this.setFlipX(this.dragDir < 0);
    this.car.setFlipX(this.dragDir < 0);
  }

  whileMode(mode) {
    if (this.carOn) {
      // Sitting in the car: only his top half shows above the doors.
      this.car.setPosition(this.x, this.arena.floor);
      this.setAngle(0);
    }
    if (mode === 'windup') this.setAngle(0);
    if (mode === 'attack' && this.carOn) {
      this.body.setVelocityX(this.dragDir * DRAG_SPEED * this.speedFactor);
      if (Math.random() < 0.5) {
        const smoke = this.scene.add.circle(this.x - this.dragDir * 22, this.arena.floor - 3, 3, 0x9a96b6, 0.7).setDepth(5);
        this.scene.tweens.add({ targets: smoke, scale: 2.2, alpha: 0, y: smoke.y - 6, duration: 500, onComplete: () => smoke.destroy() });
      }
      const atWall = this.dragDir > 0 ? this.x >= this.arena.right - 30 : this.x <= this.arena.left + 30;
      if (atWall) {
        this.body.setVelocityX(0);
        this.modeAt = Math.min(this.modeAt, this.scene.time.now - this.ms(this.n.attackMs)); // straight to rest
      }
    }
    if (mode === 'rest' || mode === 'walk' || mode === 'hurt') {
      if (this.carOn) {
        // Out of the car and next to it: now he can be stomped.
        this.inCar(false);
        this.parked = this.scene.add.image(this.car.x, this.arena.floor, `${this.id}-roadster`).setScale(0.5).setOrigin(0.5, 1)
          .setDepth(4).setFlipX(this.car.flipX).setAlpha(0.9);
        this.scene.tweens.add({ targets: this.parked, alpha: 0, delay: 600, duration: 400, onComplete: (_t, [p]) => p.destroy() });
        this.x -= this.dragDir * 26;
      }
    }
  }

  // While he sits in the car, his hitbox is the car: touching it hurts, and he can't be stomped.
  get hurtable() {
    return super.hurtable && !this.carOn;
  }

  update(time) {
    super.update(time);
    if (this.carOn && this.mode !== 'defeated') {
      this.y = this.arena.floor - 7 - this.displayHeight / 2; // sunk into the seat: the doors hide his legs
      this.setAngle(0);
      this.car.setPosition(this.x, this.arena.floor);
    }
  }

  onDefeat() {
    this.inCar(false);
    this.lamp.setVisible(false);
  }
}
