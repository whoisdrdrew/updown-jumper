import { pixelTexture } from './pixels.js';
import heroIdle from './hero/idle.png';
import heroRun from './hero/run.png';
import heroJump from './hero/jump.png';
import heroSit from './hero/sit.png';

// The hero's poses, cut from Sandro's pose sheets (art/hero-poses*.png in the project files).
// They are drawn at half size, so each picture pixel is one screen pixel at ZOOM 2.
export const HERO_SCALE = 0.5;

export function preloadSprites(scene) {
  scene.load.image('hero-idle', heroIdle);
  scene.load.image('hero-run', heroRun);
  scene.load.image('hero-jump', heroJump);
  scene.load.image('hero-sit', heroSit);
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

const BIG_DUCK = [
  '.........kkkk.....',
  '........kyyyyk....',
  '........kyykyk....',
  '........kyyyyokk..',
  '........kyyyyoooo.',
  '.kk.....kyyyyokk..',
  'kyyk...kyyyyyk....',
  'kyyykkkyyyyyyk....',
  'kyyyyyyyyyyyyyk...',
  'kyyYYYYyyyyyyyk...',
  '.kyyYYYYyyyyyk....',
  '..kyyyyyyyyyk.....',
  '...kkkkkkkkk......',
  '....oo...oo.......',
];

const RUBBER_DUCK = [
  '....kkk..',
  '...kyyyk.',
  '...kykyoo',
  'k..kyyyk.',
  'kykkyyyk.',
  'kyyyyyyyk',
  '.kyYYyyk.',
  '..kkkkk..',
];

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

// Riding: the sitting pose on the duck's back, behind its head. Built at the hero's resolution
// (two picture pixels per world pixel); the duck is drawn three times larger, which matches the
// big duck standing in the level at RIDE_DUCK_SCALE.
export const RIDE_DUCK_SCALE = 1.5;
function makeRider(scene) {
  if (scene.textures.exists('rider')) return;
  const hero = scene.textures.get('hero-sit').getSourceImage();
  const duck = scene.textures.get('big-duck').getSourceImage();
  const tex = scene.textures.createCanvas('rider', 55, 61);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(duck, 0, 0, 18, 14, 1, 19, 54, 42);
  ctx.drawImage(hero, 0, 0); // seat on the rear of the back, clear of the neck; legs hang over its side
  tex.refresh();
}

export function createSprites(scene) {
  const make = (key, rows) => pixelTexture(scene, key, rows, PALETTE);

  make('big-duck', BIG_DUCK);
  makeRider(scene);
  make('rubber-duck', RUBBER_DUCK);
  make('mango', MANGO);
  make('egg', EGG);
  make('egg-half', EGG_HALF);
  make('heart', HEART);
  make('heart-empty', HEART_EMPTY);
}
