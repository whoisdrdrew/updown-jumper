// The 5 songs on the home screen's song menu. Placeholders until Sandro picks the real 5: each one
// is our own little loop made with Web Audio (BossBeat.js), so there are no sound files yet.
// bass: a note per sixteenth (MIDI numbers, 0 = rest); chords: one per bar, 4 bars.
export const SONGS = [
  {
    name: 'TRACK 1',
    bpm: 120,
    bass: [45, 0, 0, 45, 0, 0, 52, 0, 45, 0, 0, 48, 0, 50, 0, 52],
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
    stabs: [0, 10],
  },
  {
    name: 'TRACK 2',
    bpm: 124,
    bass: [38, 0, 38, 0, 0, 41, 0, 38, 0, 0, 43, 0, 38, 0, 45, 0],
    chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]],
    stabs: [2, 6, 14],
  },
  {
    name: 'TRACK 3',
    bpm: 118,
    bass: [40, 0, 0, 0, 47, 0, 0, 40, 0, 0, 43, 0, 0, 45, 0, 0],
    chords: [[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 62, 66]],
    stabs: [0, 7],
  },
  {
    name: 'TRACK 4',
    bpm: 126,
    bass: [43, 43, 0, 43, 0, 50, 0, 43, 0, 46, 0, 43, 0, 48, 50, 0],
    chords: [[67, 70, 74], [63, 67, 70], [65, 69, 72], [62, 65, 69]],
    stabs: [0, 4, 10],
  },
  {
    name: 'TRACK 5',
    bpm: 116,
    bass: [36, 0, 0, 0, 0, 0, 43, 0, 36, 0, 0, 0, 39, 0, 41, 0],
    chords: [[60, 63, 67], [56, 60, 63], [58, 62, 65], [55, 58, 62]],
    stabs: [0, 12],
  },
];
