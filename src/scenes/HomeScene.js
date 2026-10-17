import Phaser from 'phaser';
import Controls from '../player/Controls.js';
import heroIdle from '../art/hero/idle.png';
import heroJump from '../art/hero/jump.png';
import { touch, showTouchControls } from '../touch/TouchControls.js';
import { hasSeenIntro, levelsDone, levelPhoto, hasNugget, nuggetCount } from '../progress.js';
import { preloadNuggets, NUGGET_COUNT } from '../art/afterparty.js';
import MenuMusic from '../audio/MenuMusic.js';
import { SONGS, SONG_BPM } from '../audio/songs.js';
import {
  preloadHome, cardKey, LEVEL_COUNT, CARD_AT, CARD_WINDOW, SELECT_OFFSET, HINT_AREA, TITLE_PANEL,
  PLAY_POS, PLAY_SELECT_OFFSET, SONG_MENU, SONG_TITLE_BOX, songRow, SONG_ROW_SELECT_OFFSET,
} from '../art/home.js';

const FONT = '"Press Start 2P", monospace';
const GOLD = '#ffd34a';
// The levels that exist so far; the others can be unlocked but say "coming soon".
const BUILT = new Set([1]);
// For now the Afterparty opens even while the ticket is still locked (it keeps its padlock look),
// so it can be seen before 10 levels exist. Set to false to make the 10 nuggets required.
const AFTERPARTY_OPEN_EARLY = true;
const BORIS_AT = { x: 300, floor: 300 }; // in front of his desk
// Left/right steps through these in order: the levels on the left string, the play button, the right
// string, then the Afterparty ticket.
const SLOTS = [1, 2, 3, 4, 5, 'music', 6, 7, 8, 9, 10, 'ticket'];
// In the empty bottom half of the right board: the Afterparty ticket with the golden nugget counter
// under it. (The left board's bottom half is kept for the special levels after the first 10.)
const TICKET_AT = { x: 492, y: 157 }; // centre
const NUGGET_ROW = { x: 474, y: 199, step: 14 }; // centre of the row of 10, the n/10 count to its right

// The home screen and level menu: Boris's music studio. The 10 levels hang as instant photos on two
// strings. Finished levels show their winner photo from Felix, the next level has a play arrow, and
// the rest are locked, so you see as many photos as levels you have reached.
// Left/right (or tap a card) steps through all 10 levels and the play button in the middle; up, Space
// or Enter (or a second tap) plays the level. Locked levels can be picked but not played. The play
// button opens the song menu: 5 songs for the menu music. S plays the story.
// The studio art is drawn for the 640x360 canvas, so this scene isn't zoomed.
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('home');
  }

  preload() {
    preloadHome(this);
    preloadNuggets(this);
    this.load.image('home-boris', heroIdle);
    this.load.image('home-boris-jump', heroJump);
  }

  create(data) {
    this.add.image(0, 0, 'home-studio').setOrigin(0);
    // On a phone the cards are tapped directly: tap one to pick it, tap it again (or the level hint) to play.
    showTouchControls(false);
    this.events.once('shutdown', () => showTouchControls(true));
    this.controls = new Controls(this);
    this.controls.jumpJustPressed();
    this.controls.shootJustPressed();
    this.starting = false;

    const done = levelsDone();
    this.reachable = Math.min(done + 1, LEVEL_COUNT); // finished levels and the next one can be played
    this.cards = [];
    for (let level = 1; level <= LEVEL_COUNT; level++) this.addCard(level, done, data?.justDone === level);

    this.addBoris(Boolean(data?.justDone));
    this.addTitle();
    this.addHint();
    this.addPlayButton();
    this.addNuggets();
    this.selectFrame = this.add.image(0, 0, 'home-select-0').setOrigin(0).setDepth(3);
    this.playSelect = this.add.image(PLAY_POS.x + PLAY_SELECT_OFFSET.x, PLAY_POS.y + PLAY_SELECT_OFFSET.y, 'home-play-select-0')
      .setOrigin(0).setDepth(3);
    this.blink = false;
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        this.blink = !this.blink;
        const n = this.blink ? 1 : 0;
        this.selectFrame.setTexture(`home-select-${n}`);
        this.playSelect.setTexture(`home-play-select-${n}`);
        this.ticketSelect.setAlpha(this.blink ? 1 : 0.4);
        this.songs?.select.setTexture(`home-song-select-${n}`);
      },
    });
    const first = data?.justDone ? Math.min(data.justDone + 1, LEVEL_COUNT) : this.reachable;
    this.select(SLOTS.indexOf(first));

    // Menu music, picked from the song menu; it stops when you leave the studio.
    this.music = null; // { index } of the song playing
    this.menuMusic = new MenuMusic();
    this.events.once('shutdown', () => this.menuMusic.stop());

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => (this.songs ? this.toggleSong(this.songs.row) : this.play()));
    kb.on('keydown-ESC', () => this.closeSongs());
    kb.on('keydown-S', () => !this.songs && this.start('intro', { room: 'bedroom' }));
    // Left/right as key events, so quick taps never get lost between frames.
    for (const [key, step] of [['LEFT', -1], ['RIGHT', 1]]) {
      kb.on(`keydown-${key}`, () => {
        if (this.starting) return;
        if (this.songs) this.closeSongs();
        else this.select(Phaser.Math.Clamp(this.slot + step, 0, SLOTS.length - 1));
      });
    }
    this.cameras.main.fadeIn(250, 18, 8, 28);
  }

  update() {
    if (this.starting) return;
    const c = this.controls;
    if (this.songs) {
      // In the song menu: up/down picks a song, Space or Enter plays (or stops) it.
      if (c.jumpJustPressed()) this.selectSong(this.songs.row - 1);
      if (c.downJustPressed()) this.selectSong(this.songs.row + 1);
      if (c.shootJustPressed()) this.toggleSong(this.songs.row);
      return;
    }
    c.downJustPressed();
    if (c.jumpJustPressed() | c.shootJustPressed()) this.play();
  }

  addCard(level, done, isNew) {
    const [x, y] = CARD_AT[level - 1];
    const state = level <= done ? 'done' : level === done + 1 ? 'open' : 'locked';
    const card = this.add.image(x, y, cardKey(level, state)).setOrigin(0).setDepth(2);
    this.cards[level] = card;
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      if (this.songs) return;
      if (this.selected === level) this.play();
      else this.select(SLOTS.indexOf(level));
    });
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

  // Boris at his desk. He breathes, turns to the level you pick, and jumps for joy over a new photo.
  addBoris(happy) {
    this.boris = this.add.image(BORIS_AT.x, BORIS_AT.floor, 'home-boris').setOrigin(0.5, 1).setDepth(2);
    this.tweens.add({ targets: this.boris, scaleY: 0.97, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (happy) this.time.delayedCall(900, () => this.borisJump());
  }

  borisJump(then) {
    const boris = this.boris;
    boris.setTexture('home-boris-jump');
    this.tweens.add({
      targets: boris,
      y: BORIS_AT.floor - 26,
      duration: 230,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        boris.setTexture('home-boris');
        then?.();
      },
    });
  }

  // The game's name on the empty panel at the top of the wall.
  addTitle() {
    const cx = TITLE_PANEL.x + TITLE_PANEL.w / 2;
    const cy = TITLE_PANEL.y + TITLE_PANEL.h / 2;
    this.add.text(cx, cy, 'UP DOWN\nJUMPER', { fontFamily: FONT, fontSize: '12px', color: GOLD, align: 'center', lineSpacing: 10 })
      .setOrigin(0.5).setShadow(2, 2, '#12081c', 0, false, true).setDepth(2);
  }

  // A short hint on the floor in front of Boris, in a dark box: which level, and how to play it.
  addHint() {
    const cx = HINT_AREA.x + HINT_AREA.w / 2;
    const cy = HINT_AREA.y + HINT_AREA.h / 2;
    // Above the song menu's dimming too, so it can say how to close the menu.
    this.add.rectangle(cx, cy, HINT_AREA.w - 10, HINT_AREA.h - 4, 0x221533).setStrokeStyle(2, 0xe0b45c).setDepth(24)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => !this.songs && this.play());
    const style = { fontFamily: FONT, fontSize: '8px', align: 'center' };
    this.hintTop = this.add.text(cx, cy - 6, '', { ...style, color: GOLD }).setOrigin(0.5).setDepth(25);
    this.hintBottom = this.add.text(cx, cy + 7, '', { ...style, color: '#ffffff' }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: this.hintBottom, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }

  // The round play button on the middle panel: a tap (or picking it and pressing play) opens the songs.
  addPlayButton() {
    this.playButton = this.add.image(PLAY_POS.x, PLAY_POS.y, 'home-play').setOrigin(0).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.playButton.on('pointerdown', () => {
      if (this.songs) return;
      this.select(SLOTS.indexOf('music'));
      this.openSongs();
    });
  }

  // The golden nuggets won so far, in a row of 10 slots, and the Afterparty ticket: grey with a
  // padlock until all 10 are won.
  addNuggets() {
    const won = nuggetCount();
    this.unlocked = won >= NUGGET_COUNT;
    const style = { fontFamily: FONT, fontSize: '8px', color: GOLD };
    for (let level = 1; level <= NUGGET_COUNT; level++) {
      const x = NUGGET_ROW.x + (level - 1 - (NUGGET_COUNT - 1) / 2) * NUGGET_ROW.step;
      this.add.image(Math.round(x), NUGGET_ROW.y, hasNugget(level) ? 'nugget-icon' : 'nugget-slot').setDepth(2);
    }
    const rowRight = NUGGET_ROW.x + (NUGGET_COUNT / 2) * NUGGET_ROW.step;
    this.add.text(rowRight + 4, NUGGET_ROW.y + 1, `${won}/${NUGGET_COUNT}`, style).setOrigin(0, 0.5).setDepth(2)
      .setShadow(1, 1, '#12081c', 0, false, true);
    this.ticket = this.add.image(TICKET_AT.x, TICKET_AT.y, this.unlocked ? 'ticket' : 'ticket-locked').setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.ticket.on('pointerdown', () => {
      if (this.songs) return;
      if (this.selected === 'ticket') this.play();
      else this.select(SLOTS.indexOf('ticket'));
    });
    this.ticketSelect = this.add.rectangle(TICKET_AT.x, TICKET_AT.y, 128, 72).setStrokeStyle(2, 0xffd34a).setDepth(3);
    if (this.unlocked) this.tweens.add({ targets: this.ticket, angle: { from: -2, to: 2 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  select(slot) {
    this.slot = slot;
    const item = SLOTS[slot];
    this.selected = item;
    const onMusic = item === 'music';
    const onTicket = item === 'ticket';
    this.selectFrame.setVisible(!onMusic && !onTicket);
    this.playSelect.setVisible(onMusic);
    this.ticketSelect.setVisible(onTicket);
    const tap = touch.enabled ? 'TAP' : 'ENTER';
    if (onTicket) {
      this.boris.setFlipX(false);
      this.hintTop.setText('AFTERPARTY');
      if (this.unlocked) this.hintBottom.setText(`${tap} TO GO IN`);
      else this.hintBottom.setText(AFTERPARTY_OPEN_EARLY ? `${tap} TO PEEK IN` : `WIN ALL ${NUGGET_COUNT} NUGGETS`);
      return;
    }
    if (onMusic) {
      this.boris.setFlipX(false);
      this.hintTop.setText('MENU MUSIC');
      this.hintBottom.setText(`${tap} TO PICK A SONG`);
      return;
    }
    const [x, y] = CARD_AT[item - 1];
    this.selectFrame.setPosition(x + SELECT_OFFSET.x, y + SELECT_OFFSET.y);
    this.boris.setFlipX(x + 20 < BORIS_AT.x); // he faces right in the art
    this.hintTop.setText(`LEVEL ${item}`);
    if (item > this.reachable) this.hintBottom.setText('LOCKED');
    else this.hintBottom.setText(BUILT.has(item) ? `${tap} TO PLAY` : 'COMING SOON');
  }

  play() {
    if (this.starting) return;
    const level = this.selected;
    if (level === 'music') return this.openSongs();
    if (level === 'ticket') {
      if (this.unlocked || AFTERPARTY_OPEN_EARLY) return this.start('afterparty');
      this.tweens.add({ targets: this.ticket, x: TICKET_AT.x + 2, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    if (level > this.reachable || !BUILT.has(level)) {
      const card = this.cards[level];
      this.tweens.add({ targets: card, x: card.x + 2, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    // The first time, level 1 starts with the story.
    this.starting = true;
    this.nod?.stop();
    this.borisJump(() => {
      this.starting = false;
      if (level === 1 && !hasSeenIntro()) this.start('intro', { room: 'bedroom' });
      else this.start('game', { level });
    });
  }

  start(key, data) {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(250, 18, 8, 28);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  // ---------------------------------------------------------------- song menu

  openSongs() {
    if (this.songs || this.starting) return;
    const left = (this.scale.gameSize.width - SONG_MENU.w) / 2;
    const top = (this.scale.gameSize.height - SONG_MENU.h) / 2;
    const parts = [];
    const dim = this.add.rectangle(0, 0, 640, 360, 0x000000, 0.55).setOrigin(0).setDepth(20).setInteractive();
    dim.on('pointerdown', () => this.closeSongs()); // a tap outside the menu closes it
    parts.push(dim);
    parts.push(this.add.image(left, top, 'home-song-menu').setOrigin(0).setDepth(21).setInteractive());
    parts.push(this.add.text(left + SONG_TITLE_BOX.x + SONG_TITLE_BOX.w / 2, top + SONG_TITLE_BOX.y + SONG_TITLE_BOX.h / 2, 'PICK A SONG',
      { fontFamily: FONT, fontSize: '8px', color: GOLD }).setOrigin(0.5).setDepth(22));
    const eqs = [];
    SONGS.forEach((song, i) => {
      const r = songRow(i);
      const hit = this.add.zone(left + r.x, top + r.y, r.w, r.h).setOrigin(0).setDepth(23).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectSong(i);
        this.toggleSong(i);
      });
      parts.push(hit);
      parts.push(this.add.text(left + r.x + 28, top + r.y + r.h / 2, song.name, { fontFamily: FONT, fontSize: '8px', color: '#ffffff' })
        .setOrigin(0, 0.5).setDepth(22));
      const eq = this.add.image(left + r.x + r.w - 18, top + r.y + 5, 'home-eq-0').setOrigin(0).setDepth(22).setVisible(false);
      eqs.push(eq);
      parts.push(eq);
    });
    const select = this.add.image(0, 0, 'home-song-select-0').setOrigin(0).setDepth(22);
    parts.push(select);
    let frame = 0;
    const eqTimer = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        frame = (frame + 1) % 3;
        eqs.forEach((eq) => eq.setTexture(`home-eq-${frame}`));
      },
    });
    this.songs = { left, top, parts, eqs, select, eqTimer, row: 0 };
    this.selectSong(this.music ? this.music.index : 0);
    this.showPlaying();
    this.hintTop.setText(touch.enabled ? 'TAP A SONG TO PLAY' : 'ENTER: PLAY OR STOP');
    this.hintBottom.setText(touch.enabled ? 'TAP OUTSIDE TO CLOSE' : 'ESC TO CLOSE');
  }

  closeSongs() {
    if (!this.songs) return;
    this.songs.eqTimer.remove();
    this.songs.parts.forEach((p) => p.destroy());
    this.songs = null;
    this.select(this.slot);
  }

  selectSong(i) {
    const songs = this.songs;
    songs.row = Phaser.Math.Clamp(i, 0, SONGS.length - 1);
    const r = songRow(songs.row);
    songs.select.setPosition(songs.left + r.x + SONG_ROW_SELECT_OFFSET.x, songs.top + r.y + SONG_ROW_SELECT_OFFSET.y);
  }

  // Plays song i, or stops it if it's the one playing.
  toggleSong(i) {
    const playing = this.music?.index === i;
    this.menuMusic.stop();
    this.music = null;
    if (!playing) {
      this.menuMusic.play(SONGS[i].url);
      this.music = { index: i };
    }
    this.showPlaying();
  }

  // The play button shows pause bars and Boris nods along while music plays; the eq dances on its row.
  showPlaying() {
    const on = Boolean(this.music);
    this.playButton.setTexture(on ? 'home-play-on' : 'home-play');
    this.songs?.eqs.forEach((eq, i) => eq.setVisible(this.music?.index === i));
    this.nod?.stop();
    this.boris.y = BORIS_AT.floor;
    this.nod = on
      ? this.tweens.add({ targets: this.boris, y: BORIS_AT.floor + 1, duration: 30000 / SONG_BPM, yoyo: true, repeat: -1 })
      : null;
  }
}
