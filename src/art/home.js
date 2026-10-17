// The home screen: Boris's music studio, after Sandro's reference photos (a desk with a PC, big
// speakers, sound panels, headphones). Drawn at the hero's pixel size by the art thread; the home
// screen shows it 1:1 on the 640x360 canvas, so the numbers below are picture pixels.
import studio from './home/studio.png';
import select0 from './home/select-0.png';
import select1 from './home/select-1.png';
import playButton from './home/play-button.png';
import playButtonOn from './home/play-button-on.png';
import playSelect0 from './home/play-select-0.png';
import playSelect1 from './home/play-select-1.png';
import songMenu from './home/song-menu.png';
import songRowSelect0 from './home/song-row-select-0.png';
import songRowSelect1 from './home/song-row-select-1.png';
import eq0 from './home/eq-0.png';
import eq1 from './home/eq-1.png';
import eq2 from './home/eq-2.png';

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
// Free floor in front of Boris: the level hint goes here, in a dark box.
export const HINT_AREA = { x: 200, y: 312, w: 240, h: 36 };
export const TITLE_PANEL = { x: 268, y: 64, w: 103, h: 65 };
// The menu music: the round play button on the middle panel (its blinking ring at -5,-5), and the
// song picker (304x168, centred), positions inside it.
export const PLAY_POS = { x: 303, y: 146 };
export const PLAY_SELECT_OFFSET = { x: -5, y: -5 };
export const SONG_MENU = { w: 304, h: 168 };
export const SONG_TITLE_BOX = { x: 52, y: 10, w: 240, h: 20 };
export const songRow = (i) => ({ x: 24, y: 36 + 25 * i, w: 266, h: 22 });
export const SONG_ROW_SELECT_OFFSET = { x: -10, y: -2 };

export const cardKey = (level, state) => `home-card-${level}-${state}`;

export function preloadHome(scene) {
  scene.load.image('home-studio', studio);
  scene.load.image('home-select-0', select0);
  scene.load.image('home-select-1', select1);
  scene.load.image('home-play', playButton);
  scene.load.image('home-play-on', playButtonOn);
  scene.load.image('home-play-select-0', playSelect0);
  scene.load.image('home-play-select-1', playSelect1);
  scene.load.image('home-song-menu', songMenu);
  scene.load.image('home-song-select-0', songRowSelect0);
  scene.load.image('home-song-select-1', songRowSelect1);
  [eq0, eq1, eq2].forEach((url, i) => scene.load.image(`home-eq-${i}`, url));
  for (const [path, url] of Object.entries(cards)) {
    const [, n, state] = path.match(/card-(\d+)-(\w+)\.png$/);
    scene.load.image(cardKey(Number(n), state), url);
  }
}
