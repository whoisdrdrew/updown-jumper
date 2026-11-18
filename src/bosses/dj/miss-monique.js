import DjBoss from '../DjBoss.js';

// Miss Monique, the level 2 boss (IBIZA). She spins a vinyl record out like a boomerang: it flies
// low (jump over it) or high (stay down), slows, and comes back to her hand. After the first hit she
// throws two, one low and one high, a beat apart.
export const info = {
  id: 'miss-monique',
  name: 'MISS MONIQUE',
  level: 2,
  // Melodic techno in A minor, our own placeholder in the spirit of her sets.
  song: {
    bpm: 124,
    bass: [45, 0, 45, 0, 0, 45, 0, 48, 45, 0, 45, 0, 52, 0, 50, 0],
    chords: [[57, 60, 64], [57, 60, 65], [55, 59, 62], [57, 60, 64]],
    stabs: [2, 11],
  },
};

const VINYL_SPEED = 190; // px/s out of her hand
const VINYL_PULL = 260; // how hard it is pulled back (px/s/s)
const LOW = 7; // height above the floor of a low throw (jump over it)
const HIGH = 30; // a high one (walk under it)

export default class MissMonique extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 1700 });
  }

  attack() {
    const throws = this.hitsLeft < 3 || this.attacks % 3 === 0 ? 2 : 1;
    for (let i = 0; i < throws; i++) {
      this.scene.time.delayedCall(i * 380, () => {
        if (this.mode === 'defeated') return;
        const high = (this.attacks + i) % 2 === 1;
        const y = this.arena.floor - (high ? HIGH : LOW);
        const v = this.shoot(`${this.id}-vinyl`, this.x + this.facing * 10, y, this.facing * VINYL_SPEED * this.speedFactor, 0, { spin: 900, breaks: false, size: 12 });
        v.body.setAccelerationX(-this.facing * VINYL_PULL);
        v.setData('back', true);
      });
    }
  }

  whileMode() {
    // A returning record that reaches her goes away again.
    for (const v of this.shots.getChildren()) {
      if (v.getData('back') && Math.sign(v.body.velocity.x) === Math.sign(this.x - v.x) && Math.abs(v.x - this.x) < 10) v.destroy();
    }
  }
}
