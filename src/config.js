// All the numbers that decide how the game feels live here, so they can be tuned in one place.
// Units: pixels and pixels per second (the game is 320x180, scaled up to fit the window).

export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const TILE = 16;

export const PHYSICS = {
  gravity: 900, // normal pull while rising with jump held
};

export const PLAYER = {
  width: 12,
  height: 16,

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

  // Power state: 'small', 'big' or 'fire'. Only 'fire' can shoot. Power-up items will change
  // this in a later milestone; it starts at 'fire' for now so the shoot button can be tried.
  startPower: 'fire',
};

export const FIREBALL = {
  speed: 210,
  launchSpeed: 60, // starts slightly downward so it quickly finds the ground
  bounceSpeed: 170,
  maxFallSpeed: 300,
  maxOnScreen: 2, // like Mario, only two at a time
};
