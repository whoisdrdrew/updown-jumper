import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// Fisher, the level 8 boss (SNAPPER). His fishing rod is his weapon (Sandro's idea): he casts, a
// bobber marks the spot where you stand, and a moment later the hook drops on it from above and
// reels back up. Keep moving. One more cast each time he's hit.
export const info = {
  id: 'fisher',
  name: 'FISHER',
  level: 8,
  // Bouncy tech house in D minor, our own placeholder.
  song: {
    bpm: 126,
    bass: [38, 0, 0, 38, 0, 38, 0, 41, 0, 38, 0, 0, 43, 0, 41, 0],
    chords: [[50, 53, 57], [50, 53, 57], [48, 52, 55], [46, 50, 53]],
    stabs: [3, 7],
  },
};

const WARN_MS = 650; // the bobber shows this long before the hook drops
const DROP_SPEED = 420;

export default class Fisher extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 2000 });
    this.line = scene.add.graphics().setDepth(5);
    this.on('destroy', () => this.line.destroy());
  }

  attack() {
    const casts = 1 + (this.startHits - this.hitsLeft);
    for (let i = 0; i < casts; i++) {
      this.scene.time.delayedCall(i * 420, () => this.cast());
    }
  }

  cast() {
    if (this.mode === 'defeated') return;
    const { scene, arena } = this;
    const x = Phaser.Math.Clamp(this.player.x, arena.left + 12, arena.right - 12);
    const bobber = scene.add.image(x, arena.floor - 3, `${this.id}-bobber`).setScale(0.5).setDepth(4);
    scene.tweens.add({ targets: bobber, y: bobber.y - 2, duration: 120, yoyo: true, repeat: -1 });
    scene.time.delayedCall(WARN_MS / Math.min(this.speedFactor, 1.3), () => {
      bobber.destroy();
      if (this.mode === 'defeated') return;
      const hook = this.shoot(`${this.id}-hook`, x, arena.floor - 150, 0, DROP_SPEED, { breaks: false, size: 8 });
      hook.setData('hook', { x, down: true });
    });
  }

  whileMode() {
    const { arena } = this;
    this.line.clear();
    for (const hook of this.shots.getChildren()) {
      const h = hook.getData('hook');
      if (!h) continue;
      if (h.down && hook.y >= arena.floor - 6) {
        h.down = false;
        hook.body.setVelocityY(0);
        this.scene.time.delayedCall(350, () => hook.active && hook.body.setVelocityY(-260));
      }
      // The fishing line, from his rod tip up out of the screen and down to the hook.
      this.line.lineStyle(1, 0xcfd8ec, 0.8);
      this.line.lineBetween(h.x, hook.y - 4, h.x, arena.floor - 200);
    }
  }

  onDefeat() {
    this.line.clear();
  }
}
