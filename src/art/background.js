import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// Club-at-sunset backdrop in layers that scroll at different speeds:
// sky, the venue with its stage screen, moving light beams, the crowd and palms, and water in the pits.

function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
}

// Small repeatable random numbers, so the scenery looks the same every time.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function drawSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#24123e');
  g.addColorStop(0.45, '#7a2a5e');
  g.addColorStop(0.75, '#e0604a');
  g.addColorStop(1, '#f6a64a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// The venue: roof truss, speaker stacks and a glowing LED screen. 480 px wide, repeats.
function drawVenue(ctx, w, h) {
  const rand = rng(7);
  ctx.fillStyle = '#1c1028';
  ctx.fillRect(0, 0, w, 22); // roof
  for (let x = 0; x < w; x += 12) {
    ctx.fillStyle = '#2e1c40';
    ctx.fillRect(x, 22, 2, 6); // truss
  }
  ctx.fillRect(0, 26, w, 2);
  // Pillars and side terraces.
  for (const x of [20, 440]) {
    ctx.fillStyle = '#2a1830';
    ctx.fillRect(x, 22, 14, h - 22);
  }
  // Stage screen.
  const sx = 150;
  const sw = 180;
  ctx.fillStyle = '#12081c';
  ctx.fillRect(sx - 4, 40, sw + 8, 78);
  const scr = ctx.createLinearGradient(0, 44, 0, 114);
  scr.addColorStop(0, '#b02a5a');
  scr.addColorStop(1, '#3e1460');
  ctx.fillStyle = scr;
  ctx.fillRect(sx, 44, sw, 70);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(255,200,80,0.25)';
    ctx.fillRect(sx + Math.floor(rand() * sw), 44 + Math.floor(rand() * 70), 2, 2);
  }
  // Speaker stacks either side of the screen.
  for (const x of [sx - 30, sx + sw + 12]) {
    ctx.fillStyle = '#0e0814';
    ctx.fillRect(x, 32, 18, 70);
    for (let y = 36; y < 100; y += 10) {
      ctx.fillStyle = '#2a2236';
      ctx.fillRect(x + 3, y, 12, 7);
    }
  }
  // Stage lights along the roof.
  for (let x = 6; x < w; x += 24) {
    ctx.fillStyle = rand() > 0.5 ? '#7ad0ff' : '#ff5a8a';
    ctx.fillRect(x, 28, 3, 3);
  }
}

// Crowd with raised hands, palm trees in front. Repeats.
function drawCrowd(ctx, w, h) {
  const rand = rng(42);
  const base = h - 66; // heads just above the level's ground line
  for (let x = -4; x < w; x += 5) {
    const y = base + Math.floor(rand() * 5);
    ctx.fillStyle = rand() > 0.5 ? '#1e1226' : '#2a1a34';
    ctx.fillRect(x, y + 4, 6, h - y); // body
    ctx.fillRect(x + 1, y, 4, 4); // head
    if (rand() > 0.6) ctx.fillRect(x + (rand() > 0.5 ? 0 : 5), y - 6, 1, 6); // arm up
  }
  const palm = (x, top) => {
    ctx.fillStyle = '#3a2418';
    for (let y = top; y < h; y++) ctx.fillRect(x + Math.round(Math.sin((y - top) / 14) * 2), y, 3, 1);
    ctx.fillStyle = '#1e5a2e';
    for (const [dx, dy, len] of [[-12, 2, 12], [3, 2, 12], [-9, -3, 10], [2, -3, 10], [-4, -6, 8]]) {
      ctx.fillRect(x + dx, top + dy, len, 2);
      ctx.fillRect(x + dx + (dx < 0 ? 0 : len - 2), top + dy + 2, 2, 3);
    }
  };
  palm(40, h - 96);
  palm(210, h - 108);
  palm(290, h - 90);
}

function drawWater(ctx, w, h) {
  ctx.fillStyle = '#1f5ab8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a86e8';
  ctx.fillRect(0, 3, w, 3);
  ctx.fillStyle = '#d8f0ff';
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, 1 + ((x / 8) % 2), 4, 1);
  ctx.fillStyle = '#2a6ad0';
  for (let x = 4; x < w; x += 12) ctx.fillRect(x, 12 + ((x / 4) % 3) * 4, 5, 1);
}

export function createBackground(scene, worldW, worldH) {
  canvasTexture(scene, 'bg-sky', GAME_WIDTH, GAME_HEIGHT, drawSky);
  canvasTexture(scene, 'bg-venue', 480, GAME_HEIGHT, drawVenue);
  canvasTexture(scene, 'bg-crowd', 320, GAME_HEIGHT, drawCrowd);
  canvasTexture(scene, 'bg-water', 48, 40, drawWater);

  // Fixed layers sit at the camera's zoom offset, so they fill the zoomed view.
  const cam = scene.cameras.main;
  const ox = (cam.width - cam.width / cam.zoom) / 2;
  const oy = (cam.height - cam.height / cam.zoom) / 2;

  scene.add.image(ox, oy, 'bg-sky').setOrigin(0).setScrollFactor(0);
  const venue = scene.add.tileSprite(ox, oy, GAME_WIDTH, GAME_HEIGHT, 'bg-venue').setOrigin(0).setScrollFactor(0);

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

  const crowd = scene.add.tileSprite(ox, oy, GAME_WIDTH, GAME_HEIGHT, 'bg-crowd').setOrigin(0).setScrollFactor(0);
  // Water fills the pits; the ground tiles cover it everywhere else.
  const water = scene.add.tileSprite(0, worldH - 36, worldW, 40, 'bg-water').setOrigin(0);

  return function update(time) {
    venue.tilePositionX = cam.scrollX * 0.15;
    crowd.tilePositionX = cam.scrollX * 0.4;
    for (const beam of beams) beam.x = beam.baseX - ((cam.scrollX * 0.15) % 65);
    water.tilePositionX = time * 0.01;
  };
}
