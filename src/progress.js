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

// Finished levels and their winner photos (small PNG data URLs), for the home screen.
const LEVELS = 'updown-jumper.levels';

function readLevels() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEVELS));
    if (saved && Array.isArray(saved.done)) return { done: saved.done, photos: saved.photos || {} };
  } catch {
    // Blocked or broken: start from nothing.
  }
  return { done: [], photos: {} };
}

// How many levels in a row are finished, from level 1: the next one is the one to play.
export function levelsDone() {
  const { done } = readLevels();
  let n = 0;
  while (done.includes(n + 1)) n += 1;
  return n;
}

export function levelPhoto(level) {
  return readLevels().photos[level] || null;
}

export function markLevelDone(level, photo) {
  const saved = readLevels();
  if (!saved.done.includes(level)) saved.done.push(level);
  if (photo) saved.photos[level] = photo; // a replay's photo replaces the old one
  try {
    localStorage.setItem(LEVELS, JSON.stringify(saved));
  } catch {
    // Not saved; the home screen just won't remember it after a reload.
  }
}
