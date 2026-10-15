// What the player has done before, saved in this browser so it survives a reload.
// Storage can be blocked (private windows, strict settings); then nothing is remembered.
const SEEN_INTRO = 'updown-jumper.seen-intro';

// The intro can be skipped once it has been watched to the end and level 1 has been started.
export function hasSeenIntro() {
  try {
    return localStorage.getItem(SEEN_INTRO) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(SEEN_INTRO, '1');
  } catch {
    // Not saved; the intro just stays unskippable.
  }
}
