import Phaser from 'phaser';

const SCALE = 0.5; // like the hero: one picture pixel is one screen pixel
const CASE_BODY = { x: 0, y: 10, w: 40, h: 43 }; // in closed.png's pixels
const MASK_DELAY_MS = 450; // how long the mask is on show in the open case before it goes on

// The suitcase in front of the start. Closed until the player lands on it; then it opens to show
// the mask, the mask goes on the player, and the case stays behind empty.
export default class Suitcase {
  constructor(scene, player, { x, y }) {
    this.scene = scene;
    this.player = player;
    this.opened = false;
    this.sprite = scene.physics.add.staticImage(x, y, 'case-closed').setOrigin(0.5, 1).setScale(SCALE);
    this.sprite.refreshBody();
    // Only the case itself is solid, not the handle on top (the art's top 10 rows) or the empty
    // column on the right of the picture.
    this.sprite.body.setSize(CASE_BODY.w * SCALE, CASE_BODY.h * SCALE, false).setOffset(CASE_BODY.x * SCALE, CASE_BODY.y * SCALE);
    // Solid while closed, so it can be landed on like a block.
    this.collider = scene.physics.add.collider(player, this.sprite, () => {
      if (player.body.touching.down && this.sprite.body.touching.up) this.open();
    });
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    const { scene, sprite, player } = this;
    this.collider.destroy();
    sprite.body.enable = false;
    player.body.setVelocityY(-220); // bounce off the lid, like a stomp
    sprite.setTexture('case-mask');
    scene.tweens.add({ targets: sprite, y: sprite.y - 2, duration: 70, yoyo: true });
    scene.time.delayedCall(MASK_DELAY_MS, () => {
      sprite.setTexture('case-open');
      player.putOnMask();
    });
  }
}
