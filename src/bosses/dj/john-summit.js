import DjBoss from '../DjBoss.js';

// John Summit, the level 6 boss (VAIL). He tucks down and skis across the arena at full speed: jump
// over him. When he stops at the far wall he throws a snowball back the way he came.
export const info = {
  id: 'john-summit',
  name: 'JOHN SUMMIT',
  level: 6,
  // Driving piano house in F, our own placeholder.
  song: {
    bpm: 126,
    bass: [41, 0, 41, 0, 41, 0, 0, 48, 43, 0, 43, 0, 45, 0, 0, 48],
    chords: [[60, 65, 69], [62, 65, 69], [60, 64, 67], [58, 62, 65]],
    stabs: [0, 3, 8, 11],
  },
};

const SKI_SPEED = 210;
const SNOWBALL = { vx: 150, vy: -220, gravity: 600 };

export default class JohnSummit extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 2400, walkMs: 1800 });
  }

  attack() {
    // Ski to the wall he's facing (the far one from the player when he can).
    this.skiDir = this.x < this.arena.centerX ? 1 : -1;
    this.setFlipX(this.skiDir < 0);
    this.skiing = true;
  }

  whileMode(mode, t) {
    if (mode !== 'attack' || !this.skiing) return;
    this.body.setVelocityX(this.skiDir * SKI_SPEED * this.speedFactor);
    this.setAngle(this.skiDir * 6);
    // A little spray of snow behind the skis.
    if (Math.random() < 0.4) {
      const puff = this.scene.add.rectangle(this.x - this.skiDir * 10, this.arena.floor - 2, 2, 2, 0xfdfefd).setDepth(4);
      this.scene.tweens.add({ targets: puff, y: puff.y - 8, x: puff.x - this.skiDir * 10, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
    }
    const atWall = this.skiDir > 0 ? this.x >= this.arena.right - 26 : this.x <= this.arena.left + 26;
    if (atWall) {
      this.skiing = false;
      this.body.setVelocityX(0);
      this.setAngle(0);
      this.setFlipX(this.skiDir > 0);
      this.shoot(`${this.id}-snowball`, this.x - this.skiDir * 10, this.y - 8, -this.skiDir * SNOWBALL.vx, SNOWBALL.vy, { gravity: SNOWBALL.gravity, size: 10 });
    }
  }
}
