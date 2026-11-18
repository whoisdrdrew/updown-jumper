import Phaser from 'phaser';
import DjBoss from '../DjBoss.js';

// Charlotte de Witte, the level 7 boss (GHENT). In the castle, framed by bare stone, with a single
// red light pulsing behind her (Sandro's reveal, world picture 06). She leaps high and slams the
// floor: a shockwave runs along the floor both ways. Jump over it. Stomp her while she gets up.
export const info = {
  id: 'charlotte-de-witte',
  name: 'CHARLOTTE DE WITTE',
  level: 7,
  // Hard, dark acid techno in F minor, our own placeholder.
  song: {
    bpm: 136,
    bass: [41, 0, 41, 41, 0, 41, 0, 44, 41, 0, 41, 41, 0, 46, 0, 44],
    chords: [[53, 56, 60], [53, 56, 60], [51, 56, 60], [49, 53, 56]],
    stabs: [14],
  },
};

const LEAP = 70; // how high she jumps (px)
const WAVE_SPEED = 150;

export default class CharlotteDeWitte extends DjBoss {
  constructor(scene, arena, tuning) {
    super(scene, arena, tuning, info.id, { attackMs: 1500, restMs: 900 });
    // The red light behind her: a soft glow on the back wall that pulses with the beat.
    this.redLight = scene.add.circle(arena.centerX, arena.floor - 70, 60, 0xdb1a2a, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
    this.redCore = scene.add.circle(arena.centerX, arena.floor - 70, 22, 0xff3a3a, 0.3)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
    scene.tweens.add({ targets: [this.redLight, this.redCore], alpha: { from: 1, to: 0.25 }, duration: 60000 / 136, yoyo: true, repeat: -1 });
    this.on('destroy', () => { this.redLight.destroy(); this.redCore.destroy(); });
  }

  attack() {
    const { scene } = this;
    // Leap towards the player, then slam down.
    const tx = Phaser.Math.Clamp(this.player.x, this.arena.left + 30, this.arena.right - 30);
    this.airborne = true;
    scene.tweens.add({ targets: this, x: tx, duration: 600 / this.speedFactor ** 0.5, ease: 'Sine.easeInOut' });
    scene.tweens.add({
      targets: this,
      y: this.floorY - LEAP,
      duration: 300 / this.speedFactor ** 0.5,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.airborne = false;
        if (this.mode === 'defeated') return;
        this.y = this.floorY;
        scene.cameras.main.shake(140, 0.006);
        // One wave each way; two in a row once she's down to her last hearts.
        const rows = this.hitsLeft <= 2 ? 2 : 1;
        for (let r = 0; r < rows; r++) {
          scene.time.delayedCall(r * 420, () => {
            if (this.mode === 'defeated') return;
            for (const dir of [-1, 1]) {
              const w = this.shoot(`${this.id}-shockwave`, this.x + dir * 8, this.arena.floor - 4, dir * WAVE_SPEED * this.speedFactor, 0, { breaks: false, size: 7 });
              w.setFlipX(dir < 0).setOrigin(0.5, 0.5);
              w.y = this.arena.floor - w.displayHeight / 2;
            }
          });
        }
      },
    });
  }

  onDefeat() {
    this.airborne = false;
    this.scene.tweens.add({ targets: [this.redLight, this.redCore], alpha: 0, duration: 800 });
  }
}
