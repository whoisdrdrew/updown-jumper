import Phaser from 'phaser';
import Controls from '../player/Controls.js';
import BossBeat from '../audio/BossBeat.js';
import MenuMusic from '../audio/MenuMusic.js';
import { SONGS, SONG_BPM } from '../audio/songs.js';
import heroIdle from '../art/hero/idle.png';
import heroJump from '../art/hero/jump.png';
import solomunPhotoPose from '../art/solomun/photo-pose.png';
import { touch, showTouchControls } from '../touch/TouchControls.js';
import { addExitButton, preloadExitButton } from '../objects/ExitButton.js';
import VipFx from '../objects/VipFx.js';
import { preloadVipFx } from '../art/vipFx.js';
import {
  preloadAfterparty, DJS, DJ_SPOTS, ROOM_FLOOR, BOOTH_SPRITE, BOOTH_GLOW, BOOTH_DJ, BOOTH_STEPS,
} from '../art/afterparty.js';

const FONT = '"Press Start 2P", monospace';
const GOLD = '#ffd34a';
const BORIS_AT = { x: 320, y: 348 }; // on the dance floor, in front of the stage
// Boris can DJ too: picked like the others, he goes up and plays his 5 tracks (the menu songs) one
// after another.
// He's shorter than the others, so at the booth he stands on a crate (lift: picture pixels higher).
const BORIS_DJ = { name: 'BORIS', texture: 'home-boris', songs: SONGS, lift: 12 };
// The CO2 cannons either side of the stage, like in the VIP room.
const CANNON_XS = [188, 452];
const WALK_SPEED = 90; // picture pixels a second, for a DJ walking to or from the booth

// The Afterparty, unlocked by the ticket once all 10 golden nuggets are won. Not a level: a room
// where all the DJs (the end bosses of the 10 levels) hang out, and you pick who plays at the booth.
// Left/right (or tap) moves the highlight over the DJs' spots; Space, up, Enter (or a second tap)
// sends that DJ up the steps to the booth and his music starts. Boris (on the dance floor) is one of
// the DJs you can pick too. Picking the DJ who is playing sends
// him back down and the music stops. EXIT or Esc goes back to the studio.
// The room is drawn for the 640x360 canvas, so this scene isn't zoomed, like the home screen.
export default class AfterpartyScene extends Phaser.Scene {
  constructor() {
    super('afterparty');
  }

  preload() {
    preloadAfterparty(this);
    preloadVipFx(this);
    preloadExitButton(this);
    this.load.image('home-boris', heroIdle);
    this.load.image('home-boris-jump', heroJump);
    if (!this.textures.exists('solomun-photo-pose')) this.load.image('solomun-photo-pose', solomunPhotoPose);
  }

  create() {
    this.ui = { x: 0, y: 0 };
    this.add.image(0, 0, 'afterparty-room').setOrigin(0);
    showTouchControls(false);
    this.events.once('shutdown', () => showTouchControls(true));
    this.controls = new Controls(this);
    this.controls.jumpJustPressed();
    this.controls.shootJustPressed();

    this.booth = this.add.image(BOOTH_SPRITE.x, BOOTH_SPRITE.y, 'afterparty-booth').setOrigin(0).setDepth(BOOTH_DJ.y + 1);
    this.glow = this.add.image(BOOTH_GLOW.x, BOOTH_GLOW.y, 'afterparty-glow-0').setOrigin(0).setDepth(BOOTH_DJ.y + 2).setVisible(false);
    this.playing = null; // index of the DJ at the booth
    this.busy = false; // a DJ is walking

    // Each spot: a ring on the floor, the DJ standing on it (or a "?" for the DJs still to come).
    this.spots = DJ_SPOTS.map((at, i) => {
      const dj = DJS[i];
      const ring = this.add.ellipse(at.x, at.y, 28, 7).setStrokeStyle(1, 0xe0b45c, 0.6).setDepth(at.y - 1);
      const sprite = dj
        ? this.add.image(at.x, at.y, dj.texture).setOrigin(0.5, 1).setDepth(at.y)
        : this.add.text(at.x, at.y - 14, '?', { fontFamily: FONT, fontSize: '16px', color: '#6a5a88' }).setOrigin(0.5).setDepth(at.y);
      const hit = this.add.zone(at.x, at.y - 30, 48, 64).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => (this.selected === i ? this.pick() : this.select(i)));
      if (dj) this.breathe(sprite);
      return { at, dj, ring, sprite };
    });

    // Boris, the last spot: left/right goes from the last DJ to him and round again.
    this.boris = this.add.image(BORIS_AT.x, BORIS_AT.y, 'home-boris').setOrigin(0.5, 1).setDepth(BORIS_AT.y);
    this.breathe(this.boris);
    const borisSpot = this.spots.length;
    this.add.ellipse(BORIS_AT.x, BORIS_AT.y, 28, 7).setStrokeStyle(1, 0xe0b45c, 0.6).setDepth(BORIS_AT.y - 1);
    this.add.zone(BORIS_AT.x, BORIS_AT.y - 30, 40, 64).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => (this.selected === borisSpot ? this.pick() : this.select(borisSpot)));
    this.spots.push({ at: BORIS_AT, dj: BORIS_DJ, sprite: this.boris });

    // The CO2 cannons from the VIP room, either side of the stage: they go off every minute.
    this.fx = new VipFx(this, 0);
    this.fx.addCannons(ROOM_FLOOR, CANNON_XS, { scale: 1, depth: ROOM_FLOOR, blastDepth: ROOM_FLOOR - 2 });

    this.addTexts();
    this.selectRing = this.add.ellipse(0, 0, 34, 10).setStrokeStyle(2, 0xffd34a).setDepth(400);
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        this.blink = !this.blink;
        this.selectRing.setAlpha(this.blink ? 1 : 0.45);
      },
    });
    this.select(0);

    this.beats = {}; // one BossBeat per song, made when first needed
    this.menuMusic = new MenuMusic(); // for the DJs who play a recorded song (Boris)
    this.events.once('shutdown', () => {
      Object.values(this.beats).forEach((b) => b.stop());
      this.menuMusic.stop();
    });

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.pick());
    for (const [key, step] of [['LEFT', -1], ['RIGHT', 1]]) {
      kb.on(`keydown-${key}`, () => this.select(Phaser.Math.Wrap(this.selected + step, 0, this.spots.length)));
    }
    addExitButton(this, () => this.scene.start('home'), 1);
    this.cameras.main.fadeIn(250, 18, 8, 28);
  }

  update() {
    const c = this.controls;
    c.downJustPressed();
    if (c.jumpJustPressed() | c.shootJustPressed() | c.upJustPressed()) this.pick();
  }

  addTexts() {
    this.add.text(320, 14, 'AFTERPARTY', { fontFamily: FONT, fontSize: '12px', color: GOLD })
      .setOrigin(0.5, 0).setShadow(2, 2, '#12081c', 0, false, true).setDepth(500);
    this.nameText = this.add.text(320, 34, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff' })
      .setOrigin(0.5, 0).setShadow(1, 1, '#12081c', 0, false, true).setDepth(500);
    this.hintText = this.add.text(320, 48, '', { fontFamily: FONT, fontSize: '8px', color: GOLD })
      .setOrigin(0.5, 0).setShadow(1, 1, '#12081c', 0, false, true).setDepth(500);
    this.tweens.add({ targets: this.hintText, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }

  select(i) {
    this.selected = i;
    const { at, dj } = this.spots[i];
    this.selectRing.setPosition(at.x, at.y);
    // Boris looks at the DJ you pick (he faces right in the art), unless he's busy being one.
    const borisBusy = this.spots[this.playing]?.sprite === this.boris || (this.busy && this.boris.x !== BORIS_AT.x);
    if (!borisBusy && dj !== BORIS_DJ) this.boris.setFlipX(at.x < BORIS_AT.x);
    this.showHint();
  }

  showHint() {
    const dj = this.spots[this.selected].dj;
    const tap = touch.enabled ? 'TAP' : 'ENTER';
    const playing = this.playing === this.selected;
    let name = dj ? dj.name : `DJ ${this.selected + 1}`;
    if (playing) name += dj.songs && this.track ? ` PLAYS ${this.track}` : ' IS PLAYING';
    this.nameText.setText(name);
    if (!dj) this.hintText.setText('COMING SOON');
    else if (playing) this.hintText.setText(`${tap} TO STOP`);
    else this.hintText.setText(`${tap}: SEND TO THE BOOTH`);
  }

  // Send the picked DJ to the booth (the one playing goes back to his spot), or stop the one playing.
  async pick() {
    const i = this.selected;
    const spot = this.spots[i];
    if (this.busy) return;
    if (!spot.dj) {
      this.tweens.add({ targets: spot.sprite, x: spot.at.x + 2, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.busy = true;
    const was = this.playing;
    if (was !== null) {
      this.stopMusic();
      await this.walkDown(was);
    }
    if (was !== i) {
      await this.walkUp(i);
      this.playMusic(i);
    }
    this.busy = false;
    this.showHint();
  }

  // Across the floor to the foot of the steps, then up behind the booth.
  async walkUp(i) {
    const { sprite } = this.spots[i];
    await this.walk(sprite, BOOTH_STEPS.x, BOOTH_STEPS.y);
    sprite.setDepth(BOOTH_DJ.y);
    await this.walk(sprite, BOOTH_DJ.x, this.boothY(i));
    sprite.setFlipX(false);
    this.playing = i;
  }

  async walkDown(i) {
    const { sprite, at } = this.spots[i];
    this.playing = null;
    await this.walk(sprite, BOOTH_STEPS.x, BOOTH_STEPS.y);
    sprite.setDepth(BOOTH_STEPS.y);
    await this.walk(sprite, at.x, at.y);
    sprite.setDepth(at.y).setFlipX(false);
  }

  // Feet of DJ i when he plays at the booth.
  boothY(i) {
    return BOOTH_DJ.y - (this.spots[i].dj.lift ?? 0);
  }

  // Standing about, breathing.
  breathe(sprite) {
    sprite.breath = this.tweens.add({ targets: sprite, scaleY: 0.97, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  walk(sprite, x, y) {
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, x, y);
    if (distance < 1) return Promise.resolve();
    sprite.breath?.stop();
    sprite.setScale(1);
    sprite.setFlipX(x < sprite.x);
    const bob = this.tweens.add({ targets: sprite, scaleY: 0.96, duration: 120, yoyo: true, repeat: -1 });
    return new Promise((resolve) => this.tweens.add({
      targets: sprite,
      x,
      y,
      duration: (distance / WALK_SPEED) * 1000,
      onUpdate: () => sprite.setDepth(sprite.depth === BOOTH_DJ.y ? BOOTH_DJ.y : sprite.y),
      onComplete: () => {
        bob.stop();
        sprite.setScale(1);
        this.breathe(sprite);
        resolve();
      },
    }));
  }

  // The DJ's song, the booth's lights blinking, the DJ and Boris bobbing to the beat.
  playMusic(i) {
    const { dj, sprite } = this.spots[i];
    let beatMs = 60000 / SONG_BPM;
    if (dj.songs) {
      this.menuMusic.playList(dj.songs.map((song) => song.url), (n) => {
        this.track = dj.songs[n].name;
        this.showHint();
      });
    } else {
      const beat = (this.beats[dj.beat] ??= new BossBeat(this.sound.context));
      beat.start();
      beatMs = 60000 / beat.song.bpm;
    }
    this.glow.setVisible(true);
    let n = 0;
    this.glowTimer = this.time.addEvent({ delay: beatMs / 2, loop: true, callback: () => this.glow.setTexture(`afterparty-glow-${(n = 1 - n)}`) });
    this.dance = [this.tweens.add({ targets: sprite, y: this.boothY(i) + 1, duration: beatMs / 2, yoyo: true, repeat: -1 })];
    if (sprite !== this.boris) {
      // Boris dances on the floor.
      this.dance.push(this.tweens.add({ targets: this.boris, y: BORIS_AT.y - 3, duration: beatMs / 2, yoyo: true, repeat: -1, ease: 'Quad.easeOut' }));
    }
  }

  stopMusic() {
    Object.values(this.beats).forEach((b) => b.stop());
    this.menuMusic.stop();
    this.track = null;
    this.glowTimer?.remove();
    this.glow.setVisible(false);
    this.dance?.forEach((t) => t.stop());
    this.dance = null;
    if (this.boris.x === BORIS_AT.x) this.boris.y = BORIS_AT.y;
    if (this.playing !== null) this.spots[this.playing].sprite.y = this.boothY(this.playing);
  }
}
