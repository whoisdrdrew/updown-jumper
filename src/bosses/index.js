// The end bosses, by id. A boss is its own design, separate from the same DJ's playable look
// (src/art/<dj>/playable/). Every boss class works like Boss.js (Solomun): constructor(scene,
// arena, tuning), .takeHit(), .hurtable, .mode ('defeated' when beaten), .standForPhoto(x, y, flip)
// for Felix's winner photo, and the events 'hit' (hitsLeft) and 'defeated'.
// The DJ bosses of levels 2+ are one file each in src/bosses/dj/ (on top of DjBoss.js); a file there
// is picked up on its own. Its `info`: id, name (the banner when the fight starts), level (the level
// he ends) and song (his beat for BossBeat: the bonus room, the Afterparty, the song menu).
// portrait: texture next to his hearts on the top bar.
import Boss from '../objects/Boss.js';
import { BOSS_SONG } from '../audio/BossBeat.js';

const djBosses = import.meta.glob('./dj/*.js', { eager: true });

export const BOSSES = {
  solomun: {
    id: 'solomun', name: 'SOLOMUN', level: 1, song: BOSS_SONG, portrait: 'solomun-portrait',
    create: (scene, arena, tuning) => new Boss(scene, arena, tuning),
  },
};

for (const mod of Object.values(djBosses)) {
  const { info, default: DjBossClass } = mod;
  BOSSES[info.id] = {
    ...info,
    portrait: `${info.id}-portrait`,
    create: (scene, arena, tuning) => new DjBossClass(scene, arena, tuning),
  };
}

// The bosses in level order.
export const BOSSES_BY_LEVEL = Object.values(BOSSES).sort((a, b) => a.level - b.level);
