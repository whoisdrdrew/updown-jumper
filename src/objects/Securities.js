import { SECURITY } from '../config.js';

const ART_SCALE = 0.5; // drawn at the hero's pixel size; the poses face left

// Security bouncers (they replaced the mangos): big bald guys in sunglasses who pace back and forth
// along the floor with their arms crossed, like Goombas in Mario 3. Walking into one gets you shoved
// back (and costs a hit). Jump on his head or hit him with a rubber duck and he's knocked out.
// They start walking (toward the player) once they come on screen, turn around at walls and at the
// edge of a drop, and never leave their floor.
export default class Securities {
  constructor(scene, positions, layer) {
    this.scene = scene;
    this.layer = layer;
    this.group = scene.physics.add.group();
    for (const { x, y } of positions) {
      const guard = this.group.create(x, y, 'security-walk-0').setOrigin(0.5, 1).setScale(ART_SCALE);
      guard.body.setSize(22, 44).setOffset(5, 8); // picture pixels: 11x22 in the world, feet at the bottom
      guard.dir = 0; // standing still until he comes on screen
    }
    scene.physics.add.collider(this.group, layer);
    scene.time.addEvent({ delay: SECURITY.stepMs, loop: true, callback: () => this.step() });
  }

  // Swap the two walk frames.
  step() {
    this.group.children.each((guard) => {
      if (!guard.body.enable || !guard.dir) return;
      guard.setTexture(guard.texture.key === 'security-walk-0' ? 'security-walk-1' : 'security-walk-0');
    });
  }

  update() {
    const view = this.scene.cameras.main.worldView;
    this.group.children.each((guard) => {
      if (!guard.body.enable) return;
      const body = guard.body;
      if (!guard.dir) {
        if (guard.x > view.right + 24 || guard.x < view.left - 24) return;
        guard.dir = this.scene.player.x < guard.x ? -1 : 1;
      }
      if (body.blocked.down) {
        // Turn at a wall, or where the floor ends one step ahead.
        const aheadX = guard.x + guard.dir * (body.halfWidth + 2);
        const floor = this.layer.getTileAtWorldXY(aheadX, body.bottom + 2);
        if (body.blocked.left || body.blocked.right || !floor?.collides) guard.dir = -guard.dir;
      }
      const paused = this.scene.time.now < (guard.pausedUntil ?? 0);
      body.setVelocityX(paused ? 0 : guard.dir * SECURITY.walkSpeed);
      guard.setFlipX(guard.dir > 0);
      if (guard.y > this.scene.physics.world.bounds.bottom + 64) guard.destroy();
    });
  }

  // Coming down on his head from above (rather than walking into him).
  isStomp(player, guard) {
    return player.body.velocity.y > 0 && player.body.bottom < guard.body.top + 8;
  }

  // He shoved the player: stands his ground for a moment, facing them.
  shoved(guard, playerX) {
    guard.dir = playerX < guard.x ? -1 : 1;
    guard.pausedUntil = this.scene.time.now + SECURITY.shovePauseMs;
  }

  // Jumped on: knocked flat and gone.
  stomp(guard) {
    guard.body.enable = false;
    guard.setTexture('security-knocked');
    this.scene.tweens.add({
      targets: guard,
      scaleY: ART_SCALE * 0.3,
      scaleX: ART_SCALE * 1.3,
      alpha: 0,
      delay: 120,
      duration: 300,
      onComplete: () => guard.destroy(),
    });
  }

  // Hit by a rubber duck: knocked off his feet and out of the level, like a beaten enemy in Mario.
  knockAway(guard, dir) {
    guard.body.enable = false;
    guard.setTexture('security-knocked').setFlipX(dir < 0);
    this.scene.tweens.add({
      targets: guard,
      x: guard.x + dir * 50,
      y: guard.y - 30,
      angle: dir * 90,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: guard,
          y: guard.y + 220,
          x: guard.x + dir * 30,
          angle: dir * 200,
          duration: 700,
          ease: 'Quad.easeIn',
          onComplete: () => guard.destroy(),
        }),
    });
  }
}
