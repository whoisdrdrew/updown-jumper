// The home screen: Boris's music studio, after Sandro's reference photos (a desk with a PC, big
// speakers, sound panels, headphones). Drawn at the hero's pixel size by the art thread; the home
// screen shows it 1:1 on the 640x360 canvas, so the numbers below are picture pixels.
import studio from './home/studio.png';
import select0 from './home/select-0.png';
import select1 from './home/select-1.png';

const cards = import.meta.glob('./home/cards/*.png', { eager: true, import: 'default' });

export const LEVEL_COUNT = 10;
// Top-left of each level's card on the two strings, level 1..10.
export const CARD_AT = [
  [41, 67], [83, 71], [125, 73], [167, 72], [209, 67],
  [389, 67], [431, 71], [473, 73], [515, 72], [557, 67],
];
// The photo window on a finished card (transparent; the level's winner photo goes under it).
export const CARD_WINDOW = { x: 4, y: 10, w: 32, h: 22 };
export const SELECT_OFFSET = { x: -3, y: 3 };
// Free white wall under the title, between the panels: the level hint goes here, in a dark box.
export const HINT_AREA = { x: 252, y: 146, w: 136, h: 52 };
export const TITLE_PANEL = { x: 268, y: 64, w: 103, h: 69 };

export const cardKey = (level, state) => `home-card-${level}-${state}`;

export function preloadHome(scene) {
  scene.load.image('home-studio', studio);
  scene.load.image('home-select-0', select0);
  scene.load.image('home-select-1', select1);
  for (const [path, url] of Object.entries(cards)) {
    const [, n, state] = path.match(/card-(\d+)-(\w+)\.png$/);
    scene.load.image(cardKey(Number(n), state), url);
  }
}
