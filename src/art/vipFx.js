// The VIP room's party effects (art/vip-fx in the project files): moving lights, CO2 cannons and
// Boris's dance frames. Drawn by tools/vip_fx_art.py at the hero's pixel size, so shown at half size.
// The numbers below are picture pixels.
const files = import.meta.glob('./vip-fx/**/*.png', { eager: true, import: 'default' });

export const YOKE_PIVOT = { x: 12, y: 10 }; // where the head swings, on light-yoke.png
export const HEAD_PIVOT = { x: 9, y: 6 }; // the same point on light-head.png
export const BEAM_DROP = 6; // the beam starts this far below the pivot
export const NOZZLE_Y = 3; // the blast starts this far below the cannon's top edge
export const BEAM_COLORS = ['pink', 'teal', 'gold', 'teal', 'pink'];
// Boris's dance frames for each of his looks (Player.look).
export const DANCE_FOLDER = { hero: 'hero', bare: 'hero-bare', 'big-hero': 'hero-big', 'big-bare': 'hero-big-bare' };
export const danceKey = (look, n) => `dance-${DANCE_FOLDER[look]}-${n}`;

// vip-fx/light-head.png -> 'vip-light-head'; vip-fx/dance/hero/dance-0.png -> 'dance-hero-0'.
export function preloadVipFx(scene) {
  for (const [path, url] of Object.entries(files)) {
    const dance = path.match(/dance\/([\w-]+)\/dance-(\d)\.png$/);
    const key = dance ? `dance-${dance[1]}-${dance[2]}` : `vip-${path.match(/([\w-]+)\.png$/)[1]}`;
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
