import Phaser from 'phaser';

const SCALE = 0.5; // drawn at twice the world resolution, like the hero
const STEP_MS = 140; // one step of his walk, like Boris walking

// The common end boss for the DJ levels 2+. Each DJ (src/bosses/dj/<id>.js) extends this and only
// writes its own attack; the cycle is the same for all of them, so a fight is easy to read:
//   walk (paces the arena) -> windup (attack pose, shakes: the warning) -> attack (his move) -> rest
// Jump on his head or hit him with a rubber duck. Touching him any other way costs a hit, and so do
// his projectiles (this.shots). After a hit he hops away and is safe for a moment; each hit makes
// him faster. Same interface as Solomun (src/objects/Boss.js): takeHit(), hurtable, mode,
// standForPhoto(x, floor, flip), events 'hit' (hitsLeft) and 'defeated'.
//
// Pictures: '<id>-idle', '<id>-walk', '<id>-attack', '<id>-defeat', '<id>-photo-pose' (src/art/<id>/).
// Numbers: the defaults below; a DJ overrides them with its own static TUNING.
export const DEFAULTS = {
  walkSpeed: 55, // px/s at speed 1
  walkMs: 2200, // how long he paces between attacks
  windupMs: 650, // the warning before each attack
  attackMs: 1200, // how long the attack pose lasts
  restMs: 700, // a breather after attacking: the easy moment to stomp him
  hurtMs: 1100, // safe after a hit
  speedUpPerHit: 1.12,
  bodyW: 30, // hitbox, picture pixels
  bodyH: 52,
};

export default class DjBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, arena, tuning = {}, id, numbers = {}) {
    super(scene, arena.centerX + 60, arena.floor - 140, `${id}-idle`);
    this.id = id;
    this.n = { ...DEFAULTS, ...numbers };
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE).setDepth(5);
    this.body.setAllowGravity(false);
    this.fitBody();

    this.arena = arena;
    this.hitsLeft = tuning.hits ?? 3;
    this.startHits = this.hitsLeft;
    this.speedFactor = tuning.speed ?? 1;
    this.dir = -1;
    this.mode = 'enter';
    this.modeAt = scene.time.now;
    this.safeUntil = 0;
    this.attacks = 0;

    // Everything he throws or sends: touching any of it costs the player a hit.
    this.shots = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.overlap(scene.player, this.shots, (_p, shot) => {
      if (!shot.active || this.mode === 'defeated' || scene.player.dead) return;
      scene.player.takeHit();
      if (shot.getData('breaks')) shot.destroy();
    });
    this.on('destroy', () => this.shots.destroy(true));

    // He drops into the arena.
    scene.tweens.add({
      targets: this,
      y: this.floorY,
      duration: 600,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        scene.cameras.main.shake(120, 0.004);
        this.setMode('walk');
      },
    });
  }

  get floorY() {
    return this.arena.floor - this.displayHeight / 2;
  }

  get player() {
    return this.scene.player;
  }

  get hurtable() {
    return this.mode !== 'enter' && this.mode !== 'defeated' && this.scene.time.now >= this.safeUntil;
  }

  // ms scaled down as he speeds up
  ms(base) {
    return base / this.speedFactor;
  }

  fitBody() {
    const { bodyW: w, bodyH: h } = this.n;
    this.body.setSize(w, Math.min(h, this.height - 2), false);
    this.body.setOffset((this.width - w) / 2, this.height - Math.min(h, this.height - 2) - 1);
  }

  setPose(pose) {
    this.setTexture(`${this.id}-${pose}`);
    this.fitBody();
    if (this.mode !== 'enter' && !this.airborne) this.y = this.floorY;
  }

  // Walking: his walking picture and his idle picture take turns, the same two-step cycle as Boris.
  step(time) {
    const pose = Math.floor(time / STEP_MS) % 2 ? 'walk' : 'idle';
    if (this.texture.key !== `${this.id}-${pose}`) this.setPose(pose);
  }

  setMode(mode) {
    this.mode = mode;
    this.modeAt = this.scene.time.now;
    this.setAngle(0);
    if (mode === 'windup' || mode === 'attack') this.setPose('attack');
    else if (mode !== 'defeated') this.setPose('idle');
    if (mode === 'windup') this.onWindup();
    if (mode === 'attack') {
      this.attacks += 1;
      this.attack();
    }
  }

  facePlayer() {
    this.setFlipX(this.player.x < this.x); // the pictures face right
  }

  get facing() {
    return this.flipX ? -1 : 1;
  }

  update(time) {
    if (!this.active || this.mode === 'defeated' || this.mode === 'enter') return;
    const t = time - this.modeAt;
    const { n } = this;
    this.whileMode?.(this.mode, t);
    switch (this.mode) {
      case 'walk': {
        // Pace back and forth, turning at the arena walls, keeping some distance from the player.
        const left = this.arena.left + 24;
        const right = this.arena.right - 24;
        if (this.x <= left) this.dir = 1;
        if (this.x >= right) this.dir = -1;
        this.body.setVelocityX(this.dir * n.walkSpeed * this.speedFactor);
        this.setFlipX(this.dir < 0);
        this.step(time);
        if (t > this.ms(n.walkMs)) {
          this.body.setVelocityX(0);
          this.facePlayer();
          this.setMode('windup');
        }
        break;
      }
      case 'windup':
        this.body.setVelocityX(0);
        this.setAngle(Math.sin(t / 45) * 5);
        if (t > n.windupMs) this.setMode('attack');
        break;
      case 'attack':
        if (t > this.ms(n.attackMs)) {
          this.body.setVelocityX(0);
          this.setMode('rest');
        }
        break;
      case 'rest':
        this.body.setVelocityX(0);
        if (t > this.ms(n.restMs)) this.setMode('walk');
        break;
      case 'hurt':
        if (t > n.hurtMs) this.setMode('walk');
        break;
      default:
        break;
    }
    this.x = Phaser.Math.Clamp(this.x, this.arena.left + 16, this.arena.right - 16);
    this.cleanShots();
  }

  // Projectiles that left the arena go away.
  cleanShots() {
    const { left, right, floor } = this.arena;
    this.shots.getChildren().slice().forEach((s) => {
      if (s.x < left - 30 || s.x > right + 30 || s.y > floor + 60 || s.y < -200) s.destroy();
    });
  }

  // A projectile: picture key, start position and velocity. opts: gravity (px/s/s), spin (deg/s),
  // breaks (goes away when it hits the player), size (hitbox, picture pixels).
  shoot(key, x, y, vx, vy, opts = {}) {
    const shot = this.scene.physics.add.image(x, y, key).setScale(SCALE).setDepth(6);
    this.shots.add(shot);
    shot.body.setAllowGravity(Boolean(opts.gravity));
    if (opts.gravity) shot.body.setGravityY(opts.gravity - this.scene.physics.world.gravity.y);
    shot.body.setVelocity(vx, vy);
    if (opts.spin) shot.setAngularVelocity(opts.spin);
    const size = opts.size ?? Math.min(shot.width, shot.height) - 4;
    shot.body.setCircle(size / 2, (shot.width - size) / 2, (shot.height - size) / 2);
    shot.setData('breaks', opts.breaks ?? true);
    return shot;
  }

  // Override in the DJ's file.
  onWindup() {}
  attack() {}

  takeHit() {
    if (!this.hurtable) return false;
    this.hitsLeft -= 1;
    this.emit('hit', this.hitsLeft);
    if (this.hitsLeft <= 0) {
      this.defeat();
      return true;
    }
    this.onHurt?.();
    this.speedFactor *= this.n.speedUpPerHit;
    this.safeUntil = this.scene.time.now + this.n.hurtMs;
    this.setMode('hurt');
    // A hop away from the player, so one jump can't bounce on him twice.
    const away = this.x < this.player.x ? -1 : 1;
    const to = Phaser.Math.Clamp(this.x + away * 90, this.arena.left + 24, this.arena.right - 24);
    this.body.setVelocityX(0);
    this.scene.tweens.add({ targets: this, x: to, duration: 500, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this, y: this.floorY - 26, duration: 250, yoyo: true, ease: 'Quad.easeOut' });
    this.dir = away;
    this.flash();
    return true;
  }

  flash() {
    let step = 0;
    this.setTintFill(0xffffff);
    this.scene.time.addEvent({
      delay: 70,
      repeat: 5,
      callback: () => {
        step += 1;
        if (step % 2 === 0 && step < 6) this.setTintFill(0xffffff);
        else this.clearTint();
      },
    });
  }

  defeat() {
    this.mode = 'defeated';
    this.body.enable = false;
    this.scene.tweens.killTweensOf(this);
    this.onDefeat?.();
    // Whatever he threw fades away.
    this.shots.getChildren().forEach((s) => {
      s.body.enable = false;
      this.scene.tweens.add({ targets: s, alpha: 0, duration: 300, onComplete: () => s.destroy() });
    });
    this.setAngle(0).setFlipX(false).setTexture(`${this.id}-defeat`);
    this.y = this.floorY;
    this.flash();
    this.scene.time.delayedCall(900, () => this.emit('defeated'));
  }

  // Beaten, he walks over next to Boris for Felix's winner photo.
  standForPhoto(x, floor, flip) {
    this.setFlipX(x < this.x).setAngle(0);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x,
        duration: 650,
        ease: 'Quad.easeInOut',
        onUpdate: () => {
          const pose = Math.floor(this.scene.time.now / STEP_MS) % 2 ? 'walk' : 'idle';
          this.setTexture(`${this.id}-${pose}`);
          this.y = floor - this.displayHeight / 2;
        },
        onComplete: () => {
          this.setTexture(`${this.id}-photo-pose`).setFlipX(flip);
          this.y = floor - this.displayHeight / 2;
          this.scene.tweens.add({ targets: this, y: this.y - 3, duration: 90, yoyo: true, onComplete: resolve });
        },
      });
    });
  }
}
