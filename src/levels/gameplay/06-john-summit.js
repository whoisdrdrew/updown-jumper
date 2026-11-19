// Level 6 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/vail.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: gondola cabins (thin platforms) over the gaps, short climbs and long runs downhill.
export default {
  level: 6,
  world: 'vail', // src/levels/worlds/vail.js
  boss: { id: 'john-summit', hits: 4, speed: 1.25 }, // src/bosses/dj/john-summit.js
  time: 400, // seconds on the clock
  rows: [
    '                                                                                                                                                                                                                                                                                                                         ',
    '                                                                                                                                                                                                                                                                                                                         ',
    '                                                                                                                              o                                                                                                                                oo                                                        ',
    '                                                  o               o                              o  o                                   o                                                                                    o                                o            o                                             ',
    '                                                 o             ====                  o           ====          o            ====     ====                                       o                                         ====                                ====        o o                                            ',
    '                            o         o o                                                                                                      o o                  o oo                             o                                             o oo                                                                  ',
    '                  bNbHb     NbN     o    o     BBBBB         ===                   BBBBB         ===       BBBBB          ===        ===          o       V        o    o     BBBBB          bYb                        ===         BBBBB         o    o    ===         BBBBB                                            ',
    '                                             BBBBBBB                             BBBBBBB                 BBBBBBBBB                                      =====               BBBBBBBBB                                             BBBBBBB                             BBBBBBB           o               K            F   ',
    ' P S                        G   C  G       G BBBBBBB     G  G        G  G   C    BBBBBBB        G     G  BBBBBBBBBBBB G  G       G  G     G  G     G              G      G  BBBBBBBBBBBB G         G         C   G  C  G      G   BBBBBBB     G  G      G  G      G   BBBBBBB   G  C                                     ',
    '#####################################    ###########    ######    ######################    ######  #######################    #######  #######   ##################    #############################    ################    ############    ######    ######    ########################################################',
    '#####################################    ###########    ######    ######################    ######  #######################    #######  #######   ##################    #############################    ################    ############    ######    ######    ########################################################',
    '#####################################    ###########    ######    ######################    ######  #######################    #######  #######   ##################    #############################    ################    ############    ######    ######    ########################################################',
  ],
};
