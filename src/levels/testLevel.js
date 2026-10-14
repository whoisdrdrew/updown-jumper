// Gray-box test level, drawn as text. One character = one 16x16 tile.
//   #  ground        B  solid block
//   =  thin platform (you can jump up through it and land on top)
//   P  player start  F  goal flag
//   M  mango (slip hazard)  E  duck egg (hatches a ride-on duck)
// Anything else is empty air. A gap in the bottom rows is a pit.
// From the level-system milestone on, levels come from the Tiled editor instead.
export default [
  '                                                                                                                        ',
  '                                                                                                                        ',
  '                                                                                                   BB                   ',
  '                                    ====                                   ===                                          ',
  '                                                      BBBB                          ===                                 ',
  '                          ===                                     ===                                                   ',
  '                                           B                                 B                 ===                     ',
  '                    BBB                   BB          ====           B      BB          B                           F   ',
  '   P     M  ===   E           M  B       BBB      M            M    BB  M  BBB         BB      BBBBBB     M             ',
  '########################   ###########  ####   ########    #######################   ######    ##########################',
  '########################   ###########  ####   ########    #######################   ######    ##########################',
  '########################   ###########  ####   ########    #######################   ######    ##########################',
];
