import Phaser from 'phaser';
import { BONUS_SCALE } from '../art/bonus.js';
import { YOKE_PIVOT, HEAD_PIVOT, BEAM_DROP, NOZZLE_Y, BEAM_COLORS } from '../art/vipFx.js';

const S = BONUS_SCALE;
const LIGHT_EVERY = 64; // world pixels between the moving lights
const LIGHT_TOP = 15; // top of the yokes, just under the velvet valance
const SWING = Phaser.Math.DegToRad(32); // each light sweeps this far either way
const SWING_PERIOD = 3000;
const PHASE_STEP = 1.3; // radians between neighbouring lights
const BEAM_ON = 0.8; // beam alpha with the music on...
const BEAM_OFF = 0.3; // ...and off (they keep moving, dimmer)
const CANNON_EVERY = 60000; // the CO2 cannons go off every minute...
const CANNON_FIRST = 6000; // ...the first time soon after you come in
const BLAST_TICK = 125;
const BLAST_FRAMES = [0, 1, 1, 1, 2, 2, 3, 3, 4, 4]; // a tick each

// The VIP room's party effects: moving head lights along the top of the room and two CO2 cannons
// on the floor of the big room. Make the lights right after the background (so the beams are behind
// everything) and the cannons after the floor and portrait.
export default class VipFx {
  constructor(scene, worldW) {
    this.scene = scene;
    this.worldW = worldW;
    this.lights = [];
    this.musicOn = false;
  }

  addLights() {
    const { scene } = this;
    for (let i = 0, x = LIGHT_EVERY / 2; x < this.worldW; i++, x += LIGHT_EVERY) {
      const pivot = { x, y: LIGHT_TOP + YOKE_PIVOT.y * S };
      const beam = scene.add.image(0, 0, `vip-beam-${BEAM_COLORS[i % BEAM_COLORS.length]}`)
        .setOrigin(0.5, 0).setScale(S).setBlendMode(Phaser.BlendModes.ADD).setAlpha(BEAM_OFF);
      this.lights.push({ pivot, beam, phase: i * PHASE_STEP });
    }
    // The fixtures over the beams' tops.
    for (const light of this.lights) {
      const { pivot } = light;
      scene.add.image(pivot.x - YOKE_PIVOT.x * S, LIGHT_TOP, 'vip-light-yoke').setOrigin(0).setScale(S);
      light.head = scene.add.image(pivot.x, pivot.y, 'vip-light-head')
        .setOrigin(HEAD_PIVOT.x / 18, HEAD_PIVOT.y / 18).setScale(S);
    }
    this.update(0);
  }

  // Cannons standing on the floor at the given x positions; the first one faces right.
  addCannons(floor, xs) {
    const { scene } = this;
    this.cannons = xs.map((x, i) => {
      const cannon = scene.add.image(x, floor, i === 0 ? 'vip-co2-cannon-left' : 'vip-co2-cannon-right').setOrigin(0.5, 1).setScale(S);
      const blast = scene.add.image(x, cannon.getTopCenter().y + NOZZLE_Y * S, 'vip-co2-blast-0')
        .setOrigin(0.5, 1).setScale(S).setDepth(4).setVisible(false);
      return { cannon, blast };
    });
    scene.time.delayedCall(CANNON_FIRST, () => {
      this.fire();
      scene.time.addEvent({ delay: CANNON_EVERY, loop: true, callback: () => this.fire() });
    });
  }

  fire() {
    let tick = 0;
    this.cannons.forEach(({ blast }) => blast.setTexture('vip-co2-blast-0').setVisible(true));
    this.hiss();
    this.scene.time.addEvent({
      delay: BLAST_TICK,
      repeat: BLAST_FRAMES.length - 1,
      callback: () => {
        tick += 1;
        const done = tick >= BLAST_FRAMES.length;
        this.cannons.forEach(({ blast }) => (done ? blast.setVisible(false) : blast.setTexture(`vip-co2-blast-${BLAST_FRAMES[tick]}`)));
      },
    });
  }

  // A white-noise "pssshhh", fading out with the cloud.
  hiss() {
    const ctx = this.scene.sound.context;
    if (!ctx) return;
    const seconds = BLAST_FRAMES.length * BLAST_TICK / 1000;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  setMusic(on) {
    this.musicOn = on;
    for (const { head, beam } of this.lights) {
      head.setTexture(on ? 'vip-light-head-on' : 'vip-light-head');
      beam.setAlpha(on ? BEAM_ON : BEAM_OFF);
    }
  }

  // The heads sweep on a sine wave, the beams with them (0 = straight down).
  update(time) {
    for (const { pivot, head, beam, phase } of this.lights) {
      const angle = SWING * Math.sin((time / SWING_PERIOD) * Math.PI * 2 + phase);
      head.setRotation(angle);
      beam.setRotation(angle);
      const drop = BEAM_DROP * S;
      beam.setPosition(pivot.x - Math.sin(angle) * drop, pivot.y + Math.cos(angle) * drop);
    }
  }
}
