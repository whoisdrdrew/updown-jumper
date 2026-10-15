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
import mango from './world/mango.png';
import egg from './world/egg.png';
import eggHalf from './world/egg-half.png';
import heart from './world/heart.png';
import heartEmpty from './world/heart-empty.png';
import brickPiece from './world/brick-piece.png';
import goalFlag from './world/goal-flag.png';
import goalPole from './world/goal-pole.png';
import solomunMeditate from './solomun/meditate.png';
import solomunAttack from './solomun/attack.png';
import solomunDefeat from './solomun/defeat.png';
import solomunTowel from './solomun/towel.png';
import solomunPortrait from './solomun/portrait.png';
import solomunCloudBack0 from './solomun/cloud-back-0.png';
import solomunCloudBack1 from './solomun/cloud-back-1.png';
import solomunCloudFront0 from './solomun/cloud-front-0.png';
import solomunCloudFront1 from './solomun/cloud-front-1.png';
import airPuff from './world/air-puff.png';

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
  // The masked rubber duck: the ride-on one is drawn by tools/world_art.py, the little ones you
  // collect and shoot are drawn by hand at their own size. Both are shown at DUCK_SCALE, like the hero.
  scene.load.image('big-duck', duckBig);
  scene.load.image('rubber-duck', duckSmall);
  // The suitcase the mask starts in (art/suitcase-front.png in the project files).
  scene.load.image('case-closed', caseClosed);
  scene.load.image('case-mask', caseMask);
  scene.load.image('case-open', caseOpen);
  // Items, drawn at the hero's pixel size by tools/world_art.py. Shown at ITEM_SCALE like the hero.
  scene.load.image('mango', mango);
  scene.load.image('egg', egg);
  scene.load.image('egg-half', eggHalf);
  scene.load.image('heart', heart);
  scene.load.image('heart-empty', heartEmpty);
  scene.load.image('brick-piece', brickPiece);
  scene.load.image('goal-flag', goalFlag);
  scene.load.image('goal-pole', goalPole);
  // Solomun, the world 1 boss (art/solomun/ in the project files): a head taller and twice as wide as the hero.
  scene.load.image('solomun-meditate', solomunMeditate);
  scene.load.image('solomun-attack', solomunAttack);
  scene.load.image('solomun-defeat', solomunDefeat);
  scene.load.image('solomun-towel', solomunTowel);
  scene.load.image('solomun-portrait', solomunPortrait);
  // The sauna-steam cloud he sits in: a back and a front layer, two bob frames each.
  scene.load.image('solomun-cloud-back-0', solomunCloudBack0);
  scene.load.image('solomun-cloud-back-1', solomunCloudBack1);
  scene.load.image('solomun-cloud-front-0', solomunCloudFront0);
  scene.load.image('solomun-cloud-front-1', solomunCloudFront1);
  // Air the ride duck squeezes out (player/DuckPuffs.js): three frames of a growing puff.
  scene.load.spritesheet('air-puff', airPuff, { frameWidth: 16, frameHeight: 14 });
}

// Everything is drawn at twice the world resolution and shown at half size.
export const ITEM_SCALE = 0.5;
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
  makeRider(scene, 'hero');
  makeRider(scene, 'bare');
}
