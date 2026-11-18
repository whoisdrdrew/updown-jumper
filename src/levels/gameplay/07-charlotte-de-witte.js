// Level 7 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/ghent.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: the rooftop route over the stepped gables, then the narrow stone gate at the castle.
export default {
  level: 7,
  world: 'ghent', // src/levels/worlds/ghent.js
  boss: { id: 'charlotte-de-witte', hits: 5, speed: 1.3 }, // src/bosses/dj/charlotte-de-witte.js
  time: 420, // seconds on the clock
  rows: [
    '                                                                                                                                                                                                                                                                                                                    BBB                                     ',
    '                                                                                                                                                                                                                                                                                                                    BBB                                     ',
    '                                              o                                                                                                                                                        o                                                                                                            BBB     o                               ',
    '                                             o o                                                                                    o                             o o                                   o                                                            o                                              BBB      o                              ',
    '                   o                                                                                                                                                                                                                                                                                                BBB                                     ',
    '                  bNbHb       ooo          BBBBB                       bNbNb      ooo          BBBBB                o           BBBBB                           BBBBB                               BBBBB             bYb                ooo                     BBBBB                 oo                           BBB  BBBBB                              ',
    '                                 o       BBBBBBB                                             BBBBBBB             o            BBBBBBB                         BBBBBBB                 V           BBBBBBB                               o    o                 BBBBBBB              oo   oo              o    oo       BBBBBBB                              ',
    '                                       BBBBBBBBB    BB                                     BBBBBBBBB   BB                   BBBBBBBBB   BB                  BBBBBBBBB     BB        =====       BBBBBBBBB    BB                                              BBBBBBBBB     BB                                        BBBBoBoBo             K            F   ',
    ' P S                       G       G BBBBBBBBBBB    BBBB   G G C  G G C G    C  G      G BBBBBBBBBBB   BBBB G G           BBBBBBBBBBB   BBBB G G G   C  G BBBBBBBBBBB     BBBB G              BBBBBBBBBBB    BBBB G         C  G G C           G  G G C G  BBBBBBBBBBB     BBBB  G G          C   G  C G        G  BBBBBBBBBBB                              ',
    '#############################    ###############    ##############################   ###############   ##########     ###############   #############################     ###############################    ###########################     #########################     ##########     ################     #############################################',
    '#############################    ###############    ##############################   ###############   ##########     ###############   #############################     ###############################    ###########################     #########################     ##########     ################     #############################################',
    '#############################    ###############    ##############################   ###############   ##########     ###############   #############################     ###############################    ###########################     #########################     ##########     ################     #############################################',
  ],
};
