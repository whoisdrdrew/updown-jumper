// The Line-Up: the DJs you can play with. Beat them, then play them: a DJ joins once his levels are won.
// desk: his picture at the studio desk; portrait: his face in the Line-Up; songs: his tracks, on top of
// the song menu when he is picked; walks: he has his own walking pictures for the levels (until then
// the levels are played as Boris). A song has a url (an MP3) or a beat (made live by BossBeat).
import { SONGS } from './audio/songs.js';
import { BOSS_SONG } from './audio/BossBeat.js';
import { levelsDone } from './progress.js';

export const LINEUP_SIZE = 30;

export const DJ_ROSTER = [
  {
    id: 'boris', name: 'BORIS', desk: 'home-boris', portrait: 'lineup-boris', songs: SONGS, walks: true,
    unlocked: () => true,
  },
  {
    id: 'solomun', name: 'SOLOMUN', desk: 'home-solomun', portrait: 'lineup-solomun',
    songs: [{ name: 'SOLOMUN BEAT', beat: BOSS_SONG }], walks: false,
    levels: [1], // the world 1 boss
    unlocked: () => levelsDone() >= 1,
  },
];

export const djById = (id) => DJ_ROSTER.find((dj) => dj.id === id && dj.unlocked()) || DJ_ROSTER[0];
export const unlockedCount = () => DJ_ROSTER.filter((dj) => dj.unlocked()).length;

// The song menu: the picked DJ's songs first, then the other unlocked DJs' songs.
export function playlist(dj) {
  const others = DJ_ROSTER.filter((d) => d !== dj && d.unlocked());
  return [dj, ...others].flatMap((d) => d.songs);
}
