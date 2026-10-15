import { pixelTexture } from './pixels.js';
import heroIdle from './hero/idle.png';
import heroRun from './hero/run.png';
import heroJump from './hero/jump.png';
import heroSit from './hero/sit.png';
import bareIdle from './hero-bare/idle.png';
import bareRun from './hero-bare/run.png';
import bareJump from './hero-bare/jump.png';
import bareSit from './hero-bare/sit.png';
import duckBig from './duck/big.png';
import duckSmall from './duck/small.png';
import caseClosed from './suitcase/closed.png';
import caseMask from './suitcase/mask.png';
import caseOpen from './suitcase/open.png';

// The hero's poses, cut from Sandro's pose sheets (art/hero-poses*.png in the project files).
// 'hero-*' wears the mask; 'bare-*' is the same pose without it (art/hero-poses-no-mask.png).
// They are drawn at half size, so each picture pixel is one screen pixel at ZOOM 2.
export const HERO_SCALE = 0.5;

export function preloadSprites(scene) {
  scene.load.image('hero-idle', heroIdle);
  scene.load.image('hero-run', heroRun);
  scene.load.image('hero-jump', heroJump);
  scene.load.image('hero-sit', heroSit);
  scene.load.image('bare-idle', bareIdle);
  scene.load.image('bare-run', bareRun);
  scene.load.image('bare-jump', bareJump);
  scene.load.image('bare-sit', bareSit);
  // The masked rubber duck (art/duck.png): full size for the ride-on duck, shrunk for the
  // little ones you collect and shoot. Both are drawn at DUCK_SCALE, like the hero.
  scene.load.image('big-duck', duckBig);
  scene.load.image('rubber-duck', duckSmall);
  // The suitcase the mask starts in (art/suitcase-*.png), shrunk to sit a little under head height.
  scene.load.image('case-closed', caseClosed);
  scene.load.image('case-mask', caseMask);
  scene.load.image('case-open', caseOpen);
}

// Placeholder pixel art in the style of the Ibiza club reference (art/style-reference.png in the
// project files). Swap these for real sprite sheets in the art milestone.

const PALETTE = {
  k: '#1a1020', // outline
  w: '#f4f4f4', // white
  W: '#c8d0dc', // white shade
  b: '#2f5fd0', // blue
  B: '#8ec8ff', // light blue
  g: '#f2c230', // gold
  G: '#b07a10', // dark gold
  r: '#d03040', // red
  d: '#26262e', // black tee
  D: '#3a3a46', // tee highlight
  s: '#f0c090', // skin
  n: '#2a3f8a', // jeans
  N: '#1c2a60', // jeans shade
  y: '#ffd400', // duck yellow
  Y: '#e0a800', // duck shade
  o: '#ff8a00', // orange
  O: '#ff5a1a', // mango red-orange
  l: '#3cae4a', // leaf green
  p: '#ff5aa0', // pink
};

const MANGO = [
  '.....ll...',
  '....ll....',
  '..kkkkkk..',
  '.kooooook.',
  'koyyoooook',
  'kooooooook',
  'kooooooOOk',
  '.koooOOOk.',
  '..kkkkkk..',
];

const EGG = [
  '....kkkk....',
  '...kwwwwk...',
  '..kwwggwwk..',
  '.kwwwggwwwk.',
  '.kwwwwwwwwk.',
  'kwggwwwwwwwk',
  'kwggwwwwggwk',
  'kwwwwwwwggwk',
  'kwwwwggwwwWk',
  'kwwwwggwwwWk',
  '.kwwwwwwwWk.',
  '.kWwwwwwWWk.',
  '..kkWWWWkk..',
  '....kkkk....',
];
const EGG_HALF = ['..kkk.', '.kwwwk', 'kwggwk', 'kwggwk', 'kwwwwk', 'kwwwWk', '.kWWWk', '..kkk.'];

const HEART = ['.kk.kk..', 'krrkrrk.', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...'];
const HEART_EMPTY = HEART.map((r) => r.replace(/r/g, 'D'));

export const DUCK_SCALE = 0.5;

// Riding: the sitting pose on the duck's back, behind its masked head. Hero and duck pictures
// share a resolution (two picture pixels per world pixel), so they're drawn 1:1.
// 'hero-rider' (with mask) or 'bare-rider' (without).
function makeRider(scene, look) {
  const key = `${look}-rider`;
  if (scene.textures.exists(key)) return;
  const hero = scene.textures.get(`${look}-sit`).getSourceImage();
  const duck = scene.textures.get('big-duck').getSourceImage();
  const tex = scene.textures.createCanvas(key, 55, 67);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(duck, 8, 12);
  ctx.drawImage(hero, 0, 0); // seat on the back, face and crown of the duck still showing
  tex.refresh();
}

export function createSprites(scene) {
  const make = (key, rows) => pixelTexture(scene, key, rows, PALETTE);

  makeRider(scene, 'hero');
  makeRider(scene, 'bare');
  make('mango', MANGO);
  make('egg', EGG);
  make('egg-half', EGG_HALF);
  make('heart', HEART);
  make('heart-empty', HEART_EMPTY);
}
