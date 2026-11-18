import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// Steve Aoki, the level 5 boss (BAKERY). His famous cake throw: a fan of three cakes in arcs, short,
// middle and far, so there's always one gap to stand in. They splat on the floor.
export const info = {
  id: 'steve-aoki',
  name: 'STEVE AOKI',
  level: 5,
  // Big-room electro in E minor, our own placeholder.
  song: {
    bpm: 128,
    bass: [40, 40, 0, 40, 0, 40, 43, 0, 40, 40, 0, 47, 0, 45, 43, 0],
    chords: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]],
    stabs: [0, 4, 8, 12],
  },
};

const GRAVITY = 600;
const FLIGHT_S = 0.95;

export default class SteveAoki extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 1300 });
  }

  attack() {
    // Three cakes towards the player: the gap moves each time.
    const gap = this.attacks % 3;
    const reach = [50, 105, 160];
    reach.forEach((dist, i) => {
      if (i === gap && this.hitsLeft > 1) return; // on his last heart all three fly
      const sx = this.x + this.facing * 8;
      const sy = this.y - 14;
      const tx = Phaser.Math.Clamp(sx + this.facing * dist, this.arena.left + 8, this.arena.right - 8);
      const t = FLIGHT_S;
      const vx = (tx - sx) / t;
      const vy = (this.arena.floor - 6 - sy - 0.5 * GRAVITY * t * t) / t;
      const c = this.shoot(`${this.id}-cake`, sx, sy, vx * this.speedFactor ** 0.5, vy, { gravity: GRAVITY, spin: 120 * this.facing, size: 12 });
      c.setData('cake', true);
    });
  }

  whileMode() {
    const floor = this.arena.floor;
    for (const c of this.shots.getChildren()) {
      if (c.getData('cake') && c.y >= floor - 5) {
        // Splat.
        c.setData('cake', false);
        c.body.enable = false;
        c.setAngle(0);
        this.scene.tweens.add({ targets: c, scaleX: c.scaleX * 1.8, scaleY: c.scaleY * 0.4, y: floor - 2, alpha: 0, duration: 400, onComplete: () => c.destroy() });
      }
    }
  }
}
