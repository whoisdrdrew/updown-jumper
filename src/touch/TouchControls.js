// On-screen controls for phones and tablets, made to cover as little of the game as possible, like
// mobile platformers such as Leo's Fortune: the touch zones are big but invisible, and the drawings
// are small and faint, sitting in the side margins next to the game.
//   Left 45% of the screen (below the EXIT button): put the thumb down anywhere and a cross appears under it. Slide left or
//   right to walk, further to run, up for the VIP door. The cross follows a thumb that drifts.
//   Bottom right: B (shoot, hold to run) and A (jump); a tap presses whichever is nearer.
//   Slide between them without lifting. Computers with a mouse never see any of it. Sideways only.
//
// The controls only set flags in `touch`; Controls.js reads them next to the keyboard, so the
// game itself doesn't know or care where an input came from.

export const touch = {
  enabled: false,
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  action: false,
  run: false, // sliding the cross far to one side
  // Presses remembered until the game reads them, so a quick tap is never lost.
  jumpQueued: false,
  shootQueued: false,
  downQueued: false,
  upQueued: false, // the cross slid up: goes through the VIP door
};

// A touch screen with no mouse pointer: phones and tablets, not laptops with a touch screen.
export function isTouchDevice() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const noHover = window.matchMedia?.('(hover: none)').matches;
  return Boolean(coarse && noHover && navigator.maxTouchPoints > 0);
}

const CSS = `
  body.touch-mode #help { display: none; }
  body.touch-mode, body.touch-mode #game { touch-action: none; user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
  body.touch-mode { padding: 0 !important; overflow: hidden; height: 100dvh; }
  body.touch-mode #game { position: fixed; inset: 0; }
  #touch { position: fixed; inset: 0; z-index: 5; pointer-events: none; touch-action: none;
    user-select: none; -webkit-user-select: none;
    --safe-l: max(10px, env(safe-area-inset-left, 0px)); --safe-r: max(10px, env(safe-area-inset-right, 0px));
    --safe-b: max(12px, env(safe-area-inset-bottom, 0px)); }
  /* Invisible touch zones. */
  /* The move zone leaves the top strip free for the EXIT button. */
  #touch .move-zone { position: absolute; left: 0; top: 15%; bottom: 0; width: 45%; pointer-events: auto; }
  #touch .btn-zone { position: absolute; right: 0; top: 30%; bottom: 0; width: 38%; pointer-events: auto; }
  /* The cross: a small ghost bottom left at rest; under the thumb, bigger and brighter, while touched. */
  #touch .cross { position: absolute; width: 60px; height: 60px; left: var(--safe-l); bottom: var(--safe-b);
    opacity: 0.38; transform: translate(0, 0); }
  #touch .cross.live { width: 84px; height: 84px; opacity: 0.75; transform: translate(-50%, -50%); bottom: auto; }
  #touch .cross::before { content: ''; position: absolute; inset: -18%; border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.35); opacity: 0; }
  #touch .cross.live::before { opacity: 1; }
  #touch .arm { position: absolute; width: 33.4%; height: 33.4%; box-sizing: border-box;
    background: #221533; border: 2px solid #e8e0ef; border-radius: 4px; }
  #touch .arm.up { left: 33.3%; top: 0; }
  #touch .arm.down { left: 33.3%; bottom: 0; }
  #touch .arm.left { left: 0; top: 33.3%; }
  #touch .arm.right { right: 0; top: 33.3%; }
  #touch .arm.on { background: #ffe680; border-color: #ffe680; }
  /* B and A: small faint circles in the right margin; A up and to the right of B. */
  #touch .btn { position: absolute; border-radius: 50%; box-sizing: border-box; opacity: 0.38;
    background: radial-gradient(circle at 38% 30%, #ff6b6b 0 14%, #d42a2a 50%, #8f1414 100%);
    border: 2px solid #150b22; display: flex; align-items: center; justify-content: center;
    font: 12px "Press Start 2P", monospace; color: #fff; text-shadow: 1px 1px 0 #150b22; }
  #touch .btn.a { width: 54px; height: 54px; right: var(--safe-r); bottom: calc(var(--safe-b) + 58px); }
  #touch .btn.b { width: 44px; height: 44px; right: calc(var(--safe-r) + 52px); bottom: var(--safe-b); font-size: 10px; }
  #touch .btn.on { opacity: 1; transform: scale(0.94); }
  #rotate { display: none; position: fixed; inset: 0; z-index: 20; background: #12081c; color: #ffe680;
    font: 12px/2 "Press Start 2P", monospace; text-align: center; align-items: center; justify-content: center; padding: 24px; }
  @media (orientation: portrait) {
    body.touch-mode #rotate { display: flex; }
  }
`;

export function setupTouchControls(getGame) {
  if (!isTouchDevice()) return;
  touch.enabled = true;
  document.body.classList.add('touch-mode');

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'touch';
  bar.innerHTML = `
    <div class="move-zone" aria-label="Move"></div>
    <div class="btn-zone" aria-label="Jump and shoot"></div>
    <div class="cross"><div class="arm up"></div><div class="arm left"></div><div class="arm right"></div><div class="arm down"></div></div>
    <div class="btn b">B</div>
    <div class="btn a">A</div>`;
  const game = document.getElementById('game');
  game.after(bar);

  const rotate = document.createElement('div');
  rotate.id = 'rotate';
  rotate.innerHTML = 'Turn your phone sideways<br>to play';
  document.body.appendChild(rotate);

  setupStick(bar.querySelector('.move-zone'), bar.querySelector('.cross'));
  setupButtons(bar.querySelector('.btn-zone'), { a: bar.querySelector('.btn.a'), b: bar.querySelector('.btn.b') });

  // Long presses must not select text, open menus or zoom.
  bar.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // Sideways only: pause while the phone is upright.
  const portrait = window.matchMedia('(orientation: portrait)');
  const applyOrientation = () => {
    const g = getGame();
    if (!g) return;
    if (portrait.matches) {
      releaseAll();
      g.pause();
    } else {
      g.resume();
      g.scale.refresh();
    }
  };
  portrait.addEventListener?.('change', applyOrientation);
  window.addEventListener('resize', () => setTimeout(applyOrientation, 100));
  touch.applyOrientation = applyOrientation;

  // Where the browser allows it (Android), go full screen and lock to landscape on the first touch.
  const lock = () => {
    document.removeEventListener('pointerdown', lock);
    const el = document.documentElement;
    const fs = el.requestFullscreen?.({ navigationUI: 'hide' });
    Promise.resolve(fs)
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  };
  document.addEventListener('pointerdown', lock);
}

// The home screen is played by tapping the level cards, so the controls step aside there.
export function showTouchControls(on) {
  const bar = document.getElementById('touch');
  if (!bar) return;
  if (!on) releaseAll();
  bar.style.display = on ? '' : 'none';
}

function releaseAll() {
  Object.assign(touch, { left: false, right: false, up: false, down: false, jump: false, action: false, run: false });
  document.querySelectorAll('#touch .on').forEach((el) => el.classList.remove('on'));
}

// Distances in CSS pixels from where the thumb landed.
const DEAD_ZONE = 12; // closer than this: no direction
const RUN_AT = 40; // this far to the side also runs
const FOLLOW_AT = 60; // further than this, the centre is dragged along behind the thumb

// The floating cross: it centres where the left thumb lands, and directions are on/off.
function setupStick(zone, cross) {
  const arms = {};
  for (const k of ['left', 'right', 'up', 'down']) arms[k] = cross.querySelector(`.arm.${k}`);
  let activeId = null;
  let origin = null;

  const set = (dirs) => {
    if (dirs.down && !touch.down) touch.downQueued = true;
    if (dirs.up && !touch.up) touch.upQueued = true;
    for (const k of Object.keys(arms)) {
      touch[k] = Boolean(dirs[k]);
      arms[k].classList.toggle('on', touch[k]);
    }
    touch.run = Boolean(dirs.run);
  };

  const place = () => {
    cross.style.left = `${origin.x}px`;
    cross.style.top = `${origin.y}px`;
  };

  const fromPoint = (e) => {
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > FOLLOW_AT) {
      const pull = (dist - FOLLOW_AT) / dist;
      origin = { x: origin.x + dx * pull, y: origin.y + dy * pull };
      place();
      dx = e.clientX - origin.x;
      dy = e.clientY - origin.y;
    }
    if (dist < DEAD_ZONE) return {};
    // Each direction covers a wide wedge (diagonals press two), so a slightly tilted slide still walks.
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const horizontal = ax > DEAD_ZONE && ay < ax * 2;
    const vertical = ay > DEAD_ZONE && ax < ay * 1.2;
    return {
      left: horizontal && dx < 0,
      right: horizontal && dx > 0,
      up: vertical && dy < 0,
      down: vertical && dy > 0,
      run: horizontal && ax >= RUN_AT,
    };
  };

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (activeId !== null) return;
    activeId = e.pointerId;
    zone.setPointerCapture?.(e.pointerId);
    origin = { x: e.clientX, y: e.clientY };
    cross.classList.add('live');
    place();
    set({});
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId === activeId) set(fromPoint(e));
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    set({});
    cross.classList.remove('live');
    cross.style.left = '';
    cross.style.top = '';
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}

// A tap anywhere in the zone presses the nearer of B and A, and a thumb can slide from one to the
// other without lifting.
function setupButtons(zone, buttons) {
  const jobs = { a: ['jump', 'jumpQueued'], b: ['action', 'shootQueued'] };
  const holding = new Map(); // pointer id -> 'a' or 'b'

  const update = () => {
    for (const [name, [held]] of Object.entries(jobs)) {
      touch[held] = [...holding.values()].includes(name);
      buttons[name].classList.toggle('on', touch[held]);
    }
  };
  const press = (id, name) => {
    if (holding.get(id) === name) return;
    if (![...holding.values()].includes(name)) {
      touch[jobs[name][1]] = true;
      navigator.vibrate?.(8);
    }
    holding.set(id, name);
    update();
  };
  // Whichever drawn button is closer to the thumb, so B works where B is drawn (the zone's halves
  // didn't line up with the small buttons in the corner: tapping B used to jump).
  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const which = (e) => {
    const a = centre(buttons.a);
    const b = centre(buttons.b);
    const da = Math.hypot(e.clientX - a.x, e.clientY - a.y);
    const db = Math.hypot(e.clientX - b.x, e.clientY - b.y);
    return db < da ? 'b' : 'a';
  };

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    zone.setPointerCapture?.(e.pointerId);
    press(e.pointerId, which(e));
  });
  zone.addEventListener('pointermove', (e) => {
    if (holding.has(e.pointerId)) press(e.pointerId, which(e));
  });
  const end = (e) => {
    holding.delete(e.pointerId);
    update();
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}
