// Plays one menu song at a time, streamed with an <audio> element (no decoding the whole file first),
// looping, with a short fade in and out.
const VOLUME = 0.7;
const FADE_MS = 400;

export default class MenuMusic {
  constructor() {
    this.audio = null;
  }

  play(url) {
    this.stop();
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    audio.play().catch(() => {});
    this.fade(audio, VOLUME);
    this.audio = audio;
  }

  stop() {
    const audio = this.audio;
    if (!audio) return;
    this.audio = null;
    this.fade(audio, 0, () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    });
  }

  fade(audio, to, done) {
    clearInterval(audio.fadeTimer);
    const from = audio.volume;
    const start = performance.now();
    audio.fadeTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / FADE_MS);
      audio.volume = from + (to - from) * t;
      if (t === 1) {
        clearInterval(audio.fadeTimer);
        done?.();
      }
    }, 30);
  }
}
