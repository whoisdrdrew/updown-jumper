// The pictures of the DJs from level 2 on (tools/dj_art.py draws them, one folder each in src/art/<id>/):
// '<id>-idle', '<id>-attack', '<id>-defeat', '<id>-photo-pose', '<id>-portrait' and his props (vinyl,
// cake, ...) as '<id>-<file>'; his face in the Line-Up ('lineup-<id>'), his picture at the studio
// desk and in the Afterparty ('home-<id>'), and the bonus room portrait ('bonus-portrait-<id>').
// Solomun's are loaded by sprites.js / home.js / bonus.js as before.
const boss = import.meta.glob('./*/*.png', { eager: true, import: 'default' });
const bonus = import.meta.glob('./bonus/portrait-*.png', { eager: true, import: 'default' });
const djPoses = import.meta.glob('./*/playable/*/idle.png', { eager: true, import: 'default' });

const DJ_IDS = new Set(Object.keys(djPoses).map((path) => path.split('/')[1]));
DJ_IDS.delete('solomun');

function load(scene, key, url) {
  if (!scene.textures.exists(key)) scene.load.image(key, url);
}

export function preloadDjArt(scene) {
  for (const [path, url] of Object.entries(boss)) {
    const [, id, file] = path.split('/');
    if (!DJ_IDS.has(id)) continue;
    const name = file.replace('.png', '');
    load(scene, `${id}-${name}`, url);
    if (name === 'portrait') load(scene, `lineup-${id}`, url);
    if (name === 'photo-pose') load(scene, `home-${id}`, url);
  }
  for (const [path, url] of Object.entries(bonus)) {
    const id = path.match(/portrait-(.+)\.png$/)[1];
    if (DJ_IDS.has(id)) load(scene, `bonus-portrait-${id}`, url);
  }
}
