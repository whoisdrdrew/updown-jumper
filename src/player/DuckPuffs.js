import { ITEM_SCALE } from '../art/sprites.js';

// The ride duck has no feet, so instead of Yoshi's quick little steps it squeezes out puffs of air:
// a stream of small puffs behind it while it runs, a bigger burst under it when it jumps,
// and a quick side-to-side waddle of the rider picture.
export default class DuckPuffs {
  constructor(scene) {
    this.scene = scene;
    this.nextPuffAt = 0;
  }

  // One puff of air drifting away from the duck, growing and then fading out.
  puff(x, y, dx, dy, big = false) {
    const first = big ? 1 : 0;
    const p = this.scene.add.image(x, y, 'air-puff', first).setScale(ITEM_SCALE).setDepth(1);
    this.scene.tweens.add({
      targets: p,
      x: x + dx,
      y: y + dy,
      duration: big ? 420 : 360,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        p.setFrame(Math.min(2, first + Math.floor(tween.progress * 3)));
        p.setAlpha(tween.progress < 0.6 ? 1 : 1 - (tween.progress - 0.6) / 0.4);
      },
      onComplete: () => p.destroy(),
    });
  }

  // Called every frame while riding.
  update(time, player, onGround) {
    const speed = Math.abs(player.body.velocity.x);
    const moving = onGround && speed > 10;
    // Waddle: a little tilt back and forth, faster when running. Angle doesn't move the hitbox.
    const stepMs = speed > 120 ? 70 : 110;
    player.setAngle(moving ? (Math.floor(time / stepMs) % 2 ? 4 : -4) : 0);
    if (!moving || time < this.nextPuffAt) return;
    this.nextPuffAt = time + stepMs;
    const back = -player.facing;
    this.puff(player.x + back * 10, player.body.bottom - 2, back * (10 + Math.random() * 6), -4 - Math.random() * 4);
  }

  // A burst of air under the duck as it takes off.
  jump(player) {
    const y = player.body.bottom - 2;
    for (const dir of [-1, 0, 1]) this.puff(player.x + dir * 6, y, dir * 12, dir === 0 ? 4 : 1, true);
  }
}
