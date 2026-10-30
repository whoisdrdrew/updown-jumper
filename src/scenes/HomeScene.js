import Phaser from 'phaser';
import heroIdle from '../art/hero/idle.png';
import heroJump from '../art/hero/jump.png';
import { touch, showTouchControls } from '../touch/TouchControls.js';
import { hasSeenIntro, levelsDone, levelPhoto, hasNugget, nuggetCount, chosenDj, chooseDj } from '../progress.js';
import { preloadNuggets, NUGGET_COUNT } from '../art/afterparty.js';
import MenuMusic from '../audio/MenuMusic.js';
import BossBeat from '../audio/BossBeat.js';
import { DJ_ROSTER, LINEUP_SIZE, djById, unlockedCount, playlist } from '../djs.js';
import { BOOKINGS, STAGES, daysLeft } from '../hub.js';
import { pixText, pixWidth } from '../ui/pixelFont.js';
import {
  preloadHome, cardKey, LEVEL_COUNT, CARD_WINDOW, HINT_AREA, SECTIONS, WINDOW,
  PLAY_POS, PLAY_SELECT_OFFSET, SONG_MENU, SONG_TITLE_BOX, songRow, SONG_ROW_SELECT_OFFSET,
} from '../art/home.js';

const FONT = '"Press Start 2P", monospace';
const GOLD = '#ffd34a';
const WHITE = '#fdfefd';
const DIM = '#8e8aa0';
const INK = 0x221533;
const GILT = [0x7a4a14, 0xb8863a, 0xe0b45c, 0xf5d890];
const YELLOW = 0xf7ce12;
const OUTLINE = 0x150b22;
// The levels that exist so far; the others can be unlocked but say "coming soon".
const BUILT = new Set([1]);
// The bosses' names, shown once their level can be played.
const BOSSES = { 1: 'SOLOMUN' };
// For now the Afterparty opens even while the ticket is still locked (it keeps its padlock look),
// so it can be seen before 10 levels exist. Set to false to make the 10 nuggets required.
const AFTERPARTY_OPEN_EARLY = true;
const DESK_AT = { x: 300, floor: 300 }; // the DJ stands in front of the desk
// Left/right in the studio steps through these: the four sections and the play button in the middle.
const SLOTS = ['world', 'bookings', 'music', 'stages', 'lineup'];
const SONG_ROWS = 5; // rows on the song menu; a longer playlist scrolls
const LINEUP_PICTURE = { x: 523, y: 86, size: 36 }; // inside the gold frame on the Line-Up section

// The home screen: Boris's music studio (menu v3). The wall has four sections, Boris World, New
// Bookings, Special Stages and Line-Up, either side of the middle panel with the title and the play
// button (menu music). Picking a section opens its window over the dimmed studio:
// - Boris World: the 10 level cards (winner photos from Felix), the Afterparty ticket and the nuggets.
// - New Bookings: the DJs who join each month. Beat them, then play them.
// - Special Stages: partner levels for a limited time.
// - Line-Up: the DJs you can play with. The one you pick stands at the desk and his songs lead the
//   song menu.
// Keys: arrows pick, up / Space / Enter opens or plays, Esc closes; on a phone everything is tapped.
// S plays the story. The studio art is drawn for the 640x360 canvas, so this scene isn't zoomed.
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
    showTouchControls(false);
    this.events.once('shutdown', () => showTouchControls(true));
    this.starting = false;
    this.win = null; // the open section window
    this.songs = null; // the open song menu

    const done = levelsDone();
    this.done = done;
    this.reachable = Math.min(done + 1, LEVEL_COUNT); // finished levels and the next one can be played
    this.dj = djById(chosenDj());
    this.makeSilhouette('lineup-solomun', 'lineup-unknown');

    this.addDesk(Boolean(data?.justDone));
    this.showWallPortrait();
    this.addHint();
    this.addPlayButton();
    this.addSections();
    this.blink = false;
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        this.blink = !this.blink;
        const n = this.blink ? 1 : 0;
        this.sectionSelect.setTexture(`home-section-select-${n}`);
        this.playSelect.setTexture(`home-play-select-${n}`);
        this.songs?.select.setTexture(`home-song-select-${n}`);
        this.win?.cursor?.setAlpha(this.blink ? 1 : 0.45);
      },
    });
    this.select(SLOTS.indexOf('world'));

    // Menu music, picked from the song menu; it stops when you leave the studio.
    this.music = null; // { song } playing
    this.menuMusic = new MenuMusic();
    this.events.once('shutdown', () => this.stopSong());

    const kb = this.input.keyboard;
    const on = (key, fn) => kb.on(`keydown-${key}`, () => !this.starting && fn());
    on('ENTER', () => this.confirm());
    on('SPACE', () => this.confirm());
    on('ESC', () => this.back());
    on('S', () => !this.songs && !this.win && this.start('intro', { room: 'bedroom' }));
    on('LEFT', () => this.move(-1, 0));
    on('RIGHT', () => this.move(1, 0));
    on('UP', () => this.move(0, -1));
    on('DOWN', () => this.move(0, 1));
    this.cameras.main.fadeIn(250, 18, 8, 28);

    // Back from a level: Boris World opens with the new winner photo developing on its card.
    if (data?.justDone) this.openWindow('world', { level: Math.min(data.justDone + 1, LEVEL_COUNT), isNew: data.justDone });
  }

  // ---------------------------------------------------------------- input

  // Arrows: in the song menu up/down; in a window its own picking; in the studio left/right, and up opens.
  move(dx, dy) {
    if (this.songs) {
      if (dy) this.selectSong(this.songs.row + dy);
      else this.closeSongs();
      return;
    }
    if (this.win) return this.win.move(dx, dy);
    if (dx) this.select(Phaser.Math.Clamp(this.slot + dx, 0, SLOTS.length - 1));
    if (dy < 0) this.activate();
  }

  confirm() {
    if (this.songs) return this.toggleSong(this.songs.row);
    if (this.win) return this.win.confirm();
    this.activate();
  }

  back() {
    if (this.songs) this.closeSongs();
    else if (this.win) this.closeWindow();
  }

  // ---------------------------------------------------------------- the studio

  // The picked DJ at the desk. He breathes and jumps for joy over a new photo.
  addDesk(happy) {
    this.desk = this.add.image(DESK_AT.x, DESK_AT.floor, this.dj.desk).setOrigin(0.5, 1).setDepth(2);
    this.tweens.add({ targets: this.desk, scaleY: 0.97, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (happy) this.time.delayedCall(900, () => this.deskJump());
  }

  setDeskDj(dj) {
    this.dj = dj;
    this.desk.setTexture(dj.desk);
    this.showWallPortrait();
    this.deskJump();
  }

  // The Line-Up section's framed picture shows the picked DJ (Boris is baked into the studio art).
  showWallPortrait() {
    this.wallPortrait?.forEach((p) => p.destroy());
    this.wallPortrait = null;
    if (this.dj.id === 'boris') return;
    const { x, y, size } = LINEUP_PICTURE;
    const bg = this.add.rectangle(x, y, size, size, 0x2e2244).setOrigin(0).setDepth(1);
    const face = this.add.image(x, y + size, this.dj.portrait).setOrigin(0, 1).setDepth(1)
      .setCrop(0, 0, size, size);
    this.wallPortrait = [bg, face];
  }

  deskJump(then) {
    const desk = this.desk;
    if (this.dj.id === 'boris') desk.setTexture('home-boris-jump');
    this.tweens.add({
      targets: desk,
      y: DESK_AT.floor - 26,
      duration: 230,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        desk.setTexture(this.dj.desk);
        then?.();
      },
    });
  }

  // A short hint on the floor in front of the desk, in a dark box: what is picked, and how to open it.
  addHint() {
    const cx = HINT_AREA.x + HINT_AREA.w / 2;
    const cy = HINT_AREA.y + HINT_AREA.h / 2;
    // Above the song menu's dimming too, so it can say how to close the menu.
    this.hintBox = this.add.rectangle(cx, cy, HINT_AREA.w - 10, HINT_AREA.h - 4, INK).setStrokeStyle(2, GILT[2]).setDepth(24)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => !this.songs && !this.win && this.activate());
    const style = { fontFamily: FONT, fontSize: '8px', align: 'center' };
    this.hintTop = this.add.text(cx, cy - 6, '', { ...style, color: GOLD }).setOrigin(0.5).setDepth(25);
    this.hintBottom = this.add.text(cx, cy + 7, '', { ...style, color: '#ffffff' }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: this.hintBottom, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }

  showHint(visible) {
    [this.hintBox, this.hintTop, this.hintBottom].forEach((p) => p.setVisible(visible));
  }

  // The round play button on the middle panel: a tap (or picking it and pressing up) opens the songs.
  addPlayButton() {
    this.playButton = this.add.image(PLAY_POS.x, PLAY_POS.y, 'home-play').setOrigin(0).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.playButton.on('pointerdown', () => {
      if (this.songs || this.win) return;
      this.select(SLOTS.indexOf('music'));
      this.openSongs();
    });
    this.playSelect = this.add.image(PLAY_POS.x + PLAY_SELECT_OFFSET.x, PLAY_POS.y + PLAY_SELECT_OFFSET.y, 'home-play-select-0')
      .setOrigin(0).setDepth(3);
  }

  // The four sections on the wall: tap one to open it. Their corner tags say what's new.
  addSections() {
    SECTIONS.forEach((s) => {
      this.add.zone(s.x, s.y, s.w, s.h).setOrigin(0).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (this.songs || this.win || this.starting) return;
          this.select(SLOTS.indexOf(s.id));
          this.activate();
        });
    });
    const latest = BOOKINGS[BOOKINGS.length - 1];
    const fresh = latest.djs.filter((d) => d.isNew).length;
    const live = STAGES.some((st) => daysLeft(st) > 0);
    if (fresh) this.cornerTag('bookings', `${fresh} NEW`, '#ff6aa8');
    if (live) this.cornerTag('stages', 'LIVE', '#ff5a5a');
    this.cornerTag('lineup', `${unlockedCount()}/${LINEUP_SIZE}`, GOLD);
    this.sectionSelect = this.add.image(0, 0, 'home-section-select-0').setOrigin(0).setDepth(3);
  }

  cornerTag(id, label, color) {
    const s = SECTIONS.find((x) => x.id === id);
    const w = pixWidth(label) + 8;
    const x = s.x + s.w + 1 - w - 7;
    const g = this.add.graphics().setDepth(2);
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    rect(g, x, s.y + 5, w, 9, 0x140d1f);
    frame(g, x - 1, s.y + 4, w + 2, 11, c);
    pixText(this, x + 4, s.y + 7, label, color).setDepth(2);
  }

  select(slot) {
    this.slot = slot;
    const item = SLOTS[slot];
    const section = SECTIONS.find((s) => s.id === item);
    this.sectionSelect.setVisible(Boolean(section));
    this.playSelect.setVisible(!section);
    const verb = touch.enabled ? 'TAP' : 'PRESS UP';
    if (!section) {
      this.desk.setFlipX(false);
      this.hintTop.setText('MENU MUSIC');
      this.hintBottom.setText(`${verb} TO PICK A SONG`);
      return;
    }
    this.sectionSelect.setPosition(section.x - 2, section.y - 2);
    this.desk.setFlipX(section.x + section.w / 2 < DESK_AT.x); // he faces right in the art
    this.hintTop.setText(section.name);
    this.hintBottom.setText(`${verb} TO OPEN`);
  }

  activate() {
    if (this.starting) return;
    const item = SLOTS[this.slot];
    if (item === 'music') this.openSongs();
    else this.openWindow(item);
  }

  playLevel(level) {
    if (this.starting) return false;
    if (level > this.reachable || !BUILT.has(level)) return false;
    // The first time, level 1 starts with the story.
    this.closeWindow();
    this.starting = true;
    this.deskJump(() => {
      this.starting = false;
      if (level === 1 && !hasSeenIntro()) this.start('intro', { room: 'bedroom' });
      else this.start('game', { level });
    });
    return true;
  }

  start(key, data) {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(250, 18, 8, 28);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  // A grey look-alike of a picture (dark fill, lighter rim) for DJs not unlocked yet.
  makeSilhouette(src, key) {
    if (this.textures.exists(key)) return;
    const img = this.textures.get(src).getSourceImage();
    const { width: w, height: h } = img;
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : data.data[(y * w + x) * 4 + 3]);
    const out = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!a(x, y)) continue;
        const edge = !a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1);
        const [r, g, b] = edge ? [0x5a, 0x4a, 0x72] : [0x2a, 0x22, 0x36];
        out.data.set([r, g, b, 255], (y * w + x) * 4);
      }
    }
    ctx.putImageData(out, 0, 0);
    canvas.refresh();
  }

  // ---------------------------------------------------------------- windows

  // Dims the studio and opens a framed window with a title bar, a close button and a footer of keys.
  openWindow(id, opts = {}) {
    if (this.win || this.starting) return;
    this.select(SLOTS.indexOf(id));
    const { x: WX, y: WY, w: WW, h: WH } = WINDOW;
    const parts = [];
    const add = (obj, depth = 32) => {
      parts.push(obj.setDepth(depth));
      return obj;
    };
    const dim = add(this.add.rectangle(0, 0, 640, 360, 0x000000, 0.65).setOrigin(0).setInteractive(), 30);
    dim.on('pointerdown', () => this.closeWindow());
    add(this.add.zone(WX, WY, WW, WH).setOrigin(0).setInteractive(), 30); // taps inside don't close it
    const g = add(this.add.graphics(), 31);
    rect(g, WX, WY, WW, WH, 0x1a1028);
    frame(g, WX, WY, WW, WH, GILT[2], 2);
    frame(g, WX - 1, WY - 1, WW + 2, WH + 2, OUTLINE);
    rect(g, WX + 2, WY + 2, WW - 4, 24, INK);
    rect(g, WX + 2, WY + 26, WW - 4, 1, GILT[1]);
    const section = SECTIONS.find((s) => s.id === id);
    add(ctext(this, section.name, WX + WW / 2, WY + 9, GOLD, 2));
    const bx = WX + WW - 22;
    rect(g, bx, WY + 6, 16, 16, 0x3a2a4e);
    frame(g, bx, WY + 6, 16, 16, GILT[1]);
    add(ctext(this, 'X', bx + 8, WY + 12, WHITE));
    add(this.add.zone(bx - 4, WY + 2, 24, 24).setOrigin(0).setInteractive({ useHandCursor: true }), 34)
      .on('pointerdown', () => this.closeWindow());
    const footer = add(ctext(this, '', WX + WW / 2, WY + WH - 14, DIM));
    this.showHint(false);
    this.win = { id, parts, add, g, footer, cursor: null };
    const build = { world: this.worldWindow, bookings: this.bookingsWindow, stages: this.stagesWindow, lineup: this.lineupWindow }[id];
    build.call(this, this.win, opts);
  }

  closeWindow() {
    const win = this.win;
    if (!win) return;
    win.parts.forEach((p) => p.destroy());
    win.temp?.forEach((p) => p.destroy());
    this.win = null;
    this.showHint(true);
    this.select(this.slot);
  }

  setFooter(keys, taps) {
    const text = touch.enabled ? taps : keys;
    const f = this.win.footer;
    f.setText(text);
    f.x = Math.round(WINDOW.x + WINDOW.w / 2 - pixWidth(text) / 2);
  }

  // Parts that are redrawn when the window's page changes (a month, a scroll); kept apart from the frame.
  clearTemp(win) {
    win.temp?.forEach((p) => p.destroy());
    win.temp = [];
    win.cursor = null;
    return (obj, depth = 32) => {
      win.temp.push(obj.setDepth(depth));
      return obj;
    };
  }

  shake(obj) {
    if (!obj) return;
    const x = obj.x;
    this.tweens.add({ targets: obj, x: x + 2, duration: 50, yoyo: true, repeat: 3, onComplete: () => obj.setX(x) });
  }

  // Boris World: the 10 level cards in two rows, the Afterparty ticket and the golden nuggets.
  worldWindow(win, { level, isNew } = {}) {
    const { add, g } = win;
    const { x: WX, y: WY } = WINDOW;
    const x0 = WX + 28;
    const y0 = WY + 44;
    win.cards = [];
    for (let lv = 1; lv <= LEVEL_COUNT; lv++) {
      const x = x0 + ((lv - 1) % 5) * 54;
      const y = y0 + Math.floor((lv - 1) / 5) * 66;
      const state = lv <= this.done ? 'done' : lv === this.done + 1 ? 'open' : 'locked';
      rect(g, x + 18, y - 4, 4, 6, 0xc08a3a); // the peg it hangs from
      rect(g, x + 18, y - 4, 4, 1, 0xf0c070);
      if (state === 'done') {
        rect(g, x + CARD_WINDOW.x, y + CARD_WINDOW.y, CARD_WINDOW.w, CARD_WINDOW.h, 0xf4efe4); // blank photo paper
        this.addPhoto(win, lv, x, y, lv === isNew);
      }
      const card = add(this.add.image(x, y, cardKey(lv, state)).setOrigin(0), 33).setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => (win.pick === lv ? win.confirm() : pick(lv)));
      win.cards[lv] = card;
    }
    if (isNew) {
      const card = win.cards[isNew];
      this.tweens.add({ targets: card, angle: { from: -8, to: 0 }, duration: 700, delay: 300, ease: 'Back.easeOut' });
    }

    // Right: the Afterparty ticket, grey with a padlock until all 10 nuggets are won, and the nuggets.
    const tx = WX + 318;
    const won = nuggetCount();
    const unlocked = won >= NUGGET_COUNT;
    add(ctext(this, 'AFTERPARTY', tx + 70, y0 + 6, GOLD));
    const ticket = add(this.add.image(tx + 10, y0 + 18, unlocked ? 'ticket' : 'ticket-locked').setOrigin(0))
      .setInteractive({ useHandCursor: true });
    ticket.on('pointerdown', () => (win.pick === 'ticket' ? win.confirm() : pick('ticket')));
    for (let i = 0; i < NUGGET_COUNT; i++) {
      add(this.add.image(tx + 4 + (i % 5) * 14, y0 + 92 + Math.floor(i / 5) * 13, hasNugget(i + 1) ? 'nugget-icon' : 'nugget-slot').setOrigin(0));
    }
    add(pixText(this, tx + 80, y0 + 97, `${won}/${NUGGET_COUNT}`, GOLD));
    add(ctext(this, 'WIN A NUGGET IN EVERY', tx + 70, y0 + 126, DIM));
    add(ctext(this, 'VIP ROOM TO GET IN', tx + 70, y0 + 134, DIM));

    // The level strip under the cards.
    rect(g, x0, y0 + 136, 262, 34, INK);
    frame(g, x0, y0 + 136, 262, 34, GILT[1]);
    const line1 = add(ctext(this, '', x0 + 131, y0 + 143, GOLD));
    const line2 = add(ctext(this, '', x0 + 131, y0 + 155, WHITE));
    const setLine = (t, text) => {
      t.setText(text);
      t.x = Math.round(x0 + 131 - pixWidth(text) / 2);
    };
    const cursor = add(this.add.graphics(), 34);
    win.cursor = cursor;
    this.setFooter('LEFT RIGHT: PICK A LEVEL   UP: PLAY   ESC: BACK', 'TAP A LEVEL, TAP AGAIN TO PLAY');

    const order = [...Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1), 'ticket'];
    const pick = (item) => {
      win.pick = item;
      cursor.clear();
      if (item === 'ticket') {
        frame(cursor, tx + 7, y0 + 15, 126, 70, YELLOW, 2);
        setLine(line1, 'AFTERPARTY');
        setLine(line2, unlocked ? 'UP TO GO IN' : AFTERPARTY_OPEN_EARLY ? 'LOCKED, BUT YOU CAN PEEK IN' : `WIN ALL ${NUGGET_COUNT} NUGGETS`);
        return;
      }
      const card = win.cards[item];
      frame(cursor, card.x - 3, card.y - 3, 46, 52, YELLOW, 2);
      const status = item > this.reachable ? ': LOCKED' : BUILT.has(item) ? '' : ': COMING SOON';
      setLine(line1, `LEVEL ${item}${status}`);
      const boss = item <= this.reachable && BOSSES[item] ? BOSSES[item] : '???';
      setLine(line2, `BOSS: ${boss}   PLAY AS: ${this.dj.walks ? this.dj.name : 'BORIS'}`);
    };
    win.move = (dx, dy) => {
      if (dy < 0) return win.confirm();
      if (dx) pick(order[Phaser.Math.Clamp(order.indexOf(win.pick) + dx, 0, order.length - 1)]);
    };
    win.confirm = () => {
      if (win.pick === 'ticket') {
        if (unlocked || AFTERPARTY_OPEN_EARLY) return this.start('afterparty');
        return this.shake(ticket);
      }
      if (!this.playLevel(win.pick)) this.shake(win.cards[win.pick]);
    };
    pick(level ?? this.reachable);
  }

  // A finished level's winner photo, under the card's transparent window. A just-finished one develops.
  addPhoto(win, level, x, y, isNew) {
    const photo = levelPhoto(level);
    if (!photo) return;
    const key = `home-photo-${level}`;
    const show = () => {
      if (this.win !== win) return;
      const img = win.add(this.add.image(x + CARD_WINDOW.x, y + CARD_WINDOW.y, key).setOrigin(0)
        .setDisplaySize(CARD_WINDOW.w, CARD_WINDOW.h), 32);
      if (isNew) {
        img.setAlpha(0);
        this.tweens.add({ targets: img, alpha: 1, delay: 500, duration: 1200 });
      }
    };
    if (this.textures.exists(key)) return show();
    this.textures.once(`addtexture-${key}`, show);
    this.textures.addBase64(key, photo);
  }

  // New Bookings: this month's DJs as cards; left and right also go back and forth through the months.
  bookingsWindow(win) {
    const { add, g } = win;
    const { x: WX, y: WY, w: WW } = WINDOW;
    add(ctext(this, 'BEAT THEM, THEN PLAY THEM: WIN THEIR LEVELS TO ADD THEM TO YOUR LINE-UP', WX + WW / 2, WY + 64, DIM));
    const arrows = [];
    [[-1, WX + 18], [1, WX + WW - 40]].forEach(([dir, x]) => {
      const ag = add(this.add.graphics());
      rect(ag, x, WY + 40, 22, 22, 0x3a2a4e);
      frame(ag, x, WY + 40, 22, 22, GILT[2]);
      const t = add(ctext(this, dir < 0 ? '<' : '>', x + 11, WY + 46, GOLD, 2));
      const hit = add(this.add.zone(x, WY + 40, 22, 22).setOrigin(0).setInteractive({ useHandCursor: true }), 34);
      hit.on('pointerdown', () => showMonth(win.month + dir, dir < 0 ? -1 : 0));
      arrows.push([ag, t, hit, dir]);
    });
    this.setFooter('LEFT RIGHT: PICK A DJ OR MONTH   UP: PLAY   ESC: BACK', 'TAP A DJ, TAP AGAIN TO PLAY');

    const showMonth = (m, card = 0) => {
      if (m < 0 || m >= BOOKINGS.length) return;
      win.month = m;
      const temp = this.clearTemp(win);
      const { month, djs } = BOOKINGS[m];
      temp(ctext(this, month, WX + WW / 2, WY + 45, WHITE, 2));
      arrows.forEach(([ag, t, hit, dir]) => {
        const has = m + dir >= 0 && m + dir < BOOKINGS.length;
        [ag, t, hit].forEach((p) => p.setVisible(has));
      });
      const total = djs.length * 132 + (djs.length - 1) * 36;
      win.cards = djs.map((d, i) => this.djCard(win, temp, d, WX + Math.round((WW - total) / 2) + i * 168, WY + 80, i));
      win.cursor = temp(this.add.graphics(), 34);
      pickCard(card < 0 ? djs.length - 1 : card);
    };
    const pickCard = (i) => {
      win.pick = i;
      const c = win.cards[i];
      win.cursor.clear();
      frame(win.cursor, c.x - 4, c.y - 4, 140, 184, YELLOW, 2);
    };
    win.pickCard = pickCard;
    win.move = (dx, dy) => {
      if (dy < 0) return win.confirm();
      if (!dx) return;
      const i = win.pick + dx;
      if (i < 0) showMonth(win.month - 1, -1);
      else if (i >= win.cards.length) showMonth(win.month + 1, 0);
      else pickCard(i);
    };
    win.confirm = () => {
      const c = win.cards[win.pick];
      const next = c.levels?.find((lv) => lv > this.done) ?? c.levels?.[0];
      if (!next || !this.playLevel(next)) this.shake(c.label);
    };
    showMonth(BOOKINGS.length - 1);
  }

  // One booked DJ: his picture (a silhouette until he's beaten), name, levels won and PLAY.
  djCard(win, add, booking, x, y, index) {
    const g = add(this.add.graphics());
    const w = 132;
    const h = 176;
    const levels = booking.levels;
    const total = levels ? levels.length : booking.levelCount;
    const won = levels ? levels.filter((lv) => lv <= this.done).length : 0;
    const roster = DJ_ROSTER.find((d) => d.id === booking.dj);
    const known = roster?.unlocked();
    rect(g, x, y, w, h, INK);
    frame(g, x, y, w, h, booking.isNew ? 0xff6aa8 : GILT[1], 2);
    rect(g, x + 8, y + 8, w - 16, 96, 0x2e2244);
    g.fillStyle(0x3e2c5a).fillCircle(x + w / 2, y + 58, 40);
    rect(g, x + 8, y + 98, w - 16, 6, 0x2e2244); // the circle sits on the card's floor
    const face = known ? roster.portrait : roster ? silhouetteOf(this, roster.portrait) : 'lineup-unknown';
    add(this.add.image(x + w / 2, y + 104, face).setOrigin(0.5, 1).setScale(2));
    add(ctext(this, known ? booking.name : booking.dj ? '???' : booking.name, x + w / 2, y + 114, WHITE, 2));
    add(ctext(this, `LEVELS ${won}/${total}`, x + w / 2, y + 134, DIM));
    for (let k = 0; k < total; k++) {
      const dx = x + w / 2 - total * 6 + k * 12 + 2;
      rect(g, dx - 1, y + 145, 10, 10, OUTLINE);
      rect(g, dx, y + 146, 8, 8, k < won ? 0xffd34a : 0x3a2a4e);
    }
    const playable = levels?.some((lv) => BUILT.has(lv));
    const label = add(ctext(this, !playable ? 'COMING SOON' : won < total ? 'PLAY' : 'DONE', x + w / 2, y + 162,
      !playable ? DIM : won < total ? GOLD : '#3cae4a'));
    if (booking.isNew) {
      rect(g, x + w - 35, y - 7, 36, 14, OUTLINE);
      rect(g, x + w - 34, y - 6, 34, 12, 0xd8283c);
      add(ctext(this, 'NEW', x + w - 17, y - 3, WHITE));
    }
    add(this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true }), 34)
      .on('pointerdown', () => (win.pick === index ? win.confirm() : win.pickCard(index)));
    return { x, y, label, levels: playable ? levels : null };
  }

  // Special Stages: partner levels for a limited time, each with its prize and how long it's on.
  stagesWindow(win) {
    const { add, g } = win;
    const { x: WX, y: WY, w: WW } = WINDOW;
    add(ctext(this, 'PARTNER LEVELS FOR A LIMITED TIME', WX + WW / 2, WY + 36, DIM));
    win.rows = STAGES.map((st, i) => {
      const x = WX + 24;
      const y = WY + 50 + i * 64;
      const w = WW - 48;
      const left = daysLeft(st);
      const ended = left <= 0;
      rect(g, x, y, w, 54, INK);
      frame(g, x, y, w, 54, ended ? 0x3a2a4e : GILT[1], 2);
      rect(g, x + 7, y + 6, 42, 42, OUTLINE);
      rect(g, x + 8, y + 7, 40, 40, ended ? 0x3a2a4e : st.color);
      add(ctext(this, 'LOGO', x + 28, y + 24, ended ? DIM : WHITE));
      const name = add(pixText(this, x + 60, y + 10, st.name, ended ? DIM : WHITE, 2));
      add(pixText(this, x + 60, y + 30, st.prize, ended ? DIM : GOLD));
      add(pixText(this, x + 60, y + 40, 'BOSS: THEIR OWN, NOT A DJ', DIM));
      const tag = ended ? 'ENDED' : `${left} ${left === 1 ? 'DAY' : 'DAYS'} LEFT`;
      const tw = pixWidth(tag) + 10;
      rect(g, x + w - tw - 10, y + 8, tw, 12, ended ? 0x2a2236 : 0x3a0a14);
      add(pixText(this, x + w - tw - 5, y + 11, tag, ended ? DIM : '#ff5a5a'));
      add(this.add.zone(x, y, w, 54).setOrigin(0).setInteractive({ useHandCursor: true }), 34)
        .on('pointerdown', () => (win.pick === i ? win.confirm() : pick(i)));
      return { y, name };
    });
    win.cursor = add(this.add.graphics(), 34);
    this.setFooter('UP DOWN: PICK A STAGE   ENTER: PLAY   ESC: BACK', 'TAP A STAGE, TAP AGAIN TO PLAY');
    const pick = (i) => {
      win.pick = i;
      win.cursor.clear();
      frame(win.cursor, WX + 20, win.rows[i].y - 4, WW - 40, 62, YELLOW, 2);
    };
    win.move = (dx, dy) => dy && pick(Phaser.Math.Clamp(win.pick + dy, 0, win.rows.length - 1));
    win.confirm = () => this.shake(win.rows[win.pick].name); // the partner levels aren't built yet
    pick(0);
  }

  // Line-Up: every DJ you can play with, 7 to a row, scrolling past 3 rows. The one you pick stands at
  // the desk and his songs lead the song menu.
  lineupWindow(win) {
    const { add, g } = win;
    const { x: WX, y: WY, w: WW } = WINDOW;
    const COLS = 7;
    const ROWS = 3;
    const SW = 58;
    const SH = 64;
    const rows = Math.ceil(LINEUP_SIZE / COLS);
    const x0 = WX + Math.round((WW - 16 - COLS * SW) / 2);
    const y0 = WY + 52;
    add(pixText(this, WX + 10, WY + 12, `${unlockedCount()}/${LINEUP_SIZE}`, GOLD));
    add(ctext(this, 'CHOOSE THE DJ YOU WANNA PLAY WITH', WX + WW / 2, WY + 34, WHITE, 2));
    rect(g, WX + 40, WY + 245, WW - 80, 13, INK);
    frame(g, WX + 40, WY + 245, WW - 80, 13, GILT[1]);
    add(ctext(this, "BEAT THEM, THEN PLAY THEM: WIN A DJ'S LEVELS TO UNLOCK THEM", WX + WW / 2, WY + 249, GOLD));
    const sx = x0 + COLS * SW + 2;
    const bar = add(this.add.graphics());
    this.setFooter('ARROWS: PICK A DJ   ENTER: PLAY AS THEM   ESC: BACK', 'TAP A DJ, TAP AGAIN TO PLAY AS THEM');

    win.top = 0; // first row shown
    const draw = () => {
      const temp = this.clearTemp(win);
      for (let r = win.top; r < Math.min(win.top + ROWS, rows); r++) {
        for (let col = 0; col < COLS; col++) {
          const i = r * COLS + col;
          if (i >= LINEUP_SIZE) break;
          const x = x0 + col * SW;
          const y = y0 + (r - win.top) * SH;
          const dj = DJ_ROSTER[i];
          const got = dj?.unlocked();
          const sg = temp(this.add.graphics());
          rect(sg, x, y, SW - 6, SH - 6, got ? 0x2e2244 : 0x1f1630);
          frame(sg, x, y, SW - 6, SH - 6, dj === this.dj ? GILT[3] : got ? GILT[1] : 0x3a2a4e);
          temp(pixText(this, x + 4, y + 4, String(i + 1).padStart(3, '0'), got ? GOLD : '#4a3a62'));
          if (got && dj.id === 'boris') {
            temp(this.add.image(x + 4, y + 8, dj.portrait).setOrigin(0).setCrop(4, 4, 36, 36)); // his face, cropped
          } else {
            const face = got ? dj.portrait : dj ? silhouetteOf(this, dj.portrait) : 'lineup-unknown';
            temp(this.add.image(x + 8, y + 18, face).setOrigin(0));
          }
          temp(ctext(this, got ? dj.name : '???', x + (SW - 6) / 2, y + 50, got ? WHITE : '#4a3a62'));
          temp(this.add.zone(x, y, SW - 6, SH - 6).setOrigin(0).setInteractive({ useHandCursor: true }), 34)
            .on('pointerdown', () => (win.pick === i ? win.confirm() : pick(i)));
        }
      }
      bar.clear();
      const track = ROWS * SH - 6;
      rect(bar, sx, y0, 6, track, 0x2e2244);
      const thumb = Math.round((track * ROWS) / rows);
      rect(bar, sx, y0 + Math.round(((track - thumb) * win.top) / (rows - ROWS)), 6, thumb, GILT[2]);
      win.cursor = temp(this.add.graphics(), 35);
    };
    const pick = (i) => {
      win.pick = i;
      const r = Math.floor(i / COLS);
      if (r < win.top || r >= win.top + ROWS) {
        win.top = Phaser.Math.Clamp(r < win.top ? r : r - ROWS + 1, 0, rows - ROWS);
        draw();
      }
      win.cursor.clear();
      frame(win.cursor, x0 + (i % COLS) * SW - 3, y0 + (r - win.top) * SH - 3, SW, SH, YELLOW, 2);
    };
    win.move = (dx, dy) => pick(Phaser.Math.Clamp(win.pick + dx + dy * COLS, 0, LINEUP_SIZE - 1));
    win.confirm = () => {
      const dj = DJ_ROSTER[win.pick];
      if (!dj?.unlocked()) return this.shake(win.cursor);
      chooseDj(dj.id);
      this.closeWindow();
      if (dj !== this.dj) this.setDeskDj(dj);
      this.hintTop.setText('LINE-UP');
      this.hintBottom.setText(`${dj.name} IS AT THE DESK`);
    };
    draw();
    pick(DJ_ROSTER.indexOf(this.dj));
  }

  // ---------------------------------------------------------------- song menu

  // The picked DJ's songs, then the other unlocked DJs'. Five rows show; up and down scroll the rest.
  openSongs() {
    if (this.songs || this.starting) return;
    const left = (this.scale.gameSize.width - SONG_MENU.w) / 2;
    const top = (this.scale.gameSize.height - SONG_MENU.h) / 2;
    const parts = [];
    const dim = this.add.rectangle(0, 0, 640, 360, 0x000000, 0.55).setOrigin(0).setDepth(20).setInteractive();
    dim.on('pointerdown', () => this.closeSongs()); // a tap outside the menu closes it
    parts.push(dim);
    parts.push(this.add.image(left, top, 'home-song-menu').setOrigin(0).setDepth(21).setInteractive());
    parts.push(this.add.text(left + SONG_TITLE_BOX.x + SONG_TITLE_BOX.w / 2, top + SONG_TITLE_BOX.y + SONG_TITLE_BOX.h / 2,
      'PICK A SONG', { fontFamily: FONT, fontSize: '8px', color: GOLD }).setOrigin(0.5).setDepth(22));
    const list = playlist(this.dj);
    const names = [];
    const eqs = [];
    for (let r = 0; r < Math.min(SONG_ROWS, list.length); r++) {
      const row = songRow(r);
      const hit = this.add.zone(left + row.x, top + row.y, row.w, row.h).setOrigin(0).setDepth(23).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectSong(this.songs.offset + r);
        this.toggleSong(this.songs.offset + r);
      });
      parts.push(hit);
      names.push(this.add.text(left + row.x + 28, top + row.y + row.h / 2, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff' })
        .setOrigin(0, 0.5).setDepth(22));
      eqs.push(this.add.image(left + row.x + row.w - 18, top + row.y + 5, 'home-eq-0').setOrigin(0).setDepth(22).setVisible(false));
    }
    parts.push(...names, ...eqs);
    const select = this.add.image(0, 0, 'home-song-select-0').setOrigin(0).setDepth(22);
    parts.push(select);
    let frameNo = 0;
    const eqTimer = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        frameNo = (frameNo + 1) % 3;
        eqs.forEach((eq) => eq.setTexture(`home-eq-${frameNo}`));
      },
    });
    this.songs = { left, top, parts, list, names, eqs, select, eqTimer, row: 0, offset: -1 };
    const playing = this.music ? list.indexOf(this.music.song) : -1;
    this.selectSong(Math.max(playing, 0));
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
    songs.row = Phaser.Math.Clamp(i, 0, songs.list.length - 1);
    // Scroll so the picked song is on one of the five rows.
    const offset = Phaser.Math.Clamp(songs.offset < 0 ? songs.row - SONG_ROWS + 1 : songs.offset, 0, Math.max(0, songs.list.length - SONG_ROWS));
    songs.offset = Phaser.Math.Clamp(offset, songs.row - SONG_ROWS + 1, songs.row);
    songs.names.forEach((t, r) => {
      const song = songs.list[songs.offset + r];
      t.setText(song ? song.name : '');
    });
    const r = songRow(songs.row - songs.offset);
    songs.select.setPosition(songs.left + r.x + SONG_ROW_SELECT_OFFSET.x, songs.top + r.y + SONG_ROW_SELECT_OFFSET.y);
    this.showPlaying();
  }

  // Plays song i of the menu, or stops it if it's the one playing.
  toggleSong(i) {
    const song = this.songs.list[i];
    const playing = this.music?.song === song;
    this.stopSong();
    if (!playing) {
      if (song.url) this.menuMusic.play(song.url);
      else (this.beat = new BossBeat(this.sound.context, song.beat)).start();
      this.music = { song };
    }
    this.showPlaying();
  }

  stopSong() {
    this.menuMusic.stop();
    this.beat?.stop();
    this.beat = null;
    this.music = null;
  }

  // The play button shows pause bars while music plays; the eq bars move on its row. (The DJ keeps
  // still: the characters only dance at the Afterparty.)
  showPlaying() {
    this.playButton.setTexture(this.music ? 'home-play-on' : 'home-play');
    const songs = this.songs;
    songs?.eqs.forEach((eq, r) => eq.setVisible(Boolean(this.music) && songs.list[songs.offset + r] === this.music.song));
  }
}

// ---------------------------------------------------------------- drawing helpers (crisp pixel boxes)

function rect(g, x, y, w, h, color) {
  g.fillStyle(color).fillRect(x, y, w, h);
}

function frame(g, x, y, w, h, color, t = 1) {
  rect(g, x, y, w, t, color);
  rect(g, x, y + h - t, w, t, color);
  rect(g, x, y, t, h, color);
  rect(g, x + w - t, y, t, h, color);
}

// Pixel letters centred on cx (snapped to whole pixels so they stay sharp).
function ctext(scene, text, cx, y, color, scale = 1) {
  return pixText(scene, Math.round(cx - pixWidth(text, scale) / 2), y, text, color, scale);
}

function silhouetteOf(scene, key) {
  const out = `${key}-silhouette`;
  scene.makeSilhouette(key, out);
  return out;
}
