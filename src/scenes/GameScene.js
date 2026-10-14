import Phaser from 'phaser';
import { TILE } from '../config.js';
import Player from '../player/Player.js';
import Controls from '../player/Controls.js';
import testLevel from '../levels/testLevel.js';

// Tile indexes in the placeholder tileset.
const T = { GRASS: 0, BLOCK: 1, PLATFORM: 2, DIRT: 3 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.makePlaceholderTextures();
    const { map, layer, start, goal } = this.buildLevel(testLevel);
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

    this.addGoal(goal);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.2, 0.2);
    cam.setDeadzone(24, 48);
    cam.setRoundPixels(true);

    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.finished = false;
    this.worldH = worldH;
  }

  update(time, delta) {
    if (this.finished) return;
    this.player.update(time, delta);
    if (this.player.y > this.worldH + 32) this.respawn();
  }

  // Turns the text level into a Phaser tilemap with collisions.
  buildLevel(rows) {
    const width = Math.max(...rows.map((r) => r.length));
    let start = { x: TILE * 2, y: 0 };
    let goal = null;

    const data = rows.map((row, y) =>
      [...row.padEnd(width, ' ')].map((ch, x) => {
        if (ch === 'P') start = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
        if (ch === 'F') goal = { x: x * TILE + TILE / 2, y: y * TILE };
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
      if (tile.index === T.PLATFORM) tile.setCollision(false, false, true, false);
    });
    this.children.remove(layer); // re-added after the background so it draws on top
    return { map, layer, start, goal };
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
    g.destroy();
  }
}
