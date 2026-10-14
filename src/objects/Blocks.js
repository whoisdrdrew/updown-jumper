import { TILE } from '../config.js';

// Tile indexes in the placeholder tileset.
export const T = { GRASS: 0, BLOCK: 1, PLATFORM: 2, DIRT: 3, NOTE: 4, USED: 5, BRICK: 6 };

// Blocks you hit from below, Super Mario World style:
//   brick blocks break into pieces,
//   music-note blocks (our "?" blocks) release what's inside and turn into empty blocks.
export default class Blocks {
  constructor(scene, layer, contents) {
    this.scene = scene;
    this.layer = layer;
    this.contents = contents; // Map of "x,y" tile coordinates -> 'duck' | 'egg'
    this.lastBumpFrame = -1;

    // Individual tile images, used for the bump animation.
    const tex = scene.textures.get('tiles');
    for (const index of [T.NOTE, T.USED, T.BRICK]) {
      if (!tex.has(String(index))) tex.add(String(index), 0, index * TILE, 0, TILE, TILE);
    }
  }

  // Called for every tile the player collides with. Only reacts to head bumps.
  onPlayerCollide(player, tile) {
    const body = player.body;
    if (!body.blocked.up || tile.pixelY + TILE > body.top + 2) return;
    // Head under two blocks at once: only the one most under the player counts, once per frame.
    const frame = this.scene.game.loop.frame;
    if (frame === this.lastBumpFrame) return;
    const centerTile = this.layer.getTileAtWorldXY(player.x, tile.pixelY);
    const target = centerTile?.collides ? centerTile : tile;
    this.lastBumpFrame = frame;

    if (target.index === T.BRICK) this.breakBrick(target);
    else if (target.index === T.NOTE) this.openNoteBlock(target);
  }

  breakBrick(tile) {
    const x = tile.getCenterX();
    const y = tile.getCenterY();
    this.layer.removeTileAt(tile.x, tile.y);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 0], [1, 0]]) {
      const piece = this.scene.add.rectangle(x + dx * 4, y + dy * 4, 6, 6, 0xb8642a);
      this.scene.tweens.add({ targets: piece, x: piece.x + dx * 30, y: piece.y - 30 + dy * 10, angle: dx * 180, duration: 250, ease: 'Quad.easeOut',
        onComplete: () => this.scene.tweens.add({ targets: piece, y: piece.y + 220, duration: 600, ease: 'Quad.easeIn', onComplete: () => piece.destroy() }) });
    }
  }

  openNoteBlock(tile) {
    const key = `${tile.x},${tile.y}`;
    const item = this.contents.get(key) ?? 'duck';
    this.contents.delete(key);
    this.layer.putTileAt(T.USED, tile.x, tile.y);
    this.bump(tile);
    this.scene.events.emit('block-item', item, tile.getCenterX(), tile.pixelY);
  }

  // The block jumps up a little and drops back.
  bump(tile) {
    const placed = this.layer.getTileAt(tile.x, tile.y);
    placed.setVisible(false);
    const img = this.scene.add.image(placed.getCenterX(), placed.getCenterY(), 'tiles', String(placed.index));
    this.scene.tweens.add({ targets: img, y: img.y - 5, duration: 70, yoyo: true,
      onComplete: () => { placed.setVisible(true); img.destroy(); } });
  }
}
