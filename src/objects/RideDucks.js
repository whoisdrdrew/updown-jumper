import { RIDE_DUCK } from '../config.js';
import { RIDE_DUCK_SCALE } from '../art/sprites.js';

// The big ride-on duck, Super Mario World Yoshi style: break the egg, the duck hops out,
// jump on to ride it. When you get hit while riding, the duck runs away instead of you losing a life.
export default class RideDucks {
  constructor(scene, layer, eggPositions) {
    this.scene = scene;
    this.eggs = scene.physics.add.staticGroup();
    for (const { x, y } of eggPositions) this.eggs.create(x, y - 7, 'egg');

    // Eggs that came out of a music-note block: they hop out, land, and hatch.
    this.poppedEggs = scene.physics.add.group();
    scene.physics.add.collider(this.poppedEggs, layer);

    this.ducks = scene.physics.add.group();
    scene.physics.add.collider(this.ducks, layer);
  }

  popEgg(x, blockTop) {
    const egg = this.poppedEggs.create(x, blockTop - 7, 'egg');
    egg.body.setVelocity(RIDE_DUCK.eggRollSpeed, -160);
  }

  breakEgg(egg) {
    if (!egg.active) return;
    const { x, y } = egg;
    egg.destroy();
    // Two shell halves fly apart.
    for (const dir of [-1, 1]) {
      const half = this.scene.add.image(x + dir * 3, y, 'egg-half').setFlipX(dir > 0);
      this.scene.tweens.add({
        targets: half,
        x: x + dir * 24,
        y: y - 14,
        angle: dir * 90,
        alpha: 0,
        duration: 500,
        onComplete: () => half.destroy(),
      });
    }
    if (this.scene.player.riding) return null; // already have a duck
    const duck = this.spawnDuck(x, y - 4, 0, 300);
    duck.body.setVelocityY(-180);
    return duck;
  }

  // dir 0 = waits for the player; dir ±1 = runs away in that direction.
  spawnDuck(x, y, dir, mountDelayMs) {
    const duck = this.ducks.create(x, y, 'big-duck').setScale(RIDE_DUCK_SCALE);
    duck.body.setSize(16, 13);
    duck.dir = dir;
    duck.mountableAt = this.scene.time.now + mountDelayMs;
    if (dir) duck.setFlipX(dir < 0);
    return duck;
  }

  flee(x, y, dir) {
    const duck = this.spawnDuck(x, y, dir, RIDE_DUCK.fleeRemountMs);
    duck.body.setVelocityY(-120);
  }

  canMount(duck) {
    return this.scene.time.now >= duck.mountableAt;
  }

  // There is only ever one big duck: once you ride it, any other duck in the level disappears
  // and eggs that are still around hatch empty.
  onMounted() {
    this.ducks.children.each((duck) => {
      duck.body.enable = false;
      duck.setVisible(false);
    });
    // Removed on the next tick, not in the middle of the physics step that detected the mount.
    this.scene.time.delayedCall(0, () => this.ducks.clear(true, true));
  }

  update() {
    this.poppedEggs.children.each((egg) => {
      if (!egg.body.blocked.down || egg.hatching) return;
      egg.hatching = true;
      egg.body.setVelocityX(0);
      this.scene.tweens.add({ targets: egg, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, repeat: 3 }); // wobble
      this.scene.time.delayedCall(RIDE_DUCK.hatchDelayMs, () => this.breakEgg(egg));
    });

    const view = this.scene.cameras.main.worldView;
    this.ducks.children.each((duck) => {
      if (!duck.dir) {
        if (duck.body.blocked.down) duck.body.setVelocityX(0);
        return;
      }
      // A fleeing duck turns around at walls and is gone once it is well off screen or falls in a pit.
      if (duck.body.blocked.left) duck.dir = 1;
      if (duck.body.blocked.right) duck.dir = -1;
      duck.setFlipX(duck.dir < 0);
      duck.body.setVelocityX(duck.dir * RIDE_DUCK.fleeSpeed);
      const farOff = duck.x < view.left - 64 || duck.x > view.right + 64;
      if (farOff || duck.y > this.scene.physics.world.bounds.bottom + 32) duck.destroy();
    });
  }
}
