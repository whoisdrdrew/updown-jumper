import DjBoss from '../DjBoss.js';

// Dom Dolla, the level 4 boss (SAN FRANDISCO). He throws disco balls that bounce across the arena
// (Sandro's idea): time a jump between the bounces or run under a high one. Two at a time once he's hurt.
export const info = {
  id: 'dom-dolla',
  name: 'DOM DOLLA',
  level: 4,
  // Groovy tech house in G minor, our own placeholder.
  song: {
    bpm: 126,
    bass: [43, 0, 43, 46, 0, 43, 0, 41, 43, 0, 50, 0, 48, 0, 46, 0],
    chords: [[55, 58, 62], [53, 57, 60], [51, 55, 58], [53, 57, 60]],
    stabs: [6, 14],
  },
};

const ROLL = 95; // sideways speed of a ball, px/s
const BOUNCE = 300; // how high it bounces (launch speed)
const GRAVITY = 700;

export default class DomDolla extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 1400 });
  }

  attack() {
    const count = this.hitsLeft < this.startHits ? 2 : 1;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 650, () => {
        if (this.mode === 'defeated') return;
        const b = this.shoot(`${this.id}-discoball`, this.x + this.facing * 10, this.y - 10, this.facing * ROLL * this.speedFactor, -160,
          { gravity: GRAVITY, spin: 200, size: 14 });
        b.setData('bounces', true);
      });
    }
  }

  whileMode() {
    const floor = this.arena.floor;
    for (const b of this.shots.getChildren()) {
      if (b.getData('bounces') && b.y >= floor - 8 && b.body.velocity.y > 0) {
        b.y = floor - 8;
        b.body.setVelocityY(-BOUNCE);
      }
    }
  }
}
