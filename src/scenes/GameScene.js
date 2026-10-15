import Phaser from 'phaser';
import { TILE } from '../config.js';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import RubberDucks from '../player/RubberDucks.js';
import Mangos from '../objects/Mangos.js';
import RideDucks from '../objects/RideDucks.js';
import Blocks, { T } from '../objects/Blocks.js';
import Suitcase from '../objects/Suitcase.js';
import { PLAYER, GAME_WIDTH, LEVEL_TIME, ZOOM } from '../config.js';
import { createSprites, preloadSprites, DUCK_SCALE, ITEM_SCALE } from '../art/sprites.js';
import { preloadTiles, TILE_ART, TILE_SCALE } from '../art/tiles.js';
import { createBackground, preloadBackground } from '../art/background.js';

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
  }

  create() {
    // Zoom first: the fixed background and top bar are placed relative to the zoomed view.
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    this.ui = { x: (cam.width - cam.width / ZOOM) / 2, y: (cam.height - cam.height / ZOOM) / 2 };
    createSprites(this);
    const { map, layer, view, start, goal, mangos, eggs, pickups, blockContents, suitcase } = this.buildLevel(testLevel);
    const worldW = map.widthInPixels;
    const worldH = map.heightInPixels;

    this.updateBackground = createBackground(this, worldW, worldH);
    this.add.existing(layer);
    this.add.existing(view);
    this.layer = layer;

    // Open bottom edge: falling into a pit leaves the world.
    this.physics.world.setBounds(0, 0, worldW, worldH, true, true, true, false);

    this.controls = new Controls(this);
    this.player = new Player(this, start.x, start.y, this.controls);
    this.blocks = new Blocks(this, layer, view, blockContents);
    this.physics.add.collider(this.player, layer, (player, tile) => this.blocks.onPlayerCollide(player, tile));
    this.addItems(layer, mangos, eggs, pickups);
    if (suitcase) this.suitcase = new Suitcase(this, this.player, suitcase);

    this.addGoal(goal);

    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.2, 0.2);
    cam.setDeadzone(24, 48);
    cam.setRoundPixels(true);

    this.addHud();
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.finished = false;
    this.worldH = worldH;
  }

  update(time, delta) {
    this.updateBackground(time);
    if (this.finished) return;
    this.player.update(time, delta);
    this.shots.update();
    this.rideDucks.update();
    if (this.player.y > this.worldH + 32) this.respawn();
  }

  // Rubber-duck shots, mangos and the ride-on duck, and how they touch each other.
  addItems(layer, mangoPositions, eggPositions, pickupPositions) {
    const player = this.player;
    this.shots = new RubberDucks(this, layer);
    player.shots = this.shots;
    this.mangos = new Mangos(this, mangoPositions);
    this.rideDucks = new RideDucks(this, layer, eggPositions);

    this.physics.add.overlap(player, this.mangos.group, (_p, mango) => {
      if (player.invulnerable) return;
      this.mangos.squash(mango);
      player.slipOnMango();
    });
    this.physics.add.overlap(this.shots.group, this.mangos.group, (shot, mango) => {
      this.mangos.knockAway(mango, shot.dir);
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

    // What comes out of a music-note block: a rubber duck (collected right away) or the duck egg.
    this.events.on('block-item', (item, x, y) => {
      if (item === 'egg') return this.rideDucks.popEgg(x, y);
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
    const text = (x, y, value, originX = 0) =>
      this.add
        .text(ux + x, uy + y, value, { fontFamily: FONT, fontSize: '8px', color: '#ffffff', align: 'center' })
        .setShadow(1, 1, '#1a1020', 0, false, true)
        .setOrigin(originX, 0)
        .setScrollFactor(0)
        .setDepth(10);

    this.hearts = [];
    for (let i = 0; i < PLAYER.maxHits; i++) {
      this.hearts.push(this.add.image(ux + 10 + i * 10, uy + 9, 'heart').setScale(ITEM_SCALE).setScrollFactor(0).setDepth(10));
    }
    this.add.image(ux + 10, uy + 22, 'rubber-duck').setScale(DUCK_SCALE).setScrollFactor(0).setDepth(10);
    this.ammoText = text(17, 18, '');
    text(GAME_WIDTH / 2, 5, 'UP DOWN JUMPER', 0.5).setColor('#ffe680');
    text(GAME_WIDTH / 2, 15, 'IBIZA WORLD 1-1', 0.5);
    text(GAME_WIDTH - 6, 5, 'TIME', 1);
    this.timeText = text(GAME_WIDTH - 6, 15, '', 1);

    // Mario-style clock: when it runs out, the life is lost.
    this.timeLeft = LEVEL_TIME;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished || this.player.dead) return;
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
    const mangos = [];
    const eggs = [];
    const pickups = [];
    let suitcase = null;
    const blockContents = new Map();

    const data = rows.map((row, y) =>
      [...row.padEnd(width, ' ')].map((ch, x) => {
        if (ch === 'P') start = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
        if (ch === 'F') goal = { x: x * TILE + TILE / 2, y: y * TILE };
        if (ch === 'M') mangos.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === 'o') pickups.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
        if (ch === 'S') suitcase = { x: x * TILE + TILE / 2, y: (y + 1) * TILE };
        if (ch === 'E') eggs.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === '#') return rows[y - 1]?.[x] === '#' ? T.DIRT : T.GRASS;
        if (ch === 'B') return T.BLOCK;
        if (ch === 'b') return T.BRICK;
        if (ch === 'N' || ch === 'Y') {
          blockContents.set(`${x},${y}`, ch === 'Y' ? 'egg' : 'duck');
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
    return { map, layer, view, start, goal, mangos, eggs, pickups, blockContents, suitcase };
  }

  addGoal(goal) {
    if (!goal) return;
    // The pole runs from the F tile down to the ground below it.
    const groundY = this.findGroundBelow(goal.x, goal.y);
    const poleH = groundY - goal.y;
    this.add.tileSprite(goal.x, goal.y + 2, 6, (poleH - 2) / ITEM_SCALE, 'goal-pole').setOrigin(0.5, 0).setScale(ITEM_SCALE);
    this.add.image(goal.x - 2, goal.y - 2, 'goal-flag').setOrigin(0, 0).setScale(ITEM_SCALE);

    const zone = this.add.zone(goal.x, goal.y + poleH / 2, 10, poleH);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => this.levelClear());
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
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.banner('LEVEL CLEAR!');
    this.time.delayedCall(2000, () => this.scene.restart());
  }

  respawn() {
    this.finished = true;
    this.cameras.main.flash(200, 255, 255, 255);
    this.banner('OOPS!');
    this.time.delayedCall(800, () => this.scene.restart());
  }

  banner(text) {
    this.add
      .text(this.ui.x + GAME_WIDTH / 2, this.ui.y + 60, text, { fontFamily: FONT, fontSize: '16px', color: '#ffe680' })
      .setShadow(2, 2, '#1a1020', 0, false, true)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
  }
}
