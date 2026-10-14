import { pixelTexture, compose } from './pixels.js';

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
  c: '#5ab8ff', // hair highlight
  u: '#1a3a90', // mask eye holes
};

// The Up-Down-Jumper, after the character sheet (art/hero-character-sheet.png in the project files):
// chibi proportions, tall blue spiky hair, white mask with gold ornament and blue eye holes,
// black tee, blue jeans, white sneakers. 16x24; the hair sticks out above the hitbox.
const HERO_TOP = [
  '......k...k.....',
  '...k.kbk.kck.k..',
  '..kbkkbckbcbkck.',
  '..kbcbbccbbcbbk.',
  '.kbbcBbcBbbcbbk.',
  'kbbbbbbbbbbbbbbk',
  'kbbwwwwgwwwwbbk.',
  '.kbwgwwgwwgwbk..',
  '.kwwggwgwggwwk..',
  '.kwuuuwgwuuuwk..',
  '.kwwuuwwwuuwwk..',
  '..kwwwwwwwwwk...',
  '..kwgwkkkwgwk...',
  '...kWwwwwwWk....',
  '....kkkkkkk.....',
  '...kdddddddk....',
  '..ksddddDddsk...',
  '..ksdddddddsk...',
  '..kskdddddksk...',
  '...kknnnnnkk....',
];
const HERO_LEGS = {
  idle: ['....knnknnk.....', '....knnknnk.....', '...kwwwkwwwk....', '...kkkkkkkkk....'],
  run1: ['...knnk.knnk....', '..knnk...knnk...', '.kwwwk...kwwwk..', '.kkkk.....kkkk..'],
  run2: ['....knnnnk......', '.....knnk.......', '....kwwwwk......', '....kkkkk.......'],
  jump: ['...knnk..knnk...', '..kwwwk...knnk..', '..kkkk...kwwwk..', '..........kkkk..'],
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

export function createSprites(scene) {
  const make = (key, rows) => pixelTexture(scene, key, rows, PALETTE);

  for (const [pose, legs] of Object.entries(HERO_LEGS)) make(`hero-${pose}`, [...HERO_TOP, ...legs]);
  make('big-duck', BIG_DUCK);
  // Riding: the hero's upper body sits on the duck's back, behind its head.
  make('rider', compose(25, 26, [{ rows: BIG_DUCK, x: 7, y: 12 }, { rows: HERO_TOP.slice(0, 19), x: 0, y: 0 }]));
  make('rubber-duck', RUBBER_DUCK);
  make('mango', MANGO);
  make('egg', EGG);
  make('egg-half', EGG_HALF);
  make('heart', HEART);
  make('heart-empty', HEART_EMPTY);
}
