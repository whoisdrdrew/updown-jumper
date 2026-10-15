import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import skyImage from './world/bg-sky.png';
import venueImage from './world/bg-venue.png';
import crowdImage from './world/bg-crowd.png';
import waterImage from './world/bg-water.png';
import tulumRoofImage from './world/solomun/roof.png';
import tulumLampsImage from './world/solomun/lamps.png';
import tulumCrowd0 from './world/solomun/crowd-0.png';
import tulumCrowd1 from './world/solomun/crowd-1.png';
import tulumCrowd2 from './world/solomun/crowd-2.png';
import tulumCrowd3 from './world/solomun/crowd-3.png';

// Each world has a backdrop themed on its DJ boss, in layers that scroll at different speeds.
//   club:    sunset sky, the venue with its stage screen, moving light beams, the crowd and palms.
//   solomun: the wooden beach hut of his Tulum set, wicker lamps and a dancing crowd.
// Water fills the pits in every world.

// The layers are drawn by tools/world_art.py and tools/world_solomun.py at the hero's pixel size
// (twice the world resolution) and shown at half size.
const ART_SCALE = 0.5;

const TULUM_CROWD = [tulumCrowd0, tulumCrowd1, tulumCrowd2, tulumCrowd3];
// Near lamps in tulum lamps.png: centre x and glow centre y in picture pixels (matches NEAR_LAMPS).
const TULUM_LAMPS = [
  [70, 54],
  [236, 104],
  [398, 37],
  [560, 87],
];
const DANCE_FRAME_MS = 240; // two frames a beat at 125 BPM

export function preloadBackground(scene) {
  scene.load.image('bg-sky', skyImage);
  scene.load.image('bg-venue', venueImage);
  scene.load.image('bg-crowd', crowdImage);
  scene.load.image('bg-water', waterImage);
  scene.load.image('tulum-roof', tulumRoofImage);
  scene.load.image('tulum-lamps', tulumLampsImage);
  TULUM_CROWD.forEach((image, i) => scene.load.image(`tulum-crowd-${i}`, image));
}

export function createBackground(scene, worldW, worldH, theme = 'solomun') {
  // Fixed layers sit at the camera's zoom offset, so they fill the zoomed view.
  const cam = scene.cameras.main;
  const ox = (cam.width - cam.width / cam.zoom) / 2;
  const oy = (cam.height - cam.height / cam.zoom) / 2;

  // A tile sprite of the full art size, scaled down: one picture pixel is one screen pixel.
  const layer = (key, x, y, w, h, scroll) =>
    scene.add.tileSprite(x, y, w / ART_SCALE, h / ART_SCALE, key).setOrigin(0).setScale(ART_SCALE).setScrollFactor(scroll);

  const updateWorld = theme === 'club' ? clubLayers(scene, cam, ox, oy, layer) : tulumLayers(scene, cam, ox, oy, layer);
  const water = layer('bg-water', 0, worldH - 36, worldW, 40, 1);

  return function update(time) {
    updateWorld(time);
    // tilePosition counts picture pixels, two per world pixel.
    water.tilePositionX = (time * 0.01) / ART_SCALE;
  };
}

function clubLayers(scene, cam, ox, oy, layer) {
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

  return function update() {
    venue.tilePositionX = (cam.scrollX * 0.15) / ART_SCALE;
    crowd.tilePositionX = (cam.scrollX * 0.4) / ART_SCALE;
    for (const beam of beams) beam.x = beam.baseX - ((cam.scrollX * 0.15) % 65);
  };
}

function tulumLayers(scene, cam, ox, oy, layer) {
  const roof = layer('tulum-roof', ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);

  // Each near lamp gets a soft warm glow that flickers like a candle; two copies so one is always
  // on screen while the lamp layer wraps around.
  const glows = [];
  TULUM_LAMPS.forEach(([x, y], i) => {
    for (let copy = 0; copy < 2; copy++) {
      // A small bright core inside a wide dim halo, so the glow fades in two steps.
      for (const [radius, alpha] of [[26, 0.05], [13, 0.07]]) {
        const glow = scene.add
          .circle(0, oy + y * ART_SCALE, radius, 0xffa040, alpha)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScrollFactor(0);
        glow.lampX = x * ART_SCALE;
        glow.copy = copy;
        glows.push(glow);
        scene.tweens.add({ targets: glow, alpha: { from: 1, to: 0.5 }, duration: 260 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });
      }
    }
  });
  const lamps = layer('tulum-lamps', ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);

  // The crowd dances in a 4-frame loop; only the current frame is shown.
  const crowd = TULUM_CROWD.map((_, i) => layer(`tulum-crowd-${i}`, ox, oy, GAME_WIDTH, GAME_HEIGHT, 0).setVisible(i === 0));

  return function update(time) {
    roof.tilePositionX = (cam.scrollX * 0.15) / ART_SCALE;
    lamps.tilePositionX = (cam.scrollX * 0.25) / ART_SCALE;
    for (const glow of glows) {
      glow.x = ox + Phaser.Math.Wrap(glow.lampX - cam.scrollX * 0.25, -40, GAME_WIDTH - 40) + glow.copy * GAME_WIDTH;
    }
    const frame = Math.floor(time / DANCE_FRAME_MS) % crowd.length;
    crowd.forEach((c, i) => {
      c.setVisible(i === frame);
      c.tilePositionX = (cam.scrollX * 0.4) / ART_SCALE;
    });
  };
}
