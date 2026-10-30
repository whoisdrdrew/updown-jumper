import Phaser from 'phaser';
import { TILE } from '../config.js';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import RubberDucks from '../player/RubberDucks.js';
import Securities from '../objects/Securities.js';
import HeadSecurity from '../objects/HeadSecurity.js';
import RideDucks from '../objects/RideDucks.js';
import Burgers from '../objects/Burgers.js';
import Blocks, { T } from '../objects/Blocks.js';
import Suitcase from '../objects/Suitcase.js';
import Boss from '../objects/Boss.js';
import takeWinnerPhoto from '../objects/WinnerPhoto.js';
import { addExitButton, preloadExitButton, EXIT_BUTTON_WIDTH } from '../objects/ExitButton.js';
import { PLAYER, GAME_WIDTH, LEVEL_TIME, ZOOM, BOSS, BONUS, SECURITY } from '../config.js';
import { createSprites, preloadSprites, DUCK_SCALE, ITEM_SCALE } from '../art/sprites.js';
import { preloadTiles, TILE_ART, TILE_SCALE } from '../art/tiles.js';
import { createBackground, preloadBackground } from '../art/background.js';
import { preloadBonus, BONUS_SCALE } from '../art/bonus.js';
import { preloadFelix } from '../art/felix.js';
import { touch } from '../touch/TouchControls.js';
import { markLevelDone, chosenDj } from '../progress.js';
import { djById } from '../djs.js';
import { CARD_WINDOW } from '../art/home.js';

const FONT = '"Press Start 2P", monospace';
import testLevel from '../levels/testLevel.js';


export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  preload() {
    preloadSprites(this);
    preloadTiles(this);
    preloadBackground(this);
    preloadBonus(this);
    preloadFelix(this);
    preloadExitButton(this);
  }

  create(data) {
    // Which level (1..10) this is; a restart keeps the one being played. Only level 1 is built so far.
    this.level = data?.level ?? this.level ?? 1;
    this.winnerPhoto = null;
    // Zoom first: the fixed background and top bar are placed relative to the zoomed view.
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    this.ui = { x: (cam.width - cam.width / ZOOM) / 2, y: (cam.height - cam.height / ZOOM) / 2 };
    createSprites(this);
    const { map, layer, view, start, goal, guards, eggs, pickups, blockContents, suitcase, bossAt, vipDoor, chiefs } = this.buildLevel(testLevel);
    const worldW = map.widthInPixels;
    const worldH = map.heightInPixels;

    this.updateBackground = createBackground(this, worldW, worldH);
    this.add.existing(layer);
    this.add.existing(view);
    this.layer = layer;
    this.map = map;

    // Open top and bottom edges: a jump can go a little past the top of the screen (no invisible
    // ceiling), and falling into a pit leaves the world.
    this.physics.world.setBounds(0, 0, worldW, worldH, true, true, false, false);

    this.controls = new Controls(this);
    this.player = new Player(this, start.x, start.y, this.controls, djById(chosenDj()).skin);
    this.blocks = new Blocks(this, layer, view, blockContents);
    this.physics.add.collider(this.player, layer, (player, tile) => this.blocks.onPlayerCollide(player, tile));
    this.addItems(layer, guards, eggs, pickups);
    this.addHeadSecurity(layer, chiefs);
    if (suitcase) this.suitcase = new Suitcase(this, this.player, suitcase);

    this.goalX = undefined;
    this.addGoal(goal);
    if (vipDoor) this.vipDoor = this.add.image(vipDoor.x, vipDoor.y, 'vip-door').setOrigin(0.5, 1).setScale(BONUS_SCALE).setDepth(1);
    this.bonusPlayed = false;
    this.cutscene = false;
    this.inBonus = false;

    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.2, 0.2);
    cam.setDeadzone(24, 48);
    cam.setRoundPixels(true);

    this.addHud();
    if (bossAt) this.addBossArena(bossAt);
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-S', () => this.scene.start('intro', { room: 'bedroom' })); // S: the story again
    this.finished = false;
    this.worldH = worldH;
  }

  update(time, delta) {
    this.updateBackground(time);
    if (this.finished || this.inBonus) return;
    if (this.cutscene) return this.player.animate(time, this.player.body.blocked.down);
    // Up at the VIP door goes in (checked first, so that press doesn't also jump).
    if (this.atVipDoor() && this.controls.upJustPressed()) return this.enterBonus();
    this.player.update(time, delta);
    this.shots.update();
    this.rideDucks.update();
    this.burgers.update();
    this.securities.update();
    this.headSecurity.update();
    if (this.boss?.active) this.boss.update(time);
    if (this.goalX !== undefined && this.player.body.right >= this.goalX && !this.player.dead) return this.levelClear();
    if (this.player.y > this.worldH + 32) this.respawn();
  }

  // The head of security: walk into him and he shoves you like a bouncer, he punches when he
  // catches you, and it takes two stomps or two rubber ducks to knock him out.
  addHeadSecurity(layer, positions) {
    const player = this.player;
    this.headSecurity = new HeadSecurity(this, positions, layer);
    this.physics.add.overlap(player, this.headSecurity.group, (_p, chief) => {
      if (player.dead) return;
      if (this.headSecurity.isStomp(player, chief)) {
        this.headSecurity.hit(chief, 0);
        player.body.setVelocityY(-SECURITY.stompBounce);
        return;
      }
      if (player.invulnerable) return;
      this.headSecurity.touched(chief);
    });
    this.physics.add.overlap(this.shots.group, this.headSecurity.group, (shot, chief) => {
      this.headSecurity.hit(chief, shot.dir);
      this.shots.pop(shot);
    });
  }

  // Rubber-duck shots, security bouncers and the ride-on duck, and how they touch each other.
  addItems(layer, guardPositions, eggPositions, pickupPositions) {
    const player = this.player;
    this.shots = new RubberDucks(this, layer);
    player.shots = this.shots;
    this.securities = new Securities(this, guardPositions, layer);
    this.rideDucks = new RideDucks(this, layer, eggPositions);
    this.burgers = new Burgers(this, layer);

    // The burger power-up: open the box by touching or shooting it, then eat the burger.
    this.physics.add.overlap(player, this.burgers.boxes, (_p, box) => this.burgers.touchBox(box));
    this.physics.add.overlap(this.shots.group, this.burgers.boxes, (shot, box) => {
      this.burgers.touchBox(box);
      this.shots.pop(shot);
    });
    this.physics.add.overlap(player, this.burgers.burgers, (_p, burger) => {
      if (!player.dead && this.burgers.eat(burger)) player.growBig();
    });

    // Jump on a bouncer's head to knock him out; walk into him and he shoves you back.
    this.physics.add.overlap(player, this.securities.group, (_p, guard) => {
      if (player.dead) return;
      if (this.securities.isStomp(player, guard)) {
        this.securities.stomp(guard);
        player.body.setVelocityY(-SECURITY.stompBounce);
        return;
      }
      if (player.invulnerable) return;
      this.securities.shoved(guard, player.x);
      player.shovedFrom(guard.x);
    });
    this.physics.add.overlap(this.shots.group, this.securities.group, (shot, guard) => {
      this.securities.knockAway(guard, shot.dir);
      this.shots.pop(shot);
    });

    // Break the egg by touching it or hitting it with a rubber duck.
    const eggs = [this.rideDucks.eggs, this.rideDucks.poppedEggs];
    this.physics.add.overlap(player, eggs, (_p, egg) => this.rideDucks.breakEgg(egg));
    this.physics.add.overlap(this.shots.group, eggs, (shot, egg) => {
      this.rideDucks.breakEgg(egg);
      this.shots.pop(shot);
    });
    this.physics.add.overlap(player, this.rideDucks.ducks, (_p, duck) => {
      if (player.riding || player.dead || !this.rideDucks.canMount(duck)) return;
      player.mount();
      this.rideDucks.onMounted();
    });

    // Rubber ducks to collect, like coins: each one is one shot.
    this.pickups = this.physics.add.staticGroup();
    for (const { x, y } of pickupPositions) {
      const duck = this.pickups.create(x, y, 'rubber-duck').setScale(DUCK_SCALE).refreshBody();
      this.tweens.add({ targets: duck, y: y - 2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.physics.add.overlap(player, this.pickups, (_p, duck) => {
      duck.body.enable = false;
      this.tweens.killTweensOf(duck);
      this.tweens.add({ targets: duck, y: duck.y - 14, alpha: 0, duration: 250, onComplete: () => duck.destroy() });
      player.addAmmo(1);
    });

    // What comes out of a music-note block: a rubber duck (collected right away), the duck egg or
    // the burger box.
    this.events.on('block-item', (item, x, y) => {
      if (item === 'egg') return this.rideDucks.popEgg(x, y);
      if (item === 'burger') return this.burgers.popBox(x, y, player.facing);
      const duck = this.add.image(x, y - 4, 'rubber-duck').setScale(DUCK_SCALE);
      this.tweens.add({ targets: duck, y: y - 28, duration: 250, ease: 'Quad.easeOut', yoyo: true, hold: 60,
        onComplete: () => duck.destroy() });
      player.addAmmo(1);
    });

    player.on('ammo', () => this.updateHud());
    player.on('dismount', (x, y, dir) => this.rideDucks.flee(x, y, dir));
    player.on('hurt', () => this.updateHud());
    player.on('dead', () => {
      this.banner('OUCH!');
      this.time.delayedCall(1500, () => this.scene.restart());
    });
  }

  // Top bar in the style of the reference: hearts and rubber ducks left, world name centre, time right.
  addHud() {
    const { x: ux, y: uy } = this.ui;
    addExitButton(this, () => this.scene.start('home'));
    const left = 10 + EXIT_BUTTON_WIDTH + 4; // hearts and ducks sit right of the EXIT button
    const text = (x, y, value, originX = 0) =>
      this.add
        .text(ux + x, uy + y, value, { fontFamily: FONT, fontSize: '8px', color: '#ffffff', align: 'center' })
        .setShadow(1, 1, '#1a1020', 0, false, true)
        .setOrigin(originX, 0)
        .setScrollFactor(0)
        .setDepth(10);

    this.hearts = [];
    for (let i = 0; i < PLAYER.maxHits; i++) {
      this.hearts.push(this.add.image(ux + left + i * 10, uy + 9, 'heart').setScale(ITEM_SCALE).setScrollFactor(0).setDepth(10));
    }
    this.add.image(ux + left, uy + 22, 'rubber-duck').setScale(DUCK_SCALE).setScrollFactor(0).setDepth(10);
    this.ammoText = text(left + 7, 18, '');
    text(GAME_WIDTH / 2, 5, 'UP DOWN JUMPER', 0.5).setColor('#ffe680');
    text(GAME_WIDTH / 2, 15, 'TULUM WORLD 1-1', 0.5);
    text(GAME_WIDTH - 6, 5, 'TIME', 1);
    this.timeText = text(GAME_WIDTH - 6, 15, '', 1);

    // Mario-style clock: when it runs out, the life is lost.
    this.timeLeft = LEVEL_TIME;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished || this.cutscene || this.player.dead) return;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this.updateHud();
        if (this.timeLeft === 0) this.player.die();
      },
    });
    this.updateHud();
  }

  updateHud() {
    const left = PLAYER.maxHits - this.player.hits;
    this.hearts.forEach((heart, i) => heart.setTexture(i < left ? 'heart' : 'heart-empty'));
    this.ammoText.setText(`x${String(this.player.ammo).padStart(2, '0')}`);
    this.timeText.setText(String(this.timeLeft));
  }

  // Turns the text level into a Phaser tilemap with collisions.
  buildLevel(rows) {
    const width = Math.max(...rows.map((r) => r.length));
    let start = { x: TILE * 2, y: 0 };
    let goal = null;
    const guards = [];
    const chiefs = [];
    const eggs = [];
    const pickups = [];
    let suitcase = null;
    let bossAt = null;
    let vipDoor = null;
    const blockContents = new Map();

    const data = rows.map((row, y) =>
      [...row.padEnd(width, ' ')].map((ch, x) => {
        if (ch === 'P') start = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
        if (ch === 'F') goal = { x: x * TILE + TILE / 2, y: y * TILE };
        if (ch === 'G') guards.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === 'C') chiefs.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === 'o') pickups.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
        if (ch === 'S') suitcase = { x: x * TILE + TILE / 2, y: (y + 1) * TILE };
        if (ch === 'K') bossAt = { x: x * TILE + TILE / 2, y: y * TILE };
        if (ch === 'V') vipDoor = { x: x * TILE + TILE / 2, y: (y + 1) * TILE };
        if (ch === 'E') eggs.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === '#') return rows[y - 1]?.[x] === '#' ? T.DIRT : T.GRASS;
        if (ch === 'B') return T.BLOCK;
        if (ch === 'b') return T.BRICK;
        if (ch === 'N' || ch === 'Y' || ch === 'H') {
          blockContents.set(`${x},${y}`, { Y: 'egg', H: 'burger' }[ch] ?? 'duck');
          return T.NOTE;
        }
        if (ch === '=') return T.PLATFORM;
        return -1;
      }),
    );

    // Collisions use a 16 px tilemap that is never drawn. What you see is a second tilemap with the
    // same tiles drawn at the hero's pixel size (32 px), shown at half size. Blocks.js keeps both in step.
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const layer = map.createLayer(0, map.addTilesetImage('tiles', 'tiles', TILE, TILE), 0, 0).setVisible(false);
    const viewMap = this.make.tilemap({ data, tileWidth: TILE_ART, tileHeight: TILE_ART });
    const view = viewMap.createLayer(0, viewMap.addTilesetImage('tiles'), 0, 0).setScale(TILE_SCALE);
    layer.setCollision([T.GRASS, T.BLOCK, T.DIRT, T.NOTE, T.USED, T.BRICK]);
    // Thin platforms only block from above.
    layer.forEachTile((tile) => {
      if (tile.index !== T.PLATFORM) return;
      tile.setCollision(false, false, true, false);
      // Phaser treats a solid tile under a colliding tile as interior and drops its top face,
      // which would let the player fall through ground below a platform. Keep that face solid.
      const below = layer.getTileAt(tile.x, tile.y + 1);
      if (below?.collides) below.faceTop = true;
    });
    this.children.remove(layer); // re-added after the background so it draws on top
    this.children.remove(view);
    return { map, layer, view, start, goal, guards, eggs, pickups, blockContents, suitcase, bossAt, vipDoor, chiefs };
  }

  addGoal(goal) {
    if (!goal) return;
    // The pole runs from the F tile down to the ground below it.
    const groundY = this.findGroundBelow(goal.x, goal.y);
    const poleH = groundY - goal.y;
    this.add.tileSprite(goal.x, goal.y + 2, 6, (poleH - 2) / ITEM_SCALE, 'goal-pole').setOrigin(0.5, 0).setScale(ITEM_SCALE);
    this.add.image(goal.x - 2, goal.y - 2, 'goal-flag').setOrigin(0, 0).setScale(ITEM_SCALE);

    // Reaching the flag ends the level: touching the pole, or getting past it at any height (even
    // jumping right over it).
    this.goalX = goal.x - 3;
  }

  // The boss arena: one screen wide, centred on the K in the level. Walking in shuts it, like the
  // boss rooms in Mario 3, and it opens again (on the way to the flag) once Solomun is beaten.
  addBossArena(at) {
    const floor = this.findGroundBelow(at.x, at.y);
    const half = GAME_WIDTH / 2;
    this.arena = { centerX: at.x, left: at.x - half, right: at.x + half, floor, top: 0 };
    const zone = this.add.zone(this.arena.left + 48, floor - 40, 8, 80);
    this.physics.add.existing(zone, true);
    const trigger = this.physics.add.overlap(this.player, zone, () => {
      trigger.destroy();
      this.startBossFight();
    });
  }

  startBossFight() {
    const { arena, player } = this;
    const cam = this.cameras.main;
    this.physics.world.setBounds(arena.left, 0, GAME_WIDTH, this.worldH, true, true, false, false);
    cam.stopFollow();
    cam.pan(arena.centerX, cam.midPoint.y, 500, 'Sine.easeInOut', false, (_c, done) => {
      if (!done) return;
      cam.setBounds(arena.left, 0, GAME_WIDTH, this.worldH);
      cam.startFollow(player, true, 0.2, 0.2);
    });
    const title = this.banner('SOLOMUN!');
    this.time.delayedCall(1600, () => title.destroy());

    const boss = (this.boss = new Boss(this, arena));
    this.physics.add.overlap(player, boss, () => {
      if (player.dead || boss.mode === 'defeated') return;
      const stomp = player.body.velocity.y > 0 && player.body.bottom < boss.body.top + 10;
      if (stomp) {
        boss.takeHit();
        player.body.setVelocityY(-BOSS.stompBounce);
      } else if (boss.hurtable) {
        player.takeHit();
      }
    });
    this.physics.add.overlap(this.shots.group, boss, (_b, shot) => {
      if (!shot.active || !boss.hurtable) return;
      boss.takeHit();
      this.shots.pop(shot);
    });

    // His hit points under the clock, like a boss bar.
    const { x: ux, y: uy } = this.ui;
    const right = ux + GAME_WIDTH - 6;
    this.bossHud = [this.add.image(right - 38, uy + 31, 'solomun-portrait').setScale(0.5).setOrigin(1, 0.5)];
    for (let i = 0; i < BOSS.hits; i++) {
      this.bossHud.push(this.add.image(right - 30 + i * 10, uy + 31, 'heart').setScale(ITEM_SCALE));
    }
    this.bossHud.forEach((o) => o.setScrollFactor(0).setDepth(10));

    boss.on('hit', (left) => this.bossHud.slice(1).forEach((h, i) => h.setTexture(i < left ? 'heart' : 'heart-empty')));
    boss.on('defeated', () => this.endBossFight());
  }

  endBossFight() {
    const cam = this.cameras.main;
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.worldH, true, true, false, false);
    cam.setBounds(0, 0, this.map.widthInPixels, this.worldH);
    this.bossHud.forEach((o) => o.destroy());
    const text = this.banner('YOU WIN!');
    this.time.delayedCall(1800, () => text.destroy());
    // Felix the Photographer takes the winner photo; the player waits until it's done.
    this.cutscene = true;
    takeWinnerPhoto(this, this.player, this.boss, () => { this.cutscene = false; });
  }

  // Standing on the VIP door's platform, right in front of it.
  atVipDoor() {
    const { player, vipDoor } = this;
    return vipDoor && !player.dead && player.body.blocked.down && Math.abs(player.x - vipDoor.x) <= BONUS.doorReach
      && Math.abs(player.body.bottom - vipDoor.y) < 4;
  }

  // Through the VIP door into the duck bonus room (BonusScene). This scene sleeps meanwhile, so
  // the level, its clock and everything in it wait exactly as they were.
  enterBonus() {
    const { player } = this;
    this.inBonus = true;
    player.body.setVelocity(0, 0);
    this.vipDoor.setTexture('vip-door-open');
    this.tweens.add({ targets: player, alpha: 0, duration: 200 });
    const cam = this.cameras.main;
    cam.fadeOut(250);
    cam.once('camerafadeoutcomplete', () => {
      this.events.once('wake', (_sys, result) => this.leaveBonus(result));
      this.scene.launch('bonus', { level: this.level, big: player.big, masked: player.masked, played: this.bonusPlayed });
      this.scene.sleep();
    });
  }

  // Back out of the door with the ducks collected in there (each one is a shot).
  leaveBonus({ ducks = 0, played = false } = {}) {
    this.bonusPlayed ||= played;
    this.cameras.main.fadeIn(250);
    this.player.setAlpha(1);
    if (ducks) this.player.addAmmo(ducks);
    this.time.delayedCall(300, () => this.vipDoor.setTexture('vip-door'));
    // Forget presses made in the room, so the up that left it doesn't go straight back in.
    for (const flag of ['jumpQueued', 'shootQueued', 'downQueued', 'upQueued']) {
      this.controls[flag] = false;
      touch[flag] = false;
    }
    this.input.keyboard.resetKeys();
    this.inBonus = false;
  }

  findGroundBelow(x, y) {
    for (let ty = y; ty < this.layer.height; ty += TILE) {
      const tile = this.layer.getTileAtWorldXY(x, ty);
      if (tile && tile.collides) return ty - (ty % TILE);
    }
    return y + TILE * 4;
  }

  levelClear() {
    if (this.finished) return;
    this.finished = true;
    this.player.body.setVelocityX(0); // and if he jumped over the flag, he comes down to the ground
    this.banner('LEVEL CLEAR!');
    // Saved with its winner photo; the home screen hangs the photo on the level's card.
    markLevelDone(this.level, this.winnerPhoto && shrinkPhoto(this.winnerPhoto));
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(250, 18, 8, 28);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('home', { justDone: this.level }));
    });
  }

  respawn() {
    this.finished = true;
    this.cameras.main.flash(200, 255, 255, 255);
    this.banner('OOPS!');
    this.time.delayedCall(800, () => this.scene.restart());
  }

  banner(text) {
    return this.add
      .text(this.ui.x + GAME_WIDTH / 2, this.ui.y + 60, text, { fontFamily: FONT, fontSize: '16px', color: '#ffe680' })
      .setShadow(2, 2, '#1a1020', 0, false, true)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
  }
}

// The card's window is tiny, so its copy of the winner photo is cropped in closer, to the two of them
// from the knees up (fractions of the photo, kept at the window's shape).
const CARD_CROP = { x: 0.16, y: 0.04, w: 0.68 };

// The winner photo cropped and shrunk to the size of a card's window on the home screen, as a small
// PNG to save.
function shrinkPhoto(image) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WINDOW.w;
  canvas.height = CARD_WINDOW.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const sw = image.width * CARD_CROP.w;
  const sh = (sw * CARD_WINDOW.h) / CARD_WINDOW.w;
  ctx.drawImage(image, image.width * CARD_CROP.x, image.height * CARD_CROP.y, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
