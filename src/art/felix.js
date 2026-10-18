// Felix the Photographer, from Sandro's reference photo: blond hair, a black tee with a neon yellow
// ring, a huge mustache and a flash camera. Drawn at the hero's pixel size by the art thread, shown
// at half size. The walk and shoot poses face left (the idle pose faces you).
import idle from './felix/idle.png';
import walk from './felix/walk.png';
import shoot from './felix/shoot.png';
import flash0 from './felix/flash-0.png';
import flash1 from './felix/flash-1.png';
import photoFrame from './felix/photo-frame.png';

export const FELIX_SCALE = 0.5;
// Where the camera's flash is in shoot.png, from his feet (art pixels, facing left).
export const FELIX_FLASH = { x: 11 - 22, y: 12 - 52 };
// The photo's window inside photo-frame.png (art pixels).
export const PHOTO_WINDOW = { x: 9, y: 9, w: 160, h: 112 };

export function preloadFelix(scene) {
  scene.load.image('felix-idle', idle);
  scene.load.image('felix-walk', walk);
  scene.load.image('felix-shoot', shoot);
  scene.load.image('felix-flash-0', flash0);
  scene.load.image('felix-flash-1', flash1);
  scene.load.image('photo-frame', photoFrame);
}
