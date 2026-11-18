import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// James Hype, the level 9 boss (LIVERPOOL). He hits the mixer and sends sound waves across the
// arena in a pattern: low, high, low (jump the low ones, stay down for the high one). Then he hops
// towards you. The pattern gets longer as he loses hearts.
export const info = {
  id: 'james-hype',
  name: 'JAMES HYPE',
  level: 9,
  // Big-hook house in Bb minor, our own placeholder.
  song: {
    bpm: 125,
    bass: [46, 0, 46, 0, 0, 46, 0, 49, 0, 46, 0, 51, 0, 49, 0, 44],
    chords: [[58, 61, 65], [56, 60, 63], [54, 58, 61], [53, 56, 60]],
    stabs: [0, 6, 10],
  },
};

const WAVE_SPEED = 160;
const LOW = 7;
const HIGH = 30;

export default class JamesHype extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 2000 });
  }

  attack() {
    const pattern = ['low', 'high', 'low', 'high', 'low'].slice(0, 2 + (this.startHits - this.hitsLeft));
    pattern.forEach((kind, i) => {
      this.scene.time.delayedCall(i * 330, () => {
        if (this.mode === 'defeated') return;
        const y = this.arena.floor - (kind === 'high' ? HIGH : LOW);
        const w = this.shoot(`${this.id}-soundwave`, this.x + this.facing * 10, y, this.facing * WAVE_SPEED * this.speedFactor, 0, { breaks: true, size: 9 });
        w.setFlipX(this.facing < 0);
        this.scene.tweens.add({ targets: w, scaleY: w.scaleY * 1.3, duration: 120, yoyo: true, repeat: -1 });
      });
    });
    // The hop towards the player once the waves are out.
    this.scene.time.delayedCall(pattern.length * 330 + 150, () => {
      if (this.mode !== 'attack') return;
      this.airborne = true;
      const to = Phaser.Math.Clamp(this.x + this.facing * 50, this.arena.left + 24, this.arena.right - 24);
      this.scene.tweens.add({ targets: this, x: to, duration: 420 });
      this.scene.tweens.add({ targets: this, y: this.floorY - 30, duration: 210, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { this.airborne = false; } });
    });
  }
}
