import tilesImage from './world/tiles.png';
import { TILE } from '../config.js';

// The level tileset (tools/world_art.py): warm stone bricks with a gold rim, like the club reference.
// Order must match T in objects/Blocks.js: grass(top), block, platform, dirt(fill), note, used, brick.
// Each tile is drawn at twice the world resolution (the hero's pixel size) and shown at half size.
export const TILE_ART = TILE * 2;
export const TILE_SCALE = TILE / TILE_ART;

export function preloadTiles(scene) {
  scene.load.image('tiles', tilesImage);
}
