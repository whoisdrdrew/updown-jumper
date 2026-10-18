// The golden nuggets and the Afterparty room (art/afterparty in the project files), drawn at the
// hero's pixel size by the art thread. The Afterparty and the home screen show them 1:1 on the
// 640x360 canvas, so the numbers below are picture pixels.
import room from './afterparty/room.png';
import booth from './afterparty/booth.png';
import boothGlow0 from './afterparty/booth-glow-0.png';
import boothGlow1 from './afterparty/booth-glow-1.png';
import nugget from './afterparty/nugget.png';
import nuggetShine0 from './afterparty/nugget-shine-0.png';
import nuggetShine1 from './afterparty/nugget-shine-1.png';
import nuggetShine2 from './afterparty/nugget-shine-2.png';
import nuggetIcon from './afterparty/nugget-icon.png';
import nuggetSlot from './afterparty/nugget-slot.png';
import ticket from './afterparty/ticket.png';
import ticketLocked from './afterparty/ticket-locked.png';

export const NUGGET_COUNT = 10; // one per level
export const ROOM_FLOOR = 300;
export const BOOTH_SPRITE = { x: 256, y: 216 }; // top-left of booth.png, drawn over the DJ who plays
export const BOOTH_GLOW = { x: 269, y: 225 };
export const BOOTH_DJ = { x: 320, y: 252 }; // feet of the DJ who plays
export const BOOTH_STEPS = { x: 320, y: 300 }; // the foot of the steps up to the stage
// Feet of the 10 DJs hanging out: the back row on the floor, then the front row.
export const DJ_SPOTS = [
  { x: 40, y: 300 }, { x: 98, y: 300 }, { x: 156, y: 300 }, { x: 484, y: 300 }, { x: 542, y: 300 },
  { x: 600, y: 300 }, { x: 110, y: 348 }, { x: 250, y: 348 }, { x: 390, y: 348 }, { x: 530, y: 348 },
];
// The DJs are the end bosses of the 10 levels, in level order; the ones not drawn yet are null.
// beat: the song he plays at the booth (his boss beat).
export const DJS = [
  { name: 'SOLOMUN', texture: 'solomun-photo-pose', beat: 'solomun' },
  null, null, null, null, null, null, null, null, null,
];

export function preloadNuggets(scene) {
  scene.load.image('nugget', nugget);
  [nuggetShine0, nuggetShine1, nuggetShine2].forEach((url, i) => scene.load.image(`nugget-shine-${i}`, url));
  scene.load.image('nugget-icon', nuggetIcon);
  scene.load.image('nugget-slot', nuggetSlot);
  scene.load.image('ticket', ticket);
  scene.load.image('ticket-locked', ticketLocked);
}

export function preloadAfterparty(scene) {
  preloadNuggets(scene);
  scene.load.image('afterparty-room', room);
  scene.load.image('afterparty-booth', booth);
  scene.load.image('afterparty-glow-0', boothGlow0);
  scene.load.image('afterparty-glow-1', boothGlow1);
}
