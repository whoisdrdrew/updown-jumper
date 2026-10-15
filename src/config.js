// All the numbers that decide how the game feels live here, so they can be tuned in one place.
// Units: pixels and pixels per second (the game is 320x180, scaled up to fit the window).

// The world is laid out for a 320x180 view. The canvas is drawn ZOOM times larger so sprites that
// are drawn at half size (the hero) keep their full detail.
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const ZOOM = 2;
export const TILE = 16;
export const LEVEL_TIME = 300; // seconds on the clock per level

export const PHYSICS = {
  gravity: 900, // normal pull while rising with jump held
};

export const PLAYER = {
  width: 10, // hitbox; the sprite is a little wider
  height: 20, // hitbox from sneakers to forehead; the spiky hair is drawn above it

  walkSpeed: 90,
  runSpeed: 150,
  groundAccel: 500, // speeding up on the ground
  groundDecel: 700, // slowing down when no direction is held
  skidDecel: 1100, // turning around while moving the other way
  airAccel: 350, // steering in the air

  jumpSpeed: 290, // launch speed of a standing jump
  runJumpBonus: 0.25, // extra launch speed per unit of horizontal speed (running jumps go higher)
  releaseGravity: 1700, // gravity once jump is let go or the player is falling: short taps give short hops
  maxFallSpeed: 330,

  coyoteMs: 80, // can still jump this long after walking off a ledge
  jumpBufferMs: 110, // a jump pressed this long before landing still counts

  // Power state: 'small', 'big' or 'ducks'. Only 'ducks' can shoot rubber ducks. Power-up items
  // will change this in a later milestone; it starts at 'ducks' for now so shooting can be tried.
  startPower: 'ducks',

  maxHits: 2, // the second mango slip (or other hit) loses a life
  startAmmo: 0, // rubber ducks to shoot at the start; collect more in the level
  bigHeight: 26, // hitbox height after eating a burger (big Boris is about 1.3x as tall)
  blinkMs: 1500, // after a hit the player blinks and can't be hurt again for this long
};

// Rubber ducks fired with the shoot button.
export const SHOT = {
  speed: 210,
  launchSpeed: 60, // starts slightly downward so it quickly finds the ground
  bounceSpeed: 170,
  maxFallSpeed: 300,
  maxOnScreen: 2, // like Mario, only two at a time
};

export const MANGO = {
  rollSpeed: 32, // they roll along the floor this fast, Goomba pace
  slipSpeed: 170, // the player shoots forward when slipping...
  slipHop: 140, // ...with a small hop
  slipLockMs: 350, // and can't steer for a moment
};

// The big duck you hatch from an egg and ride, like Yoshi.
export const RIDE_DUCK = {
  eggRollSpeed: 50, // an egg from a music-note block hops out sideways...
  hatchDelayMs: 600, // ...lands, wobbles, and hatches after this long (or when touched)
  jumpBoost: 1.2, // jumps higher while riding (about 4 tiles from standing instead of 3)
  fleeSpeed: 130, // when you get hit, the duck runs off this fast...
  fleeRemountMs: 600, // ...and can be caught again after this long, if you're quick
};

// The burger power-up (our Mario mushroom): a box hops out of a music-note block, lands, and
// opens; eat the burger to grow big. Big, the next hit only shrinks you back.
export const BURGER = {
  boxHopSpeedX: 50, // the box hops out sideways, the way the player faces...
  boxHopSpeedY: 160,
  boxSlideSpeed: 60, // on top of blocks it slides along until it drops to the ground
  openDelayMs: 500, // ...lands, wobbles, and pops open after this long (or when touched)
};

// The end boss of world 1, Solomun. Mario 3 Koopaling rules: three hits and he's out, and after
// each hit he spins for a moment (can't be hurt) and gets a little faster.
export const BOSS = {
  hits: 3, // a stomp or a rubber duck each take one
  floatSpeed: 0.9, // how fast he drifts across the arena (sway cycles per second x 2pi)
  floatRange: 110, // how far left and right of the arena centre he drifts
  hoverHeight: 70, // pixels above the floor while floating
  maxSpeed: 110, // top flying speed
  swoopSpeed: 130, // top speed when he dives at the player
  floatMs: 2600, // time floating before the next towel attack
  windupMs: 600, // towel waving before the dive: the warning
  lowMs: 900, // time spent low over the floor after a dive (when ducks can reach him)
  hurtMs: 1200, // spinning after a hit, can't be hurt again
  speedUpPerHit: 1.2, // Koopaling style: faster after every hit
  stompBounce: 260, // the player bounces off his head this fast
};

// The duck bonus room behind the VIP door, like the Mario 3 coin rooms: start the timer, then
// bounce on the trampoline floor and grab as many ducks as you can before it runs out.
export const BONUS = {
  timeLimit: 20, // seconds on the bonus clock
  bounceSpeed: 460, // the trampoline throws you up this fast; hold jump to go higher (to the top row)
  doorReach: 10, // stand this close to a door or button (horizontally) and press down to use it
};
