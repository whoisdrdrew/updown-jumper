// WORLD: the Ibiza club at sunset from Sandro's style reference (art/style-reference.png). Not
// used by a level yet; kept as a ready-made world. See tulum.js for what a world file holds.
export default {
  id: 'club',
  name: 'IBIZA',
  dj: null,
  background: 'club', // builder in src/art/background.js
  tiles: 'tiles',
  pit: 'black',
  palette: {},
  layers: [
    'sky: sunset sky (fixed)',
    'venue: the club with its LED stage screen (scrolls 0.15), sweeping light beams',
    'crowd: the crowd and palm trees (scrolls 0.4)',
  ],
  motifs: ['stage risers as blocks', 'speaker stacks as solid walls'],
};
