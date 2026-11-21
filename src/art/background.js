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
//            optional `effect` on top (snow, embers, sparkles, beams), and optional `animate`
//            (a layer that cycles through picture frames) and `jumpers` (dolphins).
// Pits are plain black gaps in every world, like Mario 3.

// The layers are drawn by tools/world_art.py and tools/world_solomun.py at the hero's pixel size
// (twice the world resolution) and shown at half size.
const ART_SCALE = 0.5;

const worldLayers = import.meta.glob('./world/*/[0-9]-*.png', { eager: true, import: 'default' });
const layerKey = (path) => {
  const [, , art, file] = path.split('/');
  return `world-${art}-${file[0]}`;
};
// Animation frames of a world (Higgsfield-made too): src/art/world/<art>/<name>-<n>.png, for example
// the Snapper wave cycle (wave-0..5) and the jumping dolphin (dolphin-0..7). Key: world-<art>-<name>-<n>.
const worldFrames = import.meta.glob('./world/*/[a-z]*-[0-9].png', { eager: true, import: 'default' });
const frameKey = (path) => {
  const [, , art, file] = path.split('/');
  return `world-${art}-${file.replace('.png', '')}`;
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
  for (const [path, url] of Object.entries(worldFrames)) scene.load.image(frameKey(path), url);
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
// A world's `animate` can swap one layer through picture frames (the Snapper wave breaking), and its
// `jumpers` puts creatures on a layer that jump out of the water now and then (the dolphins).
function djLayers(scene, cam, ox, oy, layer, world) {
  const speeds = world.parallax ?? [0, 0.08, 0.18, 0.35];
  const updates = [];
  const layers = speeds.map((speed, i) => {
    const l = layer(`world-${world.art}-${i}`, ox, oy, GAME_WIDTH, GAME_HEIGHT, 0);
    const anim = world.animate?.layer === i ? world.animate : null;
    if (anim) updates.push(frameCycle(l, world.art, anim));
    if (world.jumpers?.layer === i) updates.push(addJumpers(scene, cam, ox, oy, world.art, world.jumpers, speed));
    return l;
  });
  const updateEffect = addEffect(scene, ox, oy, world.effect);
  return function update(time) {
    layers.forEach((l, i) => {
      l.tilePositionX = (cam.scrollX * speeds[i]) / ART_SCALE;
    });
    for (const u of updates) u(time);
    updateEffect(time);
  };
}

// Shows a layer's frames one after another, each for its own time (ms), and starts over.
function frameCycle(l, art, { frames, ms }) {
  const total = ms.reduce((a, b) => a + b, 0);
  let shown = -1;
  return function update(time) {
    let t = time % total;
    let n = 0;
    while (t >= ms[n]) t -= ms[n++];
    if (n !== shown) {
      l.setTexture(`world-${art}-${frames}-${n}`);
      shown = n;
    }
  };
}

// Creatures that jump out of the water and dive back in, every few seconds somewhere on screen,
// sometimes two together. They sit on their layer (scroll with it) with their feet on `waterY`.
function addJumpers(scene, cam, ox, oy, art, cfg, speed) {
  const { frames, count, frameMs, every, waterY, drift } = cfg;
  const pool = [0, 1].map(() => scene.add.image(0, 0, `world-${art}-${frames}-0`).setOrigin(0.5, 1).setScale(ART_SCALE).setScrollFactor(0).setVisible(false));
  let next = 1500;
  const jumps = [];
  const start = (sprite, x, flip, at) => jumps.push({ sprite, x, flip, at });
  return function update(time) {
    if (time >= next) {
      const x = cam.scrollX * speed + Phaser.Math.Between(40, GAME_WIDTH - 40);
      const flip = Math.random() < 0.5;
      if (!pool[0].visible) start(pool[0], x, flip, time);
      if (Math.random() < 0.4 && !pool[1].visible) start(pool[1], x + (flip ? 16 : -16), flip, time + 220);
      next = time + Phaser.Math.Between(every[0], every[1]);
    }
    for (let i = jumps.length - 1; i >= 0; i--) {
      const j = jumps[i];
      const n = Math.floor((time - j.at) / frameMs);
      if (n < 0) continue;
      if (n >= count) {
        j.sprite.setVisible(false);
        jumps.splice(i, 1);
        continue;
      }
      const dx = (j.flip ? -1 : 1) * drift * n;
      j.sprite
        .setTexture(`world-${art}-${frames}-${n}`)
        .setFlipX(j.flip)
        .setVisible(true)
        .setPosition(ox + Math.round(j.x + dx - cam.scrollX * speed), oy + waterY);
    }
  };
}

// Little moving things over the backdrop (behind the level), fixed to the screen.
const EFFECTS = {
  snow: { count: 40, colors: [0xfdfefd, 0xcfd8ec], fall: [12, 26], drift: 8, size: 1 },
  embers: { count: 22, colors: [0xf5b04a, 0xe0801e, 0xffe08a], fall: [-18, -8], drift: 6, size: 1 },
  sparkles: { count: 26, colors: [0xfdfefd, 0xf5c35c, 0x7ad0ff, 0xff6aa8], fall: [0, 0], drift: 0, size: 1, twinkle: true },
  beams: { beams: [0xff5a8a, 0x7ad0ff, 0xffd060, 0xff5a8a] },
};

function addEffect(scene, ox, oy, name) {
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
    dot.by = Math.random() * GAME_HEIGHT;
    dot.speed = Phaser.Math.FloatBetween(fx.fall[0], fx.fall[1]);
    dot.phase = Math.random() * Math.PI * 2;
    dots.push(dot);
  }
  return function update(time) {
    const t = time / 1000;
    for (const d of dots) {
      const y = Phaser.Math.Wrap(d.by + d.speed * t, 0, GAME_HEIGHT - 40);
      const x = Phaser.Math.Wrap(d.bx + Math.sin(t + d.phase) * fx.drift, 0, GAME_WIDTH);
      d.setPosition(ox + Math.round(x), oy + Math.round(y));
      if (fx.twinkle) d.setAlpha(0.3 + 0.7 * Math.max(0, Math.sin(t * 3 + d.phase)));
    }
  };
}
