// What the studio's New Bookings and Special Stages windows list. The DJs and partners here are
// placeholders from the approved mockups until the real ones are booked; only Solomun is playable.
// New Bookings: the DJs who join each month, newest month last. A DJ's levels are Boris World levels
// (dj: the roster id once he is in the game) or his own, not built yet (count only).
export const BOOKINGS = [
  { month: 'OCTOBER 2026', djs: [{ name: 'SOLOMUN', dj: 'solomun', levels: [1] }] },
  { month: 'NOVEMBER 2026', djs: [{ name: 'DJ ONE', levelCount: 5, isNew: true }, { name: 'DJ TWO', levelCount: 5 }] },
];

// Special Stages: partner levels for a limited time, with their own boss (not a DJ). ends: last day.
export const STAGES = [
  { name: 'FESTIVAL NAME', prize: 'WIN: 2 FESTIVAL TICKETS', ends: '2026-11-02', color: 0x3cae4a },
  { name: 'CLUB NAME', prize: 'WIN: GUESTLIST SPOT', ends: '2026-11-11', color: 0x2a6ad0 },
  { name: 'BRAND NAME', prize: 'KEEPSAKE: GOLD HEADPHONES', ends: '2026-10-20', color: 0xff6aa8 },
];

// Whole days left until a stage ends (0 or less: ended).
export function daysLeft(stage, now = new Date()) {
  const end = new Date(`${stage.ends}T23:59:59`);
  return Math.ceil((end - now) / 86400000);
}
