// Level 2 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/ibiza.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: white cube houses as stairs up and down, thin stage risers over the pits.
export default {
  level: 2,
  world: 'ibiza', // src/levels/worlds/ibiza.js
  boss: { id: 'miss-monique', hits: 3, speed: 1.05 }, // src/bosses/dj/miss-monique.js
  time: 320, // seconds on the clock
  rows: [
    '                                                                                                                                                                                              ',
    '                                                                                                                                                                                              ',
    '                             oo                                                                                                                                                               ',
    '                            o  o                           o                      o                        o                                    o                                             ',
    '                   o        ====               o          o o        o           o o                      o o       o                o         o                                              ',
    '                  bNbHb             oo         NbN                  bNbNb                                           NbN      oo     bNb                                                       ',
    '                            ===    o  o                 BBBBB                  BBBBB          V         BBBBB                  o             BBBBB                                            ',
    '                                                        BBBBB                  BBBBB        =====       BBBBB                                BBBBB         o o o             K            F   ',
    ' P S                                      G    G  G   BBBBBBBBB     G    G   BBBBBBBBB  G             BBBBBBBBB    G    C  G     G    C    BBBBBBBBB G  C                                     ',
    '#############################  #####  #######################################################################################  ###############################################################',
    '#############################  #####  #######################################################################################  ###############################################################',
    '#############################  #####  #######################################################################################  ###############################################################',
  ],
};
