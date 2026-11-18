// The Line-Up: the DJs you can play with. Beat them, then play them: a DJ joins once his levels are won.
// desk: his picture at the studio desk; portrait: his face in the Line-Up; songs: his tracks, on top of
// the song menu when he is picked; skin: the prefix of his walking pictures in the levels (src/art/<dj>/
// playable/, '' for Boris). A song has a url (an MP3) or a beat (made live by BossBeat).
import { SONGS } from './audio/songs.js';
import { BOSSES_BY_LEVEL } from './bosses/index.js';
import { levelsDone } from './progress.js';

export const LINEUP_SIZE = 30;

export const DJ_ROSTER = [
  {
    id: 'boris', name: 'BORIS', desk: 'home-boris', portrait: 'lineup-boris', songs: SONGS, skin: '',
    unlocked: () => true,
  },
  // The end bosses, in level order (src/bosses/): each joins once his level is won.
  ...BOSSES_BY_LEVEL.map((boss) => ({
    id: boss.id, name: boss.name, desk: `home-${boss.id}`, portrait: `lineup-${boss.id}`,
    songs: [{ name: `${boss.name} BEAT`, beat: boss.song }], skin: `${boss.id}-`,
    levels: [boss.level],
    unlocked: () => levelsDone() >= boss.level,
  })),
];

export const djById = (id) => DJ_ROSTER.find((dj) => dj.id === id && dj.unlocked()) || DJ_ROSTER[0];
export const unlockedCount = () => DJ_ROSTER.filter((dj) => dj.unlocked()).length;

// The song menu: the picked DJ's songs first, then the other unlocked DJs' songs.
export function playlist(dj) {
  const others = DJ_ROSTER.filter((d) => d !== dj && d.unlocked());
  return [dj, ...others].flatMap((d) => d.songs);
}
