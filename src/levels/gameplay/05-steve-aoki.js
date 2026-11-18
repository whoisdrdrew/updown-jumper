// Level 5 GAMEPLAY: what you play on. What it looks like is the WORLD file it names
// (src/levels/worlds/bakery.js); tuning this file never changes the world.
// The tile letters are listed in src/levels/legend.js. One character = one 16x16 tile; the
// bottom three rows are the ground, and a gap in them is a pit.
// Shape: long conveyor belts (thin platforms) over the floor, stacked trays as stairs.
export default {
  level: 5,
  world: 'bakery', // src/levels/worlds/bakery.js
  boss: { id: 'steve-aoki', hits: 4, speed: 1.2 }, // src/bosses/dj/steve-aoki.js
  time: 380, // seconds on the clock
  rows: [
    '                                                                                                                                                                                                                                                                                              ',
    '                                                                                                                                                                                                                                                                                              ',
    '                                                                                                                                                                                                                                                                                              ',
    '                                                                                            o                                o                                                                                                                                                                ',
    '                   o                                                                       o                                o o                                                                                                           o o       o o                                       ',
    '                  bNbHb                     o  o      oo                    o  o                       o                                              o       o  o  o        bYb      o                o     o          o     o                                                               ',
    '                             BBBBB              o    o  o    o    o    ============      BBBBB        o                   BBBBB          V           o  o   ============            ============     ============     ============      BBBBB     BBBBB                                       ',
    '                             BBBBB                                                       BBBBB                            BBBBB        =====                                                                                            BBBBB     BBBBB    o o o             K            F   ',
    ' P S                       BBBBBBB        G      G          G       G B  G  G  G   BG  BBBBBBB       G            G  G  BBBBBBB   G              C         BG  G   C   GB G        B    G  C  G BG  B G     C  G BG  B       C   GB   BBBBBBB   BBBBBBB                                       ',
    '##################################    ######    ######  ######    ############################   ######   #####################  #####################  ######################################################################################################################################',
    '##################################    ######    ######  ######    ############################   ######   #####################  #####################  ######################################################################################################################################',
    '##################################    ######    ######  ######    ############################   ######   #####################  #####################  ######################################################################################################################################',
  ],
};
