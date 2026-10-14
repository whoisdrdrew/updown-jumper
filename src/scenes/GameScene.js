import Phaser from 'phaser';
import { TILE } from '../config.js';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import RubberDucks from '../player/RubberDucks.js';
import Mangos from '../objects/Mangos.js';
import RideDucks from '../objects/RideDucks.js';
import { PLAYER } from '../config.js';
import testLevel from '../levels/testLevel.js';

// Tile indexes in the placeholder tileset.
const T = { GRASS: 0, BLOCK: 1, PLATFORM: 2, DIRT: 3 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.makePlaceholderTextures();
    const { map, layer, start, goal, mangos, eggs, pickups } = this.buildLevel(testLevel);
    const worldW = map.widthInPixels;
    const worldH = map.heightInPixels;

    this.addBackground(worldW, worldH);
    this.add.existing(layer);
    this.layer = layer;

    // Open bottom edge: falling into a pit leaves the world.
    this.physics.world.setBounds(0, 0, worldW, worldH, true, true, true, false);

    this.controls = new Controls(this);
    this.player = new Player(this, start.x, start.y, this.controls);
    this.physics.add.collider(this.player, layer);
    this.addItems(layer, mangos, eggs, pickups);

    this.addGoal(goal);

    const cam = this.cameras.main;
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
    this.physics.add.overlap(player, this.rideDucks.eggs, (_p, egg) => this.rideDucks.breakEgg(egg));
    this.physics.add.overlap(this.shots.group, this.rideDucks.eggs, (shot, egg) => {
      this.rideDucks.breakEgg(egg);
      this.shots.pop(shot);
    });
    this.physics.add.overlap(player, this.rideDucks.ducks, (_p, duck) => {
      if (player.riding || player.dead || !this.rideDucks.canMount(duck)) return;
      duck.destroy();
      player.mount();
    });

    // Rubber ducks to collect, like coins: each one is one shot.
    this.pickups = this.physics.add.staticGroup();
    for (const { x, y } of pickupPositions) {
      const duck = this.pickups.create(x, y, 'rubber-duck');
      this.tweens.add({ targets: duck, y: y - 2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.physics.add.overlap(player, this.pickups, (_p, duck) => {
      duck.body.enable = false;
      this.tweens.killTweensOf(duck);
      this.tweens.add({ targets: duck, y: duck.y - 14, alpha: 0, duration: 250, onComplete: () => duck.destroy() });
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

  // Top-left: hearts (one lost per hit, the last hit loses the life) and rubber ducks left to shoot.
  addHud() {
    this.hearts = [];
    for (let i = 0; i < PLAYER.maxHits; i++) {
      this.hearts.push(this.add.image(8 + i * 10, 8, 'heart').setScrollFactor(0).setDepth(10));
    }
    this.add.image(8, 20, 'rubber-duck').setScrollFactor(0).setDepth(10);
    this.ammoText = this.add
      .text(15, 15, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 })
      .setScrollFactor(0)
      .setDepth(10)
      .setResolution(4);
    this.updateHud();
  }

  updateHud() {
    const left = PLAYER.maxHits - this.player.hits;
    this.hearts.forEach((heart, i) => heart.setTexture(i < left ? 'heart' : 'heart-empty'));
    this.ammoText.setText(`x${this.player.ammo}`);
  }

  // Turns the text level into a Phaser tilemap with collisions.
  buildLevel(rows) {
    const width = Math.max(...rows.map((r) => r.length));
    let start = { x: TILE * 2, y: 0 };
    let goal = null;
    const mangos = [];
    const eggs = [];
    const pickups = [];

    const data = rows.map((row, y) =>
      [...row.padEnd(width, ' ')].map((ch, x) => {
        if (ch === 'P') start = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
        if (ch === 'F') goal = { x: x * TILE + TILE / 2, y: y * TILE };
        if (ch === 'M') mangos.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === 'o') pickups.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
        if (ch === 'E') eggs.push({ x: x * TILE + TILE / 2, y: (y + 1) * TILE });
        if (ch === '#') return rows[y - 1]?.[x] === '#' ? T.DIRT : T.GRASS;
        if (ch === 'B') return T.BLOCK;
        if (ch === '=') return T.PLATFORM;
        return -1;
      }),
    );

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles');
    const layer = map.createLayer(0, tileset, 0, 0);
    layer.setCollision([T.GRASS, T.BLOCK, T.DIRT]);
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
    return { map, layer, start, goal, mangos, eggs, pickups };
  }

  addGoal(goal) {
    if (!goal) return;
    // The pole runs from the F tile down to the ground below it.
    const groundY = this.findGroundBelow(goal.x, goal.y);
    const poleH = groundY - goal.y;
    this.add.rectangle(goal.x, goal.y + poleH / 2, 2, poleH, 0xeeeeee);
    this.add.triangle(goal.x + 1, goal.y + 6, 0, 0, 0, 10, 12, 5, 0x30d060).setOrigin(0, 0.5);

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
      .text(this.cameras.main.width / 2, 50, text, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setResolution(4);
  }

  // Distant hills and clouds that scroll slower than the level, so camera movement is easy to see.
  addBackground(worldW, worldH) {
    for (let x = 0; x < worldW; x += 140) {
      const h = 40 + ((x * 7) % 50);
      this.add.ellipse(x + 40, worldH - 40, 120, h * 2, 0x4a7fd8).setScrollFactor(0.4, 1);
    }
    for (let x = 30; x < worldW; x += 190) {
      this.add.rectangle(x, 24 + ((x * 3) % 40), 36, 10, 0xdce8ff).setScrollFactor(0.2, 1);
    }
  }

  // Simple colored tiles and player box, drawn in code. Replaced by real pixel art later.
  makePlaceholderTextures() {
    if (this.textures.exists('tiles')) return;
    const g = this.make.graphics({ add: false });

    // 0 grass-topped ground
    g.fillStyle(0x8a5a2b).fillRect(0, 0, 16, 16);
    g.fillStyle(0x3cb043).fillRect(0, 0, 16, 4);
    // 1 solid block
    g.fillStyle(0xb0b0b0).fillRect(16, 0, 16, 16);
    g.fillStyle(0x707070).fillRect(16, 15, 16, 1).fillRect(31, 0, 1, 16);
    g.fillStyle(0xe0e0e0).fillRect(16, 0, 16, 1).fillRect(16, 0, 1, 16);
    // 2 thin platform
    g.fillStyle(0xf0c040).fillRect(32, 0, 16, 5);
    g.fillStyle(0xa07020).fillRect(32, 4, 16, 1);
    // 3 dirt
    g.fillStyle(0x8a5a2b).fillRect(48, 0, 16, 16);
    g.fillStyle(0x6e4520).fillRect(52, 5, 2, 2).fillRect(58, 11, 2, 2);
    g.generateTexture('tiles', 64, 16);
    g.clear();

    // Player: red box with an eye on the facing side.
    g.fillStyle(0xe03030).fillRect(0, 0, 12, 16);
    g.fillStyle(0xffffff).fillRect(7, 3, 3, 4);
    g.fillStyle(0x000000).fillRect(9, 4, 1, 2);
    g.generateTexture('player', 12, 16);
    g.clear();

    // Small rubber duck (the shot), facing right.
    g.fillStyle(0xffd400).fillRect(0, 3, 7, 4).fillRect(3, 0, 4, 4);
    g.fillStyle(0xff7a00).fillRect(7, 2, 2, 1);
    g.fillStyle(0x000000).fillRect(5, 1, 1, 1);
    g.generateTexture('rubber-duck', 9, 7);
    g.clear();

    // Mango with a leaf.
    g.fillStyle(0xff9a1a).fillEllipse(5, 5, 10, 7);
    g.fillStyle(0xffd040).fillRect(2, 3, 3, 2);
    g.fillStyle(0x2f9e3a).fillRect(5, 0, 3, 2);
    g.generateTexture('mango', 10, 9);
    g.clear();

    // Spotted egg and one shell half.
    g.fillStyle(0xf4f4f4).fillEllipse(6, 7, 12, 14);
    g.fillStyle(0xffd400).fillRect(3, 4, 2, 2).fillRect(7, 8, 3, 2).fillRect(4, 10, 2, 2);
    g.generateTexture('egg', 12, 14);
    g.clear();
    g.fillStyle(0xf4f4f4).fillRect(0, 0, 6, 8);
    g.fillStyle(0xffd400).fillRect(2, 3, 2, 2);
    g.generateTexture('egg-half', 6, 8);
    g.clear();

    // Big ride-on duck, facing right.
    const bigDuck = (oy) => {
      g.fillStyle(0xffd400).fillRect(0, oy + 5, 15, 8).fillRect(9, oy, 7, 7);
      g.fillStyle(0xe8b800).fillRect(2, oy + 7, 7, 3); // wing
      g.fillStyle(0xff7a00).fillRect(16, oy + 3, 2, 2).fillRect(4, oy + 13, 3, 1).fillRect(10, oy + 13, 3, 1);
      g.fillStyle(0x000000).fillRect(13, oy + 2, 1, 2);
    };
    bigDuck(0);
    g.generateTexture('big-duck', 18, 14);
    g.clear();

    // Player riding the duck: the box sits on the duck's back, behind its head.
    bigDuck(8);
    g.fillStyle(0xe03030).fillRect(0, 0, 9, 14);
    g.fillStyle(0xffffff).fillRect(5, 3, 3, 4);
    g.fillStyle(0x000000).fillRect(7, 4, 1, 2);
    g.generateTexture('rider', 18, 22);
    g.clear();

    // Hearts for the HUD.
    const heart = (color) => {
      g.fillStyle(0x000000).fillRect(0, 1, 9, 4).fillRect(1, 0, 3, 7).fillRect(5, 0, 3, 7).fillRect(2, 5, 5, 2).fillRect(3, 7, 3, 1);
      g.fillStyle(color).fillRect(1, 1, 3, 4).fillRect(5, 1, 3, 4).fillRect(2, 4, 5, 2).fillRect(3, 6, 3, 1).fillRect(4, 1, 1, 3);
    };
    heart(0xff3050);
    g.generateTexture('heart', 9, 8);
    g.clear();
    heart(0x444444);
    g.generateTexture('heart-empty', 9, 8);
    g.destroy();
  }
}
