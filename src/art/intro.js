// The intro story's pictures (intro/art/ in the project files, drawn by tools/intro_art.py), at the
// hero's pixel size: shown at half size. Keys are 'intro-' plus the file name.

import bedBack from './intro/bed-back.png';
import bedFront from './intro/bed-front.png';
import bedroom from './intro/bedroom.png';
import borisAngry from './intro/boris-angry.png';
import borisCrouch from './intro/boris-crouch.png';
import borisRead from './intro/boris-read.png';
import borisSleep from './intro/boris-sleep.png';
import borisWake from './intro/boris-wake.png';
import bubbleTail from './intro/bubble-tail.png';
import dialogFrame from './intro/dialog-frame.png';
import doorClosed from './intro/door-closed.png';
import doorOpen from './intro/door-open.png';
import exclaim from './intro/exclaim.png';
import horse from './intro/horse.png';
import horseBlink from './intro/horse-blink.png';
import letter from './intro/letter.png';
import nextArrow0 from './intro/next-arrow-0.png';
import nextArrow1 from './intro/next-arrow-1.png';
import note from './intro/note.png';
import stable from './intro/stable.png';
import portraitBoris from './intro/portrait-boris.png';
import portraitBorisAngry from './intro/portrait-boris-angry.png';
import portraitHorse from './intro/portrait-horse.png';
import skipButton from './intro/skip-button.png';
import villaDoorOpen from './intro/villa-door-open.png';
import zzz from './intro/zzz.png';

const IMAGES = {
  'bed-back': bedBack,
  'bed-front': bedFront,
  'bedroom': bedroom,
  'boris-angry': borisAngry,
  'boris-crouch': borisCrouch,
  'boris-read': borisRead,
  'boris-sleep': borisSleep,
  'boris-wake': borisWake,
  'bubble-tail': bubbleTail,
  'dialog-frame': dialogFrame,
  'door-closed': doorClosed,
  'door-open': doorOpen,
  'exclaim': exclaim,
  'horse': horse,
  'horse-blink': horseBlink,
  'letter': letter,
  'next-arrow-0': nextArrow0,
  'next-arrow-1': nextArrow1,
  'note': note,
  'stable': stable,
  'portrait-boris': portraitBoris,
  'portrait-boris-angry': portraitBorisAngry,
  'portrait-horse': portraitHorse,
  'skip-button': skipButton,
  'villa-door-open': villaDoorOpen,
  'zzz': zzz,
};

export const INTRO_SCALE = 0.5;

export function preloadIntro(scene) {
  for (const [name, url] of Object.entries(IMAGES)) scene.load.image(`intro-${name}`, url);
}
