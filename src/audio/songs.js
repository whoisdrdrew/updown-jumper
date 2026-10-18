// The 5 songs on the home screen's song menu: Boris Brejcha tracks from Sandro's "UP AND DOWN"
// playlist (used with permission). They are full tracks, compressed to 80 kbps MP3 for the browser,
// in public/music/ so they stream instead of being built into the game script.
const url = (file) => `${import.meta.env.BASE_URL}music/${file}`;

export const SONGS = [
  { name: 'UP DOWN JUMPER', url: url('up-down-jumper.mp3') },
  { name: 'LEVEL ONE', url: url('level-one.mp3') },
  { name: 'HOUSE MUSIC', url: url('house-music.mp3') },
  { name: 'GRAVITY', url: url('gravity.mp3') },
  { name: 'PURPLE NOISE', url: url('purple-noise.mp3') },
];

export const SONG_BPM = 124; // roughly; Boris nods along at this tempo
