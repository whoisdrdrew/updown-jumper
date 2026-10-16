import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ZOOM } from '../config.js';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import { createSprites, preloadSprites } from '../art/sprites.js';
import { INTRO_SCALE, preloadIntro } from '../art/intro.js';
import { hasSeenIntro, markIntroSeen } from '../progress.js';

const FONT = '"Press Start 2P", monospace';
const FLOOR = 150; // floor line in both rooms (picture y 300)
const TYPE_MS = 35; // dialog text types out one letter at a time
const GOLD = '#ffd34a';

// The story before level 1, played like the start of a Mario game: the player walks Boris, and
// when he reaches certain spots the game takes over and the story plays out.
//   bedroom: Boris wakes up, "Where is Ginger?", walk out of the door on the right.
//   outside (the stable): walk up to the horse, the dialog, the note from the Guestlist King, storm off.
// It can't be skipped the first time; once level 1 has been reached a SKIP button shows.
// The two rooms are this one scene, restarted with { room }.
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('intro');
  }

  preload() {
    preloadSprites(this);
    preloadIntro(this);
  }

  create(data) {
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    createSprites(this);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT, true, true, false, true); // no ceiling

    this.controls = new Controls(this);
    this.playing = false; // true while the player steers Boris
    this.walk = null; // a scripted walk: { x, speed, done }
    this.waitingForPress = null;
    this.pressed = false;
    this.followers = [];
    this.input.on('pointerdown', () => { this.pressed = true; });
    this.input.keyboard.on('keydown-ENTER', () => { this.pressed = true; });
    this.input.keyboard.on('keydown-S', () => this.scene.restart({ room: 'bedroom' })); // S: start the story over

    // A floor to stand on; the rooms are one screen each.
    const floor = this.add.zone(GAME_WIDTH / 2, FLOOR + 8, GAME_WIDTH * 2, 16);
    this.physics.add.existing(floor, true);
    this.player = new Player(this, GAME_WIDTH / 2, 0, this.controls);
    this.physics.add.collider(this.player, floor);
    this.hidePlayer(); // until the room's script brings him in

    if (hasSeenIntro()) this.addSkipButton();
    cam.fadeIn(400, 0, 0, 0);
    if (data?.room === 'outside') this.outside();
    else this.bedroom();
  }

  update(time, delta) {
    const player = this.player;
    const onGround = player.body.blocked.down;
    if (this.playing) {
      player.update(time, delta);
    } else {
      // The script is in charge: presses only advance dialog, and don't pile up for later.
      const c = this.controls;
      if (c.jumpJustPressed() | c.shootJustPressed()) this.pressed = true;
      if (this.walk) {
        const dx = this.walk.x - player.x;
        if (Math.abs(dx) < 2) {
          player.body.setVelocityX(0);
          const { done } = this.walk;
          this.walk = null;
          done();
        } else {
          player.body.setVelocityX(Math.sign(dx) * this.walk.speed);
          player.setFlipX(dx < 0);
        }
      } else if (onGround) {
        player.body.setVelocityX(0);
      }
      player.body.setGravityY(0);
      player.animate(time, onGround);
    }
    if (this.pressed && this.waitingForPress) {
      const resolve = this.waitingForPress;
      this.waitingForPress = null;
      resolve();
    }
    this.pressed = false;
    for (const f of this.followers) f();
  }

  // ---------------------------------------------------------------- the rooms

  async bedroom() {
    const img = (x, y, key, ox = 0, oy = 0) => this.add.image(x, y, `intro-${key}`).setOrigin(ox, oy).setScale(INTRO_SCALE);
    img(0, 0, 'bedroom');
    const door = img(278, 75, 'door-closed');
    img(26, 98, 'bed-back');
    const sleeper = img(36, 137, 'boris-sleep', 0, 1);
    img(26, 98, 'bed-front');
    const zzz = img(46, 126, 'zzz', 0, 1);
    this.tweens.add({ targets: zzz, y: 120, alpha: { from: 1, to: 0.2 }, duration: 900, repeat: -1 });

    await this.wait(2000);
    // Wakes up, sits up and stretches.
    zzz.destroy();
    sleeper.setTexture('intro-boris-wake').setPosition(40, 140);
    const exclaim = img(51, 114, 'exclaim', 0.5, 1).setScale(0);
    this.tweens.add({ targets: exclaim, scale: INTRO_SCALE, duration: 150, ease: 'Back.easeOut' });
    await this.wait(1100);

    // Jumps out of bed.
    exclaim.destroy();
    sleeper.destroy();
    const player = this.player;
    this.showPlayer(56, 140);
    player.body.setVelocity(130, -230);
    await this.until(() => player.body.blocked.down);
    await this.wait(250);
    const bubble = this.bubble('Where is Ginger?', player);
    await this.wait(900);
    this.playing = true;
    this.time.delayedCall(1800, () => bubble.destroy());

    // Out of the door on the right.
    await this.until(() => player.x > 284);
    this.takeOver();
    door.setTexture('intro-door-open');
    await this.walkTo(296, 60);
    await this.fadeOut(400);
    this.scene.restart({ room: 'outside' });
  }

  async outside() {
    const img = (x, y, key, ox = 0, oy = 0) => this.add.image(x, y, `intro-${key}`).setOrigin(ox, oy).setScale(INTRO_SCALE);
    img(0, 0, 'stable'); // the horse's stable, indoors
    img(20, 75, 'villa-door-open');
    const horse = img(232, FLOOR, 'horse', 0.5, 1);
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        horse.setTexture('intro-horse-blink');
        this.time.delayedCall(140, () => horse.setTexture('intro-horse'));
      },
    });
    const note = img(206, FLOOR + 4, 'note', 0.5, 1);

    // Boris steps out of the villa, then it's the player's turn again.
    const player = this.player;
    this.showPlayer(36, FLOOR);
    await this.walkTo(72, 70);
    this.playing = true;

    // Walking up to the horse starts the dialog.
    await this.until(() => player.x > 168);
    this.takeOver();
    player.setFlipX(false);
    await this.wait(300);
    await this.say('boris', 'BORIS', 'Do you know where Ginger is?');
    this.tweens.add({ targets: horse, x: horse.x + 1, duration: 60, yoyo: true, repeat: 5 });
    await this.say('horse', 'HORSE', "I can't speak. I'm a horse.");
    await this.say('boris', 'BORIS', 'Right, forgot about that.');

    // He notices the note and picks it up.
    const exclaim = this.add.image(player.x, player.y - 16, 'intro-exclaim').setOrigin(0.5, 1).setScale(INTRO_SCALE);
    await this.wait(600);
    exclaim.destroy();
    await this.walkTo(196, 50);
    player.setFlipX(false);
    this.pose('boris-crouch');
    await this.wait(500);
    note.destroy();
    this.pose('boris-read');
    await this.wait(700);
    await this.letter();

    // Angry: red in the face, steam out of his ears.
    const angry = this.pose('boris-angry');
    this.cameras.main.shake(300, 0.004);
    this.tweens.add({ targets: angry, x: angry.x + 1, duration: 50, yoyo: true, repeat: 7 });
    const steam = this.time.addEvent({ delay: 220, loop: true, callback: () => this.steamPuff(angry) });
    this.steamPuff(angry);
    await this.wait(900);
    await this.say('boris-angry', 'BORIS', "Now you're on MY list, my friend.");
    steam.remove();

    // Storms out of frame, and level 1 begins.
    this.unpose();
    player.setCollideWorldBounds(false);
    await this.walkTo(GAME_WIDTH + 30, 170);
    await this.fadeOut(300);
    markIntroSeen();
    this.scene.start('game');
  }

  // ---------------------------------------------------------------- script helpers

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // Resolves on the first frame the condition holds.
  until(condition) {
    return new Promise((resolve) => {
      const check = () => {
        if (!condition()) return;
        this.events.off('update', check);
        resolve();
      };
      this.events.on('update', check);
    });
  }

  waitForPress() {
    return new Promise((resolve) => { this.waitingForPress = resolve; });
  }

  hidePlayer() {
    this.player.setVisible(false);
    this.player.body.enable = false;
  }

  // Bring Boris in with his feet at (x, bottom).
  showPlayer(x, bottom) {
    const { player } = this;
    player.body.enable = true;
    player.setVisible(true);
    player.body.reset(x, bottom - player.displayHeight / 2);
  }

  // The game takes the controls back from the player.
  takeOver() {
    this.playing = false;
    this.player.body.setVelocityX(0);
  }

  walkTo(x, speed) {
    return new Promise((resolve) => { this.walk = { x, speed, done: resolve }; });
  }

  fadeOut(ms) {
    return new Promise((resolve) => {
      this.cameras.main.fadeOut(ms, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', resolve);
    });
  }

  // Show Boris in one of the story poses (feet on the floor where he stands) instead of the
  // game sprite.
  pose(key) {
    this.unpose();
    const { player } = this;
    player.setVisible(false);
    this.posed = this.add.image(player.x, player.body.bottom, `intro-${key}`)
      .setOrigin(0.5, 1).setScale(INTRO_SCALE).setFlipX(player.flipX).setDepth(2);
    return this.posed;
  }

  unpose() {
    this.posed?.destroy();
    this.posed = null;
    this.player.setVisible(true);
  }

  steamPuff(target) {
    for (const side of [-1, 1]) {
      const puff = this.add.sprite(target.x + side * 6, target.y - target.displayHeight + 4, 'air-puff', 0)
        .setScale(INTRO_SCALE).setDepth(3);
      this.tweens.add({
        targets: puff,
        x: puff.x + side * 6,
        y: puff.y - 10,
        alpha: 0,
        duration: 500,
        onUpdate: (tw) => puff.setFrame(Math.min(2, Math.floor(tw.progress * 3))),
        onComplete: () => puff.destroy(),
      });
    }
  }

  // ---------------------------------------------------------------- dialog

  text(x, y, value, color, wrap) {
    return this.add
      .text(x, y, value, {
        fontFamily: FONT,
        fontSize: '4px',
        color,
        lineSpacing: 3,
        wordWrap: wrap ? { width: wrap } : undefined,
      })
      .setResolution(ZOOM)
      .setDepth(21);
  }

  // A line of dialog in the box at the top of the screen. It types out; a press shows it all,
  // the next press moves on.
  async say(portrait, name, line) {
    const box = this.add.nineslice(10, 14, 'intro-dialog-frame', null, 600, 84, 8, 8, 8, 8)
      .setOrigin(0).setScale(INTRO_SCALE).setDepth(20);
    const face = this.add.image(17, 24, `intro-portrait-${portrait}`).setOrigin(0).setScale(INTRO_SCALE).setDepth(21);
    const label = this.text(46, 23, name, GOLD);
    const body = this.text(46, 32, '', '#ffffff', 256);
    const parts = [box, face, label, body];
    await this.typeOut(body, line);
    const arrow = this.add.image(303, 52, 'intro-next-arrow-0').setOrigin(1, 1).setScale(INTRO_SCALE).setDepth(21);
    const blink = this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => arrow.setTexture(arrow.texture.key.endsWith('0') ? 'intro-next-arrow-1' : 'intro-next-arrow-0'),
    });
    await this.waitForPress();
    blink.remove();
    [...parts, arrow].forEach((p) => p.destroy());
  }

  // Types the text into a text object; a press finishes it at once.
  typeOut(target, value) {
    return new Promise((resolve) => {
      let shown = 0;
      const finish = () => {
        timer.remove();
        target.setText(value);
        this.waitingForPress = null;
        resolve();
      };
      const timer = this.time.addEvent({
        delay: TYPE_MS,
        loop: true,
        callback: () => {
          shown += 1;
          target.setText(value.slice(0, shown));
          if (shown >= value.length) finish();
        },
      });
      this.waitingForPress = finish;
    });
  }

  // A speech bubble over someone's head that follows them around.
  bubble(value, who) {
    const label = this.text(0, 0, value, '#ffffff').setOrigin(0.5, 1);
    const w = label.width + 10;
    const h = label.height + 8;
    const frame = this.add.nineslice(0, 0, 'intro-dialog-frame', null, w / INTRO_SCALE, h / INTRO_SCALE, 8, 8, 8, 8)
      .setOrigin(0.5, 1).setScale(INTRO_SCALE).setDepth(20);
    const tail = this.add.image(0, 0, 'intro-bubble-tail').setOrigin(0.5, 0).setScale(INTRO_SCALE).setDepth(21);
    const follow = () => {
      const x = Phaser.Math.Clamp(who.x, w / 2 + 2, GAME_WIDTH - w / 2 - 2);
      const bottom = who.body.top - 12;
      frame.setPosition(x, bottom);
      label.setPosition(x, bottom - 4);
      tail.setPosition(who.x, bottom - 1);
    };
    follow();
    this.followers.push(follow);
    return {
      destroy: () => {
        this.followers = this.followers.filter((f) => f !== follow);
        [frame, label, tail].forEach((p) => p.destroy());
      },
    };
  }

  // The note, close up, over the darkened scene.
  async letter() {
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0614, 0.65).setOrigin(0).setDepth(20);
    const paper = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'intro-letter').setScale(0.1).setDepth(20);
    await new Promise((resolve) =>
      this.tweens.add({ targets: paper, scale: INTRO_SCALE, duration: 250, ease: 'Back.easeOut', onComplete: resolve }),
    );
    const left = paper.x - paper.displayWidth / 2 + 15;
    const top = paper.y - paper.displayHeight / 2 + 15;
    const body = this.text(left, top, '', '#3a2418', 150);
    const sign = this.text(left + 12, top + 66, '', '#8c1c3c');
    await this.typeOut(body, "Shame you couldn't make it.\nI took your girlfriend instead.\nShe's already backstage.\n\nWant her back?\nCome and get her.");
    await this.typeOut(sign, '- The Guestlist King');
    await this.waitForPress();
    [shade, paper, body, sign].forEach((p) => p.destroy());
  }

  // ---------------------------------------------------------------- skip

  addSkipButton() {
    const button = this.add.image(GAME_WIDTH - 4, 3, 'intro-skip-button').setOrigin(1, 0).setScale(INTRO_SCALE)
      .setDepth(30).setInteractive({ useHandCursor: true });
    const skip = () => {
      this.input.enabled = false;
      this.scene.start('game');
    };
    button.on('pointerdown', (_p, _x, _y, event) => {
      event.stopPropagation();
      skip();
    });
    this.input.keyboard.once('keydown-ESC', skip);
  }
}
