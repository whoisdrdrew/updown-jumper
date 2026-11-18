// Level 3 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/mellow.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: marshmallows on sticks as pillars across pits, soft thin platforms above.
export default {
  level: 3,
  world: 'mellow', // src/levels/worlds/mellow.js
  boss: { id: 'marshmello', hits: 3, speed: 1.1 }, // src/bosses/dj/marshmello.js
  time: 340, // seconds on the clock
  rows: [
    '                                                                                                                                                                                                                                             ',
    '                                                                                                                                                                                                                                             ',
    '                             o                                        oo                         o                             o                         oo                            oo                                                    ',
    '                            o  o                          oo oo      o  o                                                    o  o                       o  o                          o  o                                                   ',
    '                   o        ====                        o   o  o     ====              o       ====                          ====                       ====      o                   ====                                                   ',
    '                  bNbHb              bbNbb                                     oo     bNb               bNb                           bYb                        bNbNb                                                                       ',
    '                            ===                             B        ===      o  o            ===                  V        ===                        ===                           ===                                                     ',
    '                                                        B   B  B                                                 =====                                                                                    o   o             K            F   ',
    ' P S                                     G   G       G  B   B  B          G            G    G        G    G               G                 G        G                 G  C      C  G       G   C      C                                     ',
    '#############################  ##########################   #  #######  #######  ##############   ###########################   ########################   ###########################   ####################################################',
    '#############################  ##########################   #  #######  #######  ##############   ###########################   ########################   ###########################   ####################################################',
    '#############################  ##########################   #  #######  #######  ##############   ###########################   ########################   ###########################   ####################################################',
  ],
};
