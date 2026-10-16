import Phaser from 'phaser';
import Controls from '../player/Controls.js';
import { touch, showTouchControls } from '../touch/TouchControls.js';
import { hasSeenIntro, levelsDone, levelPhoto } from '../progress.js';
import {
  preloadHome, cardKey, LEVEL_COUNT, CARD_AT, CARD_WINDOW, SELECT_OFFSET, MONITOR_SCREEN, TITLE_PANEL,
} from '../art/home.js';

const FONT = '"Press Start 2P", monospace';
const GOLD = '#ffd34a';
// The levels that exist so far; the others can be unlocked but say "coming soon".
const BUILT = new Set([1]);

// The home screen and level menu: Boris's music studio. The 10 levels hang as instant photos on two
// strings. Finished levels show their winner photo from Felix, the next level has a play arrow, and
// the rest are locked, so you see as many photos as levels you have reached.
// Left/right (or tap a card) picks a level; up, Space or Enter (or a second tap) plays it. S plays
// the story.
// The studio art is drawn for the 640x360 canvas, so this scene isn't zoomed.
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('home');
  }

  preload() {
    preloadHome(this);
  }

  create(data) {
    this.add.image(0, 0, 'home-studio').setOrigin(0);
    // On a phone the cards are tapped directly: tap one to pick it, tap it again (or the monitor) to play.
    showTouchControls(false);
    this.events.once('shutdown', () => showTouchControls(true));
    this.controls = new Controls(this);
    this.controls.jumpJustPressed();
    this.controls.shootJustPressed();
    this.starting = false;

    const done = levelsDone();
    this.reachable = Math.min(done + 1, LEVEL_COUNT); // finished levels and the next one can be picked
    this.cards = [];
    for (let level = 1; level <= LEVEL_COUNT; level++) this.addCard(level, done, data?.justDone === level);

    this.addTitle();
    this.addHint();
    this.selectFrame = this.add.image(0, 0, 'home-select-0').setOrigin(0).setDepth(3);
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => this.selectFrame.setTexture(this.selectFrame.texture.key === 'home-select-0' ? 'home-select-1' : 'home-select-0'),
    });
    this.select(Phaser.Math.Clamp(data?.justDone ? data.justDone + 1 : this.reachable, 1, this.reachable));

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.play());
    kb.on('keydown-S', () => this.start('intro', { room: 'bedroom' }));
    this.held = { left: false, right: false };
    this.cameras.main.fadeIn(250, 18, 8, 28);
  }

  update() {
    if (this.starting) return;
    for (const [dir, step] of [['left', -1], ['right', 1]]) {
      const down = this.controls[dir]();
      if (down && !this.held[dir]) this.select(Phaser.Math.Clamp(this.selected + step, 1, this.reachable));
      this.held[dir] = down;
    }
    if (this.controls.jumpJustPressed() | this.controls.shootJustPressed()) this.play();
  }

  addCard(level, done, isNew) {
    const [x, y] = CARD_AT[level - 1];
    const state = level <= done ? 'done' : level === done + 1 ? 'open' : 'locked';
    const card = this.add.image(x, y, cardKey(level, state)).setOrigin(0).setDepth(2);
    this.cards[level] = card;
    if (state !== 'locked') {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => (this.selected === level ? this.play() : this.select(level)));
    }
    if (state !== 'done') return;
    // Blank photo paper, in case there's no saved photo for it.
    this.add.rectangle(x + CARD_WINDOW.x, y + CARD_WINDOW.y, CARD_WINDOW.w, CARD_WINDOW.h, 0xf4efe4).setOrigin(0).setDepth(0.5);
    const photo = levelPhoto(level);
    if (!photo) return;
    // The winner photo, under the card's transparent window. A just-finished level's photo develops.
    const key = `home-photo-${level}`;
    const show = () => {
      const img = this.add.image(x + CARD_WINDOW.x, y + CARD_WINDOW.y, key).setOrigin(0).setDepth(1)
        .setDisplaySize(CARD_WINDOW.w, CARD_WINDOW.h);
      if (isNew) {
        img.setAlpha(0);
        this.tweens.add({ targets: img, alpha: 1, delay: 500, duration: 1200 });
        this.tweens.add({ targets: card, angle: { from: -8, to: 0 }, duration: 700, delay: 300, ease: 'Back.easeOut' });
      }
    };
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.once(`addtexture-${key}`, show);
    this.textures.addBase64(key, photo);
  }

  // The game's name on the empty panel above the monitor.
  addTitle() {
    const cx = TITLE_PANEL.x + TITLE_PANEL.w / 2;
    const cy = TITLE_PANEL.y + TITLE_PANEL.h / 2;
    this.add.text(cx, cy, 'UP DOWN\nJUMPER', { fontFamily: FONT, fontSize: '12px', color: GOLD, align: 'center', lineSpacing: 10 })
      .setOrigin(0.5).setShadow(2, 2, '#12081c', 0, false, true).setDepth(2);
  }

  // A short hint on the monitor, over a dark box: which level, and how to play it.
  addHint() {
    const cx = MONITOR_SCREEN.x + MONITOR_SCREEN.w / 2;
    const cy = MONITOR_SCREEN.y + MONITOR_SCREEN.h / 2;
    this.add.rectangle(cx, cy, MONITOR_SCREEN.w - 6, 30, 0x12081c, 0.88).setDepth(2)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.play());
    const style = { fontFamily: FONT, fontSize: '8px', align: 'center' };
    this.hintTop = this.add.text(cx, cy - 6, '', { ...style, color: GOLD }).setOrigin(0.5).setDepth(3);
    this.hintBottom = this.add.text(cx, cy + 7, '', { ...style, color: '#ffffff' }).setOrigin(0.5).setDepth(3);
    this.tweens.add({ targets: this.hintBottom, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }

  select(level) {
    this.selected = level;
    const [x, y] = CARD_AT[level - 1];
    this.selectFrame.setPosition(x + SELECT_OFFSET.x, y + SELECT_OFFSET.y);
    this.hintTop.setText(`LEVEL ${level}`);
    this.hintBottom.setText(BUILT.has(level) ? (touch.enabled ? 'TAP TO PLAY' : 'ENTER TO PLAY') : 'COMING SOON');
  }

  play() {
    if (this.starting) return;
    const level = this.selected;
    if (!BUILT.has(level)) {
      const card = this.cards[level];
      this.tweens.add({ targets: card, x: card.x + 2, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    // The first time, level 1 starts with the story.
    if (level === 1 && !hasSeenIntro()) this.start('intro', { room: 'bedroom' });
    else this.start('game', { level });
  }

  start(key, data) {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(250, 18, 8, 28);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
