// A short melodic-house loop for the bonus room's music button, made with Web Audio so there are no
// sound files: four-on-the-floor kick, off-beat hats, a rolling bass line and a dreamy chord stab.
// It is our own placeholder in the spirit of the end boss's sets, not one of his tracks.
// The menu's songs (src/audio/songs.js) are the same loop with other notes and tempos.
const LOOKAHEAD = 0.12; // seconds of notes scheduled ahead

// A minor: bass notes per sixteenth (0 = rest), and a chord every bar (stabs on the steps in `stabs`).
export const BOSS_SONG = {
  bpm: 122,
  bass: [45, 0, 0, 45, 0, 0, 52, 0, 45, 0, 0, 48, 0, 50, 0, 52],
  chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
  stabs: [0, 10],
};

const hz = (note) => 440 * 2 ** ((note - 69) / 12);

export default class BossBeat {
  constructor(context, song = BOSS_SONG) {
    this.ctx = context;
    this.song = song;
    this.stepTime = 60 / song.bpm / 4; // sixteenth notes
    this.playing = false;
  }

  start() {
    const ctx = this.ctx;
    if (!ctx || this.playing) return;
    ctx.resume?.();
    this.playing = true;
    this.out = ctx.createGain();
    this.out.gain.value = 0.35;
    this.out.connect(ctx.destination);
    this.noise = this.makeNoise();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const out = this.out;
    out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    setTimeout(() => out.disconnect(), 400);
  }

  toggle() {
    if (this.playing) this.stop();
    else this.start();
    return this.playing;
  }

  schedule() {
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % 64;
      this.nextTime += this.stepTime;
    }
  }

  playStep(step, t) {
    const s = step % 16;
    if (s % 4 === 0) this.kick(t);
    if (s % 4 === 2) this.hat(t, 0.5);
    if (s % 2 === 1) this.hat(t, 0.15);
    const { bass, chords, stabs } = this.song;
    if (bass[s]) this.bass(hz(bass[s]), t);
    if (stabs.includes(s)) chords[Math.floor(step / 16)].forEach((n) => this.stab(hz(n), t));
  }

  kick(t) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  hat(t, level) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(gain).connect(this.out);
    src.start(t);
    src.stop(t + 0.06);
  }

  bass(freq, t) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + this.stepTime * 1.8);
    osc.connect(filter).connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + this.stepTime * 2);
  }

  stab(freq, t) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter).connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  makeNoise() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
