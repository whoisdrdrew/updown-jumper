import heroIdle from './hero/idle.png';
import heroRun from './hero/run.png';
import heroJump from './hero/jump.png';
import heroSit from './hero/sit.png';
import bareIdle from './hero-bare/idle.png';
import bareRun from './hero-bare/run.png';
import bareJump from './hero-bare/jump.png';
import bareSit from './hero-bare/sit.png';
import bigHeroIdle from './hero-big/idle.png';
import bigHeroRun from './hero-big/run.png';
import bigHeroJump from './hero-big/jump.png';
import bigHeroSit from './hero-big/sit.png';
import bigBareIdle from './hero-big-bare/idle.png';
import bigBareRun from './hero-big-bare/run.png';
import bigBareJump from './hero-big-bare/jump.png';
import bigBareSit from './hero-big-bare/sit.png';
import duckBig from './duck/big.png';
import duckSmall from './duck/small.png';
import caseClosed from './suitcase/closed.png';
import caseMask from './suitcase/mask.png';
import caseOpen from './suitcase/open.png';
import securityWalk0 from './security/walk-0.png';
import securityWalk1 from './security/walk-1.png';
import securityKnocked from './security/knocked.png';
import hosWalk0 from './head-of-security/walk-0.png';
import hosWalk1 from './head-of-security/walk-1.png';
import hosSpot from './head-of-security/spot.png';
import hosCharge0 from './head-of-security/charge-0.png';
import hosCharge1 from './head-of-security/charge-1.png';
import hosPunch from './head-of-security/punch.png';
import hosKnocked from './head-of-security/knocked.png';
import exclaim from './intro/exclaim.png';
import egg from './world/egg.png';
import eggHalf from './world/egg-half.png';
import burger from './world/burger.png';
import burgerBox from './world/burger-box.png';
import burgerBoxLid from './world/burger-box-lid.png';
import burgerBoxBase from './world/burger-box-base.png';
import heart from './world/heart.png';
import heartEmpty from './world/heart-empty.png';
import brickPiece from './world/brick-piece.png';
import goalFlag from './world/goal-flag.png';
import goalPole from './world/goal-pole.png';
import solomunMeditate from './solomun/meditate.png';
import solomunAttack from './solomun/attack.png';
import solomunDefeat from './solomun/defeat.png';
import solomunPhotoPose from './solomun/photo-pose.png';
import solomunTowel from './solomun/towel.png';
import solomunPortrait from './solomun/portrait.png';
import solomunCloudBack0 from './solomun/cloud-back-0.png';
import solomunCloudBack1 from './solomun/cloud-back-1.png';
import solomunCloudFront0 from './solomun/cloud-front-0.png';
import solomunCloudFront1 from './solomun/cloud-front-1.png';
import airPuff from './world/air-puff.png';

// The hero's poses, cut from Sandro's pose sheets (art/hero-poses*.png in the project files).
// 'hero-*' wears the mask; 'bare-*' is the same pose without it (art/hero-poses-no-mask.png).
// 'big-hero-*' and 'big-bare-*' are big Boris after eating a burger (art/hero-big/), about 1.3x as tall.
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
  scene.load.image('big-hero-idle', bigHeroIdle);
  scene.load.image('big-hero-run', bigHeroRun);
  scene.load.image('big-hero-jump', bigHeroJump);
  scene.load.image('big-hero-sit', bigHeroSit);
  scene.load.image('big-bare-idle', bigBareIdle);
  scene.load.image('big-bare-run', bigBareRun);
  scene.load.image('big-bare-jump', bigBareJump);
  scene.load.image('big-bare-sit', bigBareSit);
  // The masked rubber duck: the ride-on one is drawn by tools/world_art.py, the little ones you
  // collect and shoot are drawn by hand at their own size. Both are shown at DUCK_SCALE, like the hero.
  scene.load.image('big-duck', duckBig);
  scene.load.image('rubber-duck', duckSmall);
  // The suitcase the mask starts in (art/suitcase-front.png in the project files).
  scene.load.image('case-closed', caseClosed);
  scene.load.image('case-mask', caseMask);
  scene.load.image('case-open', caseOpen);
  // Items, drawn at the hero's pixel size by tools/world_art.py. Shown at ITEM_SCALE like the hero.
  scene.load.image('security-walk-0', securityWalk0);
  scene.load.image('security-walk-1', securityWalk1);
  scene.load.image('security-knocked', securityKnocked);
  // The head of security (art/head-of-security in the project files).
  scene.load.image('hos-walk-0', hosWalk0);
  scene.load.image('hos-walk-1', hosWalk1);
  scene.load.image('hos-spot', hosSpot);
  scene.load.image('hos-charge-0', hosCharge0);
  scene.load.image('hos-charge-1', hosCharge1);
  scene.load.image('hos-punch', hosPunch);
  scene.load.image('hos-knocked', hosKnocked);
  scene.load.image('hos-exclaim', exclaim);
  scene.load.image('egg', egg);
  scene.load.image('egg-half', eggHalf);
  // The burger power-up and the box it pops out of (art/powerups/ in the project files).
  scene.load.image('burger', burger);
  scene.load.image('burger-box', burgerBox);
  scene.load.image('burger-box-lid', burgerBoxLid);
  scene.load.image('burger-box-base', burgerBoxBase);
  scene.load.image('heart', heart);
  scene.load.image('heart-empty', heartEmpty);
  scene.load.image('brick-piece', brickPiece);
  scene.load.image('goal-flag', goalFlag);
  scene.load.image('goal-pole', goalPole);
  // Solomun, the world 1 boss (art/solomun/ in the project files): a head taller and twice as wide as the hero.
  scene.load.image('solomun-meditate', solomunMeditate);
  scene.load.image('solomun-attack', solomunAttack);
  scene.load.image('solomun-defeat', solomunDefeat);
  scene.load.image('solomun-photo-pose', solomunPhotoPose);
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
// 'hero-rider' (with mask) or 'bare-rider' (without), and 'big-hero-rider' / 'big-bare-rider'.
function makeRider(scene, look) {
  const key = `${look}-rider`;
  if (scene.textures.exists(key)) return;
  const hero = scene.textures.get(`${look}-sit`).getSourceImage();
  const duck = scene.textures.get('big-duck').getSourceImage();
  // The seat is where the normal sitting pose's bottom (50 px down) meets the duck's back; a taller
  // big pose sits on the same spot, so the duck moves down by the extra height.
  const duckY = 12 + hero.height - 50;
  const tex = scene.textures.createCanvas(key, Math.max(55, hero.width), duckY + duck.height);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(duck, 8, duckY);
  ctx.drawImage(hero, 0, 0); // seat on the back, face and crown of the duck still showing
  tex.refresh();
}

export function createSprites(scene) {
  for (const look of ['hero', 'bare', 'big-hero', 'big-bare']) makeRider(scene, look);
}
