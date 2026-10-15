import { GAME_WIDTH, GAME_HEIGHT, ZOOM } from '../config.js';
import { FELIX_SCALE, FELIX_FLASH, PHOTO_WINDOW } from '../art/felix.js';

const WALK_SPEED = 70;
const DISTANCE = 72; // Felix stops this far from Boris, so the photo is all Boris

// After an end boss is beaten: Boris strikes a victory pose, Felix the Photographer walks in, raises
// his camera, a white flash and a click, and the winner photo pops up over a dimmed screen.
// The scene keeps the player still meanwhile (scene.cutscene) and calls done() at the end.
export default function takeWinnerPhoto(scene, player, done) {
  const cam = scene.cameras.main;
  const view = cam.worldView;
  const wait = (ms) => new Promise((resolve) => scene.time.delayedCall(ms, resolve));
  const until = (test) => new Promise((resolve) => {
    const timer = scene.time.addEvent({ delay: 30, loop: true, callback: () => test() && (timer.remove(), resolve()) });
  });

  (async () => {
    player.body.setVelocityX(0);
    await Promise.race([until(() => player.body.blocked.down), wait(2500)]);

    // Felix comes in from the side with more room; Boris turns to him and hops for joy.
    const side = player.x > view.centerX + 40 ? -1 : 1;
    player.setFlipX(side < 0);
    player.body.setVelocityY(-220);
    await wait(500);

    const targetX = player.x + side * DISTANCE;
    const felix = scene.add.image(side > 0 ? view.right + 16 : view.left - 16, player.body.bottom, 'felix-walk')
      .setOrigin(0.5, 1).setScale(FELIX_SCALE).setFlipX(side < 0).setDepth(2);
    const bob = scene.tweens.add({ targets: felix, y: felix.y - 1, duration: 140, yoyo: true, repeat: -1 });
    await tween(scene, { targets: felix, x: targetX, duration: (Math.abs(felix.x - targetX) / WALK_SPEED) * 1000 });
    bob.stop();
    felix.y = player.body.bottom;
    felix.setTexture('felix-idle');
    await wait(450);

    // Camera up... snap.
    felix.setTexture('felix-shoot');
    await wait(350);
    const snap = await snapshot(scene, player);
    const mirror = side < 0 ? -1 : 1; // flipped to face right when he came from the left
    const burst = scene.add.image(felix.x + mirror * FELIX_FLASH.x * FELIX_SCALE, felix.y + FELIX_FLASH.y * FELIX_SCALE, 'felix-flash-0')
      .setScale(FELIX_SCALE).setDepth(3);
    click(scene);
    cam.flash(180, 255, 255, 255);
    await wait(90);
    burst.setTexture('felix-flash-1');
    await wait(120);
    burst.destroy();
    await wait(300);
    felix.setTexture('felix-idle');

    // The photo.
    const card = showPhoto(scene, snap);
    await wait(3200);
    await tween(scene, { targets: card.parts, alpha: 0, duration: 300 });
    card.parts.forEach((p) => p.destroy());

    // Felix heads back the way he came; Boris carries on to the flag.
    done();
    felix.setTexture('felix-walk').setFlipX(side > 0);
    scene.tweens.add({ targets: felix, y: felix.y - 1, duration: 140, yoyo: true, repeat: -1 });
    const exitX = side > 0 ? cam.worldView.right + 24 : cam.worldView.left - 24;
    await tween(scene, { targets: felix, x: exitX, duration: (Math.abs(felix.x - exitX) / WALK_SPEED) * 1000 });
    felix.destroy();
  })();
}

function tween(scene, config) {
  return new Promise((resolve) => scene.tweens.add({ ...config, onComplete: resolve }));
}

// Copies the screen around Boris (the photo window's size at ZOOM 2 is 80x56 of the world) into a texture.
function snapshot(scene, player) {
  const cam = scene.cameras.main;
  const w = PHOTO_WINDOW.w;
  const h = PHOTO_WINDOW.h;
  const sx = (player.x - cam.worldView.x) * ZOOM;
  const sy = (player.body.bottom - 22 - cam.worldView.y) * ZOOM;
  const x = Math.round(Math.min(Math.max(sx - w / 2, 0), GAME_WIDTH * ZOOM - w));
  const y = Math.round(Math.min(Math.max(sy - h / 2, 0), GAME_HEIGHT * ZOOM - h));
  return new Promise((resolve) => {
    scene.game.renderer.snapshotArea(x, y, w, h, (image) => {
      if (scene.textures.exists('winner-photo')) scene.textures.remove('winner-photo');
      scene.textures.addImage('winner-photo', image);
      resolve('winner-photo');
    });
  });
}

// The instant photo, tilted, over a dimmed screen.
function showPhoto(scene, snapKey) {
  const { x: ux, y: uy } = scene.ui;
  const dim = scene.add.rectangle(ux, uy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0).setScrollFactor(0).setDepth(29).setAlpha(0);
  const card = scene.add.container(ux + GAME_WIDTH / 2, uy + GAME_HEIGHT / 2 + 4).setScrollFactor(0).setDepth(30);
  const frame = scene.add.image(0, 0, 'photo-frame').setScale(FELIX_SCALE);
  const left = -frame.displayWidth / 2 + PHOTO_WINDOW.x * FELIX_SCALE;
  const top = -frame.displayHeight / 2 + PHOTO_WINDOW.y * FELIX_SCALE;
  const blank = scene.add.rectangle(left, top, PHOTO_WINDOW.w * FELIX_SCALE, PHOTO_WINDOW.h * FELIX_SCALE, 0xf4efe4).setOrigin(0);
  const photo = scene.add.image(left, top, snapKey).setOrigin(0).setScale(FELIX_SCALE).setAlpha(0);
  card.add([frame, blank, photo]); // the frame's window is filled, so the picture goes on top
  card.setScale(0.2).setAngle(-20).setAlpha(0);
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: card, scale: 1, angle: -6, alpha: 1, duration: 450, ease: 'Back.easeOut' });
  // Like an instant photo, the picture develops on the blank card.
  scene.tweens.add({ targets: photo, alpha: 1, delay: 300, duration: 900 });
  return { parts: [dim, card] };
}

// A camera shutter click, made with Web Audio.
function click(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  for (const at of [0, 0.07]) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    src.connect(gain).connect(ctx.destination);
    src.start(t + at);
  }
}
