import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import skyImage from './world/bg-sky.png';
import venueImage from './world/bg-venue.png';
import crowdImage from './world/bg-crowd.png';
import tulumRoofImage from './world/solomun/roof.png';
import tulumLampsImage from './world/solomun/lamps.png';
import tulumCrowd0 from './world/solomun/crowd-0.png';
import tulumCrowd1 from './world/solomun/crowd-1.png';
import tulumCrowd2 from './world/solomun/crowd-2.png';
import tulumCrowd3 from './world/solomun/crowd-3.png';

// Each world has a backdrop themed on its DJ boss, in layers that scroll at different speeds.
//   club:    sunset sky, the venue with its stage screen, moving light beams, the crowd and palms.
//   tulum:   the wooden beach hut of his Tulum set, wicker lamps and a dancing crowd.
//   layers:  the DJ worlds of levels 2+ (tools/world_djs.py): four pictures in src/art/world/<art>/
//            (0-sky, 1-far, 2-mid, 3-near) scrolled at the world file's `parallax` speeds, plus an
//            optional `effect` on top (snow, embers, sparkles, beams).
// Pits are plain black gaps in every world, like Mario 3.

// The layers are drawn by tools/world_art.py and tools/world_solomun.py at the hero's pixel size
// (twice the world resolution) and shown at half size.
const ART_SCALE = 0.5;

const worldLayers = import.meta.glob('./world/*/[0-9]-*.png', { eager: true, import: 'default' });
const layerKey = (path) => {
  const [, , art, file] = path.split('/');
  return `world-${art}-${file[0]}`;
};

const TULUM_CROWD = [tulumCrowd0, tulumCrowd1, tulumCrowd2, tulumCrowd3];
// Near lamps in tulum lamps.png: centre x and glow centre y in picture pixels (matches NEAR_LAMPS).
const TULUM_LAMPS = [
  [70, 54],
  [236, 104],
  [398, 37],
  [560, 87],
];

export function preloadBackground(scene) {
  scene.load.image('bg-sky', skyImage);
  scene.load.image('bg-venue', venueImage);
  scene.load.image('bg-crowd', crowdImage);
  scene.load.image('tulum-roof', tulumRoofImage);
  scene.load.image('tulum-lamps', tulumLampsImage);
  TULUM_CROWD.forEach((image, i) => scene.load.image(`tulum-crowd-${i}`, image));
  for (const [path, url] of Object.entries(worldLayers)) scene.load.image(layerKey(path), url);
}

// theme: the world's `background` key (src/levels/worlds/): 'tulum', 'club' or 'layers'; world: the
// whole world file (the 'layers' builder reads its art folder, parallax and effect).
export function createBackground(scene, worldW, worldH, theme = 'tulum', world = {}) {
  // Fixed layers sit at the camera's zoom offset, so they fill the zoomed view.
  const cam = scene.cameras.main;
  const ox = (cam.width - cam.width / cam.zoom) / 2;
  const oy = (cam.height - cam.height / cam.zoom) / 2;

  // A tile sprite of the full art size, scaled down: one picture pixel is one screen pixel.
  const layer = (key, x, y, w, h, scroll) =>
    scene.add.tileSprite(x, y, w / ART_SCALE, h / ART_SCALE, key).setOrigin(0).setScale(ART_SCALE).setScrollFactor(scroll);

  const builders = { club: clubLayers, tulum: tulumLayers, layers: djLayers };
  const updateWorld = (builders[theme] ?? tulumLayers)(scene, cam, ox, oy, layer, world);
  // Black from the top of the ground (three tile rows) down, so a pit is a black gap; the ground
  // tiles cover it everywhere else.
  scene.add.rectangle(0, worldH - 48, worldW, 64, 0x000000).setOrigin(0);

  return updateWorld;
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

  // The crowd: 4 dance frames, but it holds still on the first one (the characters only dance at
  // the Afterparty).
  const crowd = TULUM_CROWD.map((_, i) => layer(`tulum-crowd-${i}`, ox, oy, GAME_WIDTH, GAME_HEIGHT, 0).setVisible(i === 0));

  return function update(time) {
    roof.tilePositionX = (cam.scrollX * 0.15) / ART_SCALE;
    lamps.tilePositionX = (cam.scrollX * 0.25) / ART_SCALE;
    for (const glow of glows) {
      glow.x = ox + Phaser.Math.Wrap(glow.lampX - cam.scrollX * 0.25, -40, GAME_WIDTH - 40) + glow.copy * GAME_WIDTH;
    }
    crowd.forEach((c) => {
      c.tilePositionX = (cam.scrollX * 0.4) / ART_SCALE;
    });
  };
}

// A DJ world: its four layers, back to front, each scrolling at its parallax speed, and an effect.
// A world's `motion` can make a layer move on its own: the layer is cut into horizontal bands of
// its own picture, and each band swells up and down, sways or drifts (see snapper.js, the wave).
function djLayers(scene, cam, ox, oy, layer, world) {
  const speeds = world.parallax ?? [0, 0.08, 0.18, 0.35];
  const motion = world.motion ?? {};
  const parts = [];
  // The effect goes on top of every layer, or just over layer `effectUnder - 1` when set.
  const effectAt = world.effectUnder ?? speeds.length;
  let updateEffect = () => {};
  speeds.forEach((speed, i) => {
    if (i === effectAt) updateEffect = addEffect(scene, ox, oy, world.effect, world.effectArea);
    const key = `world-${world.art}-${i}`;
    const bands = motion[i];
    if (!bands) {
      parts.push({ sprite: layer(key, ox, oy, GAME_WIDTH, GAME_HEIGHT, 0), speed });
      return;
    }
    bands.forEach((band, b) => {
      const sprite = layer(bandTexture(scene, key, b, band.rows), ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);
      parts.push({ sprite, speed, band });
    });
  });
  if (effectAt >= speeds.length) updateEffect = addEffect(scene, ox, oy, world.effect, world.effectArea);
  return function update(time) {
    const t = time / 1000;
    for (const { sprite, speed, band } of parts) {
      let x = (cam.scrollX * speed) / ART_SCALE;
      if (band) {
        const wave = (period, phase = 0) => Math.sin(((t / period) + phase) * Math.PI * 2);
        // Whole screen pixels only, so the pixel art stays crisp.
        sprite.y = oy + Math.round((band.swell ?? 0) * wave(band.period ?? 4, band.phase));
        x -= ((band.sway ?? 0) * wave(band.swayPeriod ?? 6, band.phase) + (band.drift ?? 0) * t) / ART_SCALE;
        x = Math.round(x * ART_SCALE) / ART_SCALE;
      }
      sprite.tilePositionX = x;
    }
    updateEffect(time);
  };
}

// One band (picture rows [top, bottom)) of a world layer as its own texture, the rest see-through.
// Made once; textures outlive scene restarts.
function bandTexture(scene, key, index, [top, bottom]) {
  const bandKey = `${key}-band-${index}`;
  if (scene.textures.exists(bandKey)) return bandKey;
  const source = scene.textures.get(key).getSourceImage();
  const canvas = scene.textures.createCanvas(bandKey, source.width, source.height);
  canvas.context.drawImage(source, 0, top, source.width, bottom - top, 0, top, source.width, bottom - top);
  canvas.refresh();
  return bandKey;
}

// Little moving things over the backdrop (behind the level), fixed to the screen.
const EFFECTS = {
  snow: { count: 40, colors: [0xfdfefd, 0xcfd8ec], fall: [12, 26], drift: 8, size: 1 },
  embers: { count: 22, colors: [0xf5b04a, 0xe0801e, 0xffe08a], fall: [-18, -8], drift: 6, size: 1 },
  sparkles: { count: 26, colors: [0xfdfefd, 0xf5c35c, 0x7ad0ff, 0xff6aa8], fall: [0, 0], drift: 0, size: 1, twinkle: true },
  glints: { count: 30, colors: [0xfdfefd, 0xd8f6ff], fall: [0, 0], drift: 3, size: 1, twinkle: true }, // sun on the water
  beams: { beams: [0xff5a8a, 0x7ad0ff, 0xffd060, 0xff5a8a] },
};

// area: [top, bottom] in screen pixels where the effect shows (default: the whole sky).
function addEffect(scene, ox, oy, name, area = [0, GAME_HEIGHT - 40]) {
  const fx = EFFECTS[name];
  if (!fx) return () => {};
  if (fx.beams) {
    fx.beams.forEach((color, i) => {
      const beam = scene.add.triangle(ox + 40 + i * 80, oy, 0, 0, -12, 140, 12, 140, color, 0.14)
        .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0);
      scene.tweens.add({ targets: beam, angle: { from: -28, to: 28 }, duration: 2000 + i * 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 250 });
    });
    return () => {};
  }
  const dots = [];
  for (let i = 0; i < fx.count; i++) {
    const dot = scene.add.rectangle(0, 0, fx.size, fx.size, fx.colors[i % fx.colors.length])
      .setOrigin(0).setScrollFactor(0).setAlpha(0.8);
    dot.bx = Math.random() * GAME_WIDTH;
    dot.by = Phaser.Math.FloatBetween(area[0], area[1]);
    dot.speed = Phaser.Math.FloatBetween(fx.fall[0], fx.fall[1]);
    dot.phase = Math.random() * Math.PI * 2;
    dots.push(dot);
  }
  return function update(time) {
    const t = time / 1000;
    for (const d of dots) {
      const y = Phaser.Math.Wrap(d.by + d.speed * t, area[0], area[1]);
      const x = Phaser.Math.Wrap(d.bx + Math.sin(t + d.phase) * fx.drift, 0, GAME_WIDTH);
      d.setPosition(ox + Math.round(x), oy + Math.round(y));
      if (fx.twinkle) d.setAlpha(0.3 + 0.7 * Math.max(0, Math.sin(t * 3 + d.phase)));
    }
  };
}
