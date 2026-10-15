// Gray-box test level, drawn as text. One character = one 16x16 tile.
//   #  ground        B  solid block
//   =  thin platform (you can jump up through it and land on top)
//   P  player start  F  goal flag   K  Solomun (the boss arena is one screen wide around him)   S  suitcase with the mask (jump on it to put the mask on)
//   M  mango (rolls back and forth, slip hazard)  E  duck egg (hatches a ride-on duck)
//   o  rubber duck to collect (each one is one shot)
//   V  VIP door to the bonus room (stand in front of it and press down)
//   b  breakable brick   N  music-note block with a rubber duck   H  music-note block with the burger box
//   Y  music-note block with the duck egg (saved for later levels)
// Anything else is empty air. A gap in the bottom rows is a pit.
// From the level-system milestone on, levels come from the Tiled editor instead.
export default [
  '                                                                                                                                                                ',
  '                                                                                                                                                                ',
  '                                                                                                        oooo                                K                   ',
  '                                                                                                        ====                                                    ',
  '                                    oooo                                                                              o                                         ',
  '              o     o o            ======        oo               oo    ooooo          oooo        =====             B                                          ',
  '              N    bNbHb                        o  o  oo          BB    bbHbb          ====     V                   BB                                          ',
  '                               ======                 BB          BB                          =====                BBB                                    F     ',
  ' P S                       M              M           BB    M     BB        M     M                 M         M   BBBB   oooo                                   ',
  '#################################################  #####################################  ######################################################################',
  '#################################################  #####################################  ######################################################################',
  '#################################################  #####################################  ######################################################################',
];
