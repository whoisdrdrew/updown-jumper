// The duck bonus room behind the VIP door: drawn by tools/bonus_art.py at the hero's pixel size
// (2x the world), so everything is shown at half size.
import vipDoor from './bonus/vip-door.png';
import vipDoorOpen from './bonus/vip-door-open.png';
import buttonMusic from './bonus/button-music.png';
import buttonMusicPressed from './bonus/button-music-pressed.png';
import buttonTimer from './bonus/button-timer.png';
import buttonTimerPressed from './bonus/button-timer-pressed.png';
import popupTimer from './bonus/popup-timer.png';
import lounge from './bonus/lounge.png';
import trampoline0 from './bonus/trampoline-0.png';
import trampoline1 from './bonus/trampoline-1.png';
import portrait from './bonus/portrait-solomun.png';
import portraitFrame from './bonus/portrait-frame.png';

export const BONUS_SCALE = 0.5;
// Where the popup's question goes inside popup-timer.png (art pixels): x, y, width, height.
export const POPUP_TEXT_BOX = { x: 44, y: 16, w: 176, h: 56 };
export const PORTRAIT_INSET = 10; // the picture sits this far inside the frame (art pixels)

const IMAGES = {
  'vip-door': vipDoor,
  'vip-door-open': vipDoorOpen,
  'button-music': buttonMusic,
  'button-music-pressed': buttonMusicPressed,
  'button-timer': buttonTimer,
  'button-timer-pressed': buttonTimerPressed,
  'bonus-popup': popupTimer,
  'bonus-lounge': lounge,
  'trampoline-0': trampoline0,
  'trampoline-1': trampoline1,
  'bonus-portrait': portrait,
  'bonus-portrait-frame': portraitFrame,
};

export function preloadBonus(scene) {
  for (const [key, url] of Object.entries(IMAGES)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
