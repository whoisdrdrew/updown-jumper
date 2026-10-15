// Gray-box test level, drawn as text. One character = one 16x16 tile.
//   #  ground        B  solid block
//   =  thin platform (you can jump up through it and land on top)
//   P  player start  F  goal flag   K  Solomun (the boss arena is one screen wide around him)   S  suitcase with the mask (jump on it to put the mask on)
//   M  mango (slip hazard)  E  duck egg (hatches a ride-on duck)
//   o  rubber duck to collect (each one is one shot)
//   b  breakable brick   N  music-note block with a rubber duck   Y  music-note block with the duck egg
// Anything else is empty air. A gap in the bottom rows is a pit.
// From the level-system milestone on, levels come from the Tiled editor instead.
export default [
  '                                                                                                                                                                ',
  '                                                                                                                                                                ',
  '                                          oooo                                                           BB                                 K                   ',
  '                                          ====              oooo                 ===                                                                            ',
  '                                ooo                         BBBB   ooo  ooo               ===                                                                   ',
  '            ooo                 ===                               bbNbb ===                                                                                     ',
  '           bNbNb     bYb  ooo                    B                                 B                 ===                                                        ',
  '                  ooo     BBB                   BB          ====           B      BB          B                       oooo                                F     ',
  ' P S           M  ===               M  B       BBB      M            M    BB  M  BBB         BB      BBBBBB     M                                               ',
  '##############################   ###########  ####   ########    #######################   ######    ###########################################################',
  '##############################   ###########  ####   ########    #######################   ######    ###########################################################',
  '##############################   ###########  ####   ########    #######################   ######    ###########################################################',
];
