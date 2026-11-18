// Level 1 GAMEPLAY: what you play on. The blocks, platforms, pits, enemies, items, the boss and the
// clock. What it looks like (background, palette, decor) is the WORLD file it names, in
// src/levels/worlds/. Tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
export default {
  level: 1,
  world: 'tulum', // src/levels/worlds/tulum.js
  boss: { id: 'solomun', hits: 3, speed: 1 }, // src/bosses/index.js; speed 1 = config.js BOSS
  time: 300, // seconds on the clock
  rows: [
    '                                                                                                                                                                ',
    '                                                                                                                                                                ',
    '                                                                                                        oooo                                K                   ',
    '                                                                                                        ====                                                    ',
    '                                    oooo                                                                              o                                         ',
    '              o     o o            ======        oo               oo    ooooo          oooo        =====             B                                          ',
    '              N    bNbHb                        o  o  oo          BB    bbNbb          ====     V                   BB                                          ',
    '                               ======                 BB          BB                          =====                BBB                                    F     ',
    ' P S                       G        C     G           BB    G     BB        G     G                 G    C    G   BBBB   oooo                                   ',
    '#################################################  #####################################  ######################################################################',
    '#################################################  #####################################  ######################################################################',
    '#################################################  #####################################  ######################################################################',
  ],
};
