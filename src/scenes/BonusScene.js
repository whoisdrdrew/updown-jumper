import Phaser from 'phaser';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import BossBeat from '../audio/BossBeat.js';
import { BONUS, GAME_WIDTH, ZOOM } from '../config.js';
import { DUCK_SCALE } from '../art/sprites.js';
import { preloadBonus, BONUS_SCALE, POPUP_TEXT_BOX, PORTRAIT_INSET } from '../art/bonus.js';

const FONT = '"Press Start 2P", monospace';

// Room layout in world pixels. The lobby (door and two buttons) is one screen; behind a gate is
// the big room with the trampoline floor, the boss portrait and a duck on every 16x16 piece of it.
const FLOOR = 164;
const WORLD_W = 576;
const DOOR_X = 72; // clear of the d-pad on phones
const MUSIC_X = 132;
const TIMER_X = 168;
const GATE_X = 248;
const ROOM_LEFT = 256;
const PORTRAIT = { cols: 9, rows: 7, cell: 16, left: 416 - 72, top: 26 };
const CELL_COLOR = 0x221533;

// The duck bonus room behind the VIP door, like the coin rooms in Super Mario Bros. 3.
// Press down at the music button for the boss's beat, at the timer button to start the 20 seconds
// (after a yes/no popup); the gate opens and every duck you grab uncovers a piece of the portrait.
// When time is up the ducks vanish and the whole portrait shows. Leave through the door (down).
// Started by GameScene with { big, masked, played }; wakes GameScene with { ducks, played }.
export default class BonusScene extends Phaser.Scene {
  constructor() {
    super('bonus');
  }

  preload() {
    preloadBonus(this);
  }

  create(data) {
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    this.ui = { x: (cam.width - cam.width / ZOOM) / 2, y: (cam.height - cam.height / ZOOM) / 2 };
    this.physics.world.setBounds(0, 0, WORLD_W, 180);
    this.state = data.played ? 'done' : 'ready';
    this.collected = 0;

    this.add.tileSprite(0, 0, WORLD_W / BONUS_SCALE, 180 / BONUS_SCALE, 'bonus-lounge').setOrigin(0).setScale(BONUS_SCALE);
    this.addFloor();
    this.addPortrait();
    this.door = this.add.image(DOOR_X, FLOOR, 'vip-door-open').setOrigin(0.5, 1).setScale(BONUS_SCALE);
    this.time.delayedCall(400, () => this.state !== 'leaving' && this.door.setTexture('vip-door'));
    this.musicButton = this.add.image(MUSIC_X, FLOOR, 'button-music').setOrigin(0.5, 1).setScale(BONUS_SCALE);
    this.timerButton = this.add.image(TIMER_X, FLOOR, data.played ? 'button-timer-pressed' : 'button-timer')
      .setOrigin(0.5, 1).setScale(BONUS_SCALE);
    this.addGate(data.played);
    this.addHint();

    this.controls = new Controls(this);
    this.player = new Player(this, DOOR_X + 24, FLOOR - 12, this.controls).setDepth(5);
    this.player.masked = !!data.masked;
    this.player.setBig(!!data.big);
    this.physics.add.collider(this.player, [this.floor, this.gate]);
    this.physics.add.overlap(this.player, this.ducks, (_p, duck) => this.collect(duck));

    this.beat = new BossBeat(this.sound.context);
    this.events.once('shutdown', () => this.beat.stop());
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    cam.setBounds(0, 0, WORLD_W, 180);
    cam.startFollow(this.player, true, 0.2, 0.2);
    cam.setRoundPixels(true);
    cam.fadeIn(250);
    this.addHud();
  }

  update(time, delta) {
    const { player, controls } = this;
    if (this.state === 'leaving') return;
    if (this.state === 'popup') return this.updatePopup(time);

    player.update(time, delta);
    this.bounce();

    const down = controls.downJustPressed();
    const onGround = player.body.blocked.down;
    const near = (x) => onGround && Math.abs(player.x - x) <= BONUS.doorReach;
    const spot = [DOOR_X, MUSIC_X, TIMER_X].find(near);
    this.hint.setVisible(spot !== undefined && (spot !== TIMER_X || this.state === 'ready'));
    if (spot !== undefined) this.hint.setPosition(spot, FLOOR - (spot === DOOR_X ? 48 : 30) + this.hintBob);
    if (!down || spot === undefined) return;
    if (spot === DOOR_X) this.leave();
    else if (spot === MUSIC_X) this.musicButton.setTexture(this.beat.toggle() ? 'button-music-pressed' : 'button-music');
    else if (this.state === 'ready') this.openPopup();
  }

  // The floor: carpet in the lobby, trampoline tiles in the big room.
  addFloor() {
    const g = this.add.graphics();
    g.fillStyle(0x2c1c40).fillRect(0, FLOOR, ROOM_LEFT, 180 - FLOOR);
    g.fillStyle(0xc89a3c).fillRect(0, FLOOR, ROOM_LEFT, 1);
    this.trampolines = [];
    for (let x = ROOM_LEFT; x < WORLD_W; x += 16) {
      this.trampolines.push(this.add.image(x, FLOOR, 'trampoline-0').setOrigin(0).setScale(BONUS_SCALE));
    }
    this.floor = this.add.zone(0, FLOOR, WORLD_W, 180 - FLOOR).setOrigin(0);
    this.physics.add.existing(this.floor, true);
  }

  // Like a Mario trampoline: landing on it throws you up; hold jump to go higher.
  bounce() {
    const { player } = this;
    if (!player.body.blocked.down || player.x < ROOM_LEFT) return;
    player.body.setVelocityY(-BONUS.bounceSpeed);
    player.lastGroundedAt = -Infinity; // no ordinary jump straight after, it would be lower
    const tile = this.trampolines[Math.floor((player.x - ROOM_LEFT) / 16)];
    if (!tile) return;
    tile.setTexture('trampoline-1');
    this.time.delayedCall(120, () => tile.setTexture('trampoline-0'));
  }

  // The boss portrait, a dark cell over each 16x16 piece of it, and a duck on each cell.
  addPortrait() {
    const { cols, rows, cell, left, top } = PORTRAIT;
    const inset = PORTRAIT_INSET * BONUS_SCALE;
    this.add.image(left, top, 'bonus-portrait').setOrigin(0).setScale(BONUS_SCALE);
    this.add.image(left - inset, top - inset, 'bonus-portrait-frame').setOrigin(0).setScale(BONUS_SCALE);
    this.cells = [];
    this.ducks = this.physics.add.staticGroup();
    if (this.state === 'done') return; // played already: the whole portrait shows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = left + c * cell + cell / 2;
        const y = top + r * cell + cell / 2;
        const cover = this.add.rectangle(x, y, cell, cell, CELL_COLOR);
        this.cells.push(cover);
        const duck = this.ducks.create(x, y, 'rubber-duck').setScale(DUCK_SCALE).refreshBody();
        duck.cover = cover;
        this.tweens.add({ targets: duck, y: y - 1, duration: 500, delay: (r + c) * 60, yoyo: true, repeat: -1 });
      }
    }
  }

  // Gold bars between the lobby and the big room; they slide up when the timer starts.
  addGate(open) {
    const g = this.add.graphics();
    g.fillStyle(0x3a2450).fillRect(GATE_X, 0, ROOM_LEFT - GATE_X, FLOOR);
    g.fillStyle(0xc89a3c);
    for (let x = GATE_X + 1; x < ROOM_LEFT; x += 3) g.fillRect(x, 0, 1, FLOOR);
    for (let y = 8; y < FLOOR; y += 24) g.fillRect(GATE_X, y, ROOM_LEFT - GATE_X, 2);
    this.gateArt = g;
    this.gate = this.add.zone(GATE_X, 0, ROOM_LEFT - GATE_X, FLOOR).setOrigin(0);
    this.physics.add.existing(this.gate, true);
    if (open) this.openGate(true);
  }

  openGate(instant) {
    this.gate.body.enable = false;
    if (instant) this.gateArt.y = -FLOOR;
    else this.tweens.add({ targets: this.gateArt, y: -FLOOR, duration: 600, ease: 'Quad.easeIn' });
  }

  // A small bobbing arrow over the door or button you can use: press down.
  addHint() {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillTriangle(0, 0, 8, 0, 4, 5);
    g.generateTexture('bonus-hint', 8, 5);
    g.destroy();
    this.hint = this.add.image(0, 0, 'bonus-hint').setVisible(false).setDepth(6);
    this.hintBob = 0;
    this.tweens.add({ targets: this, hintBob: 3, duration: 300, yoyo: true, repeat: -1 });
  }

  addHud() {
    const { x: ux, y: uy } = this.ui;
    const text = (x, y, value, originX = 0) =>
      this.add
        .text(ux + x, uy + y, value, { fontFamily: FONT, fontSize: '8px', color: '#ffffff' })
        .setShadow(1, 1, '#1a1020', 0, false, true)
        .setOrigin(originX, 0)
        .setScrollFactor(0)
        .setDepth(10);
    this.add.image(ux + 10, uy + 9, 'rubber-duck').setScale(DUCK_SCALE).setScrollFactor(0).setDepth(10);
    this.countText = text(17, 5, 'x00');
    text(GAME_WIDTH / 2, 5, 'VIP DUCK ROOM', 0.5).setColor('#ffe680');
    text(GAME_WIDTH - 6, 5, 'TIME', 1);
    this.timeLeft = BONUS.timeLimit;
    this.timeText = text(GAME_WIDTH - 6, 15, this.state === 'done' ? '0' : String(this.timeLeft), 1);
  }

  // "Start the timer?" with YES and NO. Left/right picks; down, jump, Space or Enter confirms; or tap.
  openPopup() {
    this.state = 'popup';
    this.player.body.setVelocityX(0);
    this.flushPresses();
    const { x: ux, y: uy } = this.ui;
    const s = BONUS_SCALE;
    const px = ux + GAME_WIDTH / 2 - (232 * s) / 2;
    const py = uy + 30;
    const tx = px + POPUP_TEXT_BOX.x * s;
    const ty = py + POPUP_TEXT_BOX.y * s;
    const text = (x, y, value) =>
      this.add.text(x, y, value, { fontFamily: FONT, fontSize: '8px', color: '#ffffff' }).setResolution(ZOOM);
    const panel = this.add.image(px, py, 'bonus-popup').setOrigin(0).setScale(s);
    const question = text(tx, ty, 'START THE\nTIMER?').setLineSpacing(2);
    const yes = text(tx + 8, ty + 20, 'YES');
    const no = text(tx + 48, ty + 20, 'NO');
    this.popup = { parts: [panel, question, yes, no, text(tx, ty + 20, '>')], yes: true };
    this.popup.parts.forEach((p) => p.setScrollFactor(0).setDepth(20));
    this.popup.cursor = this.popup.parts[4];
    for (const [option, choice] of [[yes, true], [no, false]]) {
      option.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.closePopup(choice));
    }
  }

  updatePopup(time) {
    const { controls, popup, player } = this;
    player.body.setVelocityX(0);
    player.animate(time, player.body.blocked.down);
    if (controls.left()) popup.yes = true;
    if (controls.right()) popup.yes = false;
    popup.cursor.x = popup.parts[popup.yes ? 2 : 3].x - 8;
    const confirm = controls.downJustPressed() | controls.jumpJustPressed() | controls.shootJustPressed()
      | Phaser.Input.Keyboard.JustDown(this.enterKey);
    if (confirm) this.closePopup(popup.yes);
  }

  closePopup(start) {
    if (this.state !== 'popup') return;
    this.popup.parts.forEach((p) => p.destroy());
    this.popup = null;
    this.flushPresses();
    this.state = 'ready';
    if (start) this.startTimer();
  }

  startTimer() {
    this.state = 'running';
    this.timerButton.setTexture('button-timer-pressed');
    this.openGate(false);
    this.banner('GO!', 900);
    this.clock = this.time.addEvent({
      delay: 1000,
      repeat: BONUS.timeLimit - 1,
      callback: () => {
        this.timeLeft -= 1;
        this.timeText.setText(String(this.timeLeft));
        if (this.timeLeft === 0) this.timeUp();
      },
    });
  }

  collect(duck) {
    if (this.state !== 'running' || !duck.body.enable) return;
    duck.body.enable = false;
    this.tweens.killTweensOf(duck);
    this.tweens.add({ targets: duck, y: duck.y - 12, alpha: 0, duration: 200, onComplete: () => duck.destroy() });
    this.tweens.add({ targets: duck.cover, alpha: 0, duration: 120 });
    this.collected += 1;
    this.countText.setText(`x${String(this.collected).padStart(2, '0')}`);
  }

  // The ducks that are left vanish and the rest of the portrait fades in, piece by piece.
  timeUp() {
    this.state = 'done';
    this.clock?.remove();
    this.ducks.children.each((duck) => {
      if (!duck.body.enable) return;
      duck.body.enable = false;
      this.tweens.killTweensOf(duck);
      this.tweens.add({ targets: duck, scale: 0, alpha: 0, duration: 250, onComplete: () => duck.destroy() });
    });
    Phaser.Utils.Array.Shuffle(this.cells.filter((c) => c.alpha > 0)).forEach((cover, i) => {
      this.tweens.add({ targets: cover, alpha: 0, delay: 300 + i * 25, duration: 200 });
    });
    this.banner(`TIME UP!\n\n${this.collected} DUCKS`, 2500);
  }

  // Out through the VIP door, back to the step in the level.
  leave() {
    if (this.state === 'running') this.timeUp();
    const played = this.state === 'done';
    this.state = 'leaving';
    this.hint.setVisible(false);
    this.player.body.setVelocity(0, 0);
    this.door.setTexture('vip-door-open');
    this.tweens.add({ targets: this.player, alpha: 0, duration: 200 });
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.beat.stop();
      this.scene.wake('game', { ducks: this.collected, played });
      this.scene.stop();
    });
  }

  flushPresses() {
    const c = this.controls;
    c.downJustPressed();
    c.jumpJustPressed();
    c.shootJustPressed();
  }

  banner(value, ms) {
    const t = this.add
      .text(this.ui.x + GAME_WIDTH / 2, this.ui.y + 60, value, { fontFamily: FONT, fontSize: '16px', color: '#ffe680', align: 'center' })
      .setShadow(2, 2, '#1a1020', 0, false, true)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
    this.time.delayedCall(ms, () => t.destroy());
    return t;
  }
}
