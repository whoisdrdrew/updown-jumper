import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// Marshmello, the level 3 boss (MELLOW). He lobs toasted marshmallows in high arcs at where you
// stand. Where one lands it catches fire and burns on the floor for a moment: don't step in it.
// After each hit he throws one more.
export const info = {
  id: 'marshmello',
  name: 'MARSHMELLO',
  level: 3,
  // Happy future-bass chords in C major, our own placeholder.
  song: {
    bpm: 128,
    bass: [48, 0, 0, 48, 0, 0, 55, 0, 53, 0, 0, 53, 0, 52, 0, 50],
    chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
    stabs: [0, 3, 6, 10],
  },
};

const BURN_MS = 1600; // how long a landed marshmallow burns
const FLIGHT_S = 1.0; // seconds in the air
const GRAVITY = 520;

export default class Marshmello extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 1500 });
  }

  attack() {
    const count = 1 + (this.startHits - this.hitsLeft);
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        if (this.mode === 'defeated') return;
        // Aim at the player, the extra ones a bit ahead and behind.
        const spread = (i - (count - 1) / 2) * 40;
        const tx = Phaser.Math.Clamp(this.player.x + spread, this.arena.left + 16, this.arena.right - 16);
        const sx = this.x + this.facing * 8;
        const sy = this.y - 12;
        const t = FLIGHT_S / Math.min(this.speedFactor, 1.4);
        const vx = (tx - sx) / t;
        const vy = (this.arena.floor - 4 - sy - 0.5 * GRAVITY * t * t) / t;
        const m = this.shoot(`${this.id}-marshmallow`, sx, sy, vx, vy, { gravity: GRAVITY, spin: 300, size: 10 });
        m.setData('lobbed', true);
      });
    }
  }

  whileMode() {
    const floor = this.arena.floor;
    for (const m of this.shots.getChildren()) {
      if (m.getData('lobbed') && m.y >= floor - 4) {
        // Lands and burns.
        m.setData('lobbed', false).setData('breaks', false);
        m.body.setVelocity(0, 0).setAllowGravity(false).setAngularVelocity(0);
        m.setAngle(0).setTexture(`${this.id}-marshmallow-fire`);
        m.y = floor - m.displayHeight / 2;
        this.scene.tweens.add({ targets: m, scaleY: m.scaleY * 1.15, duration: 120, yoyo: true, repeat: -1 });
        this.scene.time.delayedCall(BURN_MS, () => m.active && this.scene.tweens.add({ targets: m, alpha: 0, duration: 250, onComplete: () => m.destroy() }));
      }
    }
  }
}
