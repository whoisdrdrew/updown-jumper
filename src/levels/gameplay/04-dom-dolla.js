// Level 4 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/sanfrandisco.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: steep San Francisco hills (block stairs), cable-car rails as thin platforms.
export default {
  level: 4,
  world: 'sanfrandisco', // src/levels/worlds/sanfrandisco.js
  boss: { id: 'dom-dolla', hits: 4, speed: 1.15 }, // src/bosses/dj/dom-dolla.js
  time: 360, // seconds on the clock
  rows: [
    '                                                                                                                                                                                                                                                                      ',
    '                                                                                                                                                                                                                                                                      ',
    '                                            o                                         o                         o                                                                        o                         o                                                  ',
    '                                           o                                            o                      o o                                                       o              o  o                      o o                                                 ',
    '                   o         o                             o                         ====                                                o                                              ====                                                                          ',
    '                  bNbHb     bNb          BBBBB           bbNbb      oo     bbNbb              oo             BBBBB                       NbN    ooo        bYb         BBBBB                     oo             BBBBB                                                 ',
    '                                       BBBBBBBBB                   o                 ===     o  o          BBBBBBBBB            V              o   o                 BBBBBBBBB         ===      o   o         BBBBBBBBB                                               ',
    '                                     BBBBBBBBBBBBB                                                       BBBBBBBBBBBBB        =====                                BBBBBBBBBBBBB                            BBBBBBBBBBBBB            o o             K            F   ',
    ' P S                        G   G  BBBBBBBBBBBBBBBBB G   G  G  G  G    G  C   G  C  G    G          G  BBBBBBBBBBBBBBBBB  G                C         G  C        BBBBBBBBBBBBBBBBB  G         G           BBBBBBBBBBBBBBBBB G   C                                     ',
    '####################################################################  ################  ######  ################################################   #####################################   ######   ##################################################################',
    '####################################################################  ################  ######  ################################################   #####################################   ######   ##################################################################',
    '####################################################################  ################  ######  ################################################   #####################################   ######   ##################################################################',
  ],
};
