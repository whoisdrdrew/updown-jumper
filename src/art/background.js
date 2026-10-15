import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import skyImage from './world/bg-sky.png';
import venueImage from './world/bg-venue.png';
import crowdImage from './world/bg-crowd.png';
import waterImage from './world/bg-water.png';

// Club-at-sunset backdrop in layers that scroll at different speeds:
// sky, the venue with its stage screen, moving light beams, the crowd and palms, and water in the pits.

// The layers are drawn by tools/world_art.py at the hero's pixel size (twice the world resolution)
// and shown at half size.
const ART_SCALE = 0.5;

export function preloadBackground(scene) {
  scene.load.image('bg-sky', skyImage);
  scene.load.image('bg-venue', venueImage);
  scene.load.image('bg-crowd', crowdImage);
  scene.load.image('bg-water', waterImage);
}

export function createBackground(scene, worldW, worldH) {
  // Fixed layers sit at the camera's zoom offset, so they fill the zoomed view.
  const cam = scene.cameras.main;
  const ox = (cam.width - cam.width / cam.zoom) / 2;
  const oy = (cam.height - cam.height / cam.zoom) / 2;

  // A tile sprite of the full art size, scaled down: one picture pixel is one screen pixel.
  const layer = (key, x, y, w, h, scroll) =>
    scene.add.tileSprite(x, y, w / ART_SCALE, h / ART_SCALE, key).setOrigin(0).setScale(ART_SCALE).setScrollFactor(scroll);

  scene.add.image(ox, oy, 'bg-sky').setOrigin(0).setScale(ART_SCALE).setScrollFactor(0);
  const venue = layer('bg-venue', ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);

  // Light beams sweeping from the roof, drawn additively so they glow.
  const beams = [];
  const beamColors = [0x7ad0ff, 0xff5a8a, 0x7ad0ff, 0xffd060, 0xff5a8a];
  beamColors.forEach((color, i) => {
    const beam = scene.add
      .triangle(0, oy, 0, 0, -14, 150, 14, 150, color, 0.18)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScrollFactor(0);
    beam.baseX = ox + 30 + i * 65;
    beams.push(beam);
    scene.tweens.add({ targets: beam, angle: { from: -25, to: 25 }, duration: 1800 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200 });
  });

  const crowd = layer('bg-crowd', ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);
  // Water fills the pits; the ground tiles cover it everywhere else.
  const water = layer('bg-water', 0, worldH - 36, worldW, 40, 1);

  return function update(time) {
    // tilePosition counts picture pixels, two per world pixel.
    venue.tilePositionX = (cam.scrollX * 0.15) / ART_SCALE;
    crowd.tilePositionX = (cam.scrollX * 0.4) / ART_SCALE;
    for (const beam of beams) beam.x = beam.baseX - ((cam.scrollX * 0.15) % 65);
    water.tilePositionX = (time * 0.01) / ART_SCALE;
  };
}
