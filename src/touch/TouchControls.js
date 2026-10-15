// On-screen controls for phones and tablets, NES style: a cross on the left, B (shoot, hold to run)
// and A (jump) on the right, see-through on top of the brick floor of a full-screen game. Computers with a mouse never see them. Phones play sideways only.
//
// The buttons only set flags in `touch`; Controls.js reads them next to the keyboard, so the
// game itself doesn't know or care where an input came from.

export const touch = {
  enabled: false,
  left: false,
  right: false,
  up: false,
  down: false, // enters doors and presses the buttons in the bonus room
  jump: false,
  action: false,
  // Presses remembered until the game reads them, so a quick tap is never lost.
  jumpQueued: false,
  shootQueued: false,
  downQueued: false,
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
  /* Full screen game; the controls float over the brick floor at the bottom, half see-through. */
  body.touch-mode { padding: 0 !important; overflow: hidden; height: 100dvh; }
  body.touch-mode #game { position: fixed; inset: 0; }
  #touch { position: fixed; left: 0; right: 0; bottom: 0; height: min(150px, 36vh); z-index: 5; pointer-events: none;
    display: flex; align-items: flex-end; justify-content: space-between; opacity: 0.55;
    padding: 0 max(14px, env(safe-area-inset-right, 0px)) max(8px, env(safe-area-inset-bottom, 0px)) max(14px, env(safe-area-inset-left, 0px));
    box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
  #touch .pad, #touch .btn { pointer-events: auto; }
  /* NES look, after Sandro's reference: black cross in a grey frame, red B and A on a grey pill. */
  /* The cross: left and right keep their full size (--r tall, 1.04 --r wide) with a gap between
     them, so a thumb can't hit the wrong one; up and down sit above and below the gap. The cross is
     taller than the button side, so it reaches a little higher up the screen. */
  #touch { --r: min(93px, 22.3vh); }
  #touch .pad { position: relative; width: calc(var(--r) * 3); height: calc(var(--r) * 2.1); flex: none; }
  #touch .key { position: absolute; background: #8e8790; border: 2px solid #150b22;
    border-radius: 12px; box-sizing: border-box; }
  #touch .key.left, #touch .key.right { top: calc(var(--r) * 0.55); height: var(--r); width: calc(var(--r) * 1.04); }
  #touch .key.left { left: 0; }
  #touch .key.right { right: 0; }
  #touch .key.up, #touch .key.down { left: calc(var(--r) * 1.06); width: calc(var(--r) * 0.88); height: calc(var(--r) * 0.62); }
  #touch .key.up { top: 0; }
  #touch .key.down { bottom: 0; }
  #touch .key::before { content: ''; position: absolute; inset: 9%; background: #221533; border-radius: 8px;
    box-shadow: inset 0 3px 0 #30233f, inset 0 -3px 0 #0e0413; }
  #touch .key .arrow { position: absolute; left: 50%; top: 50%; width: 0; height: 0; border: 14px solid transparent; }
  #touch .key.left .arrow { transform: translate(-65%, -50%); border-right: 19px solid #0e0413; border-left: 0; }
  #touch .key.right .arrow { transform: translate(-35%, -50%); border-left: 19px solid #0e0413; border-right: 0; }
  #touch .key.up .arrow { transform: translate(-50%, -65%); border-bottom: 15px solid #0e0413; border-top: 0; border-width: 0 12px 15px; }
  #touch .key.down .arrow { transform: translate(-50%, -35%); border-top: 15px solid #0e0413; border-bottom: 0; border-width: 15px 12px 0; }
  #touch .key.left.on .arrow { border-right-color: #ffe680; }
  #touch .key.right.on .arrow { border-left-color: #ffe680; }
  #touch .key.up.on .arrow { border-bottom-color: #ffe680; }
  #touch .key.down.on .arrow { border-top-color: #ffe680; }
  #touch .key.on::before { background: #30233f; }
  /* B and A: red buttons on a grey pill, the letter and its job written inside each button. */
  #touch .buttons { position: relative; height: 100%; aspect-ratio: 1.75; }
  #touch .pill { position: absolute; left: 3%; right: 3%; top: 16%; height: 66%; background: #a396a6;
    border: 2px solid #150b22; border-radius: 999px; transform: rotate(-20deg); }
  #touch .btn { position: absolute; width: 38%; aspect-ratio: 1; border-radius: 50%; border: 2px solid #150b22;
    background: radial-gradient(circle at 38% 30%, #ff6b6b 0 16%, #d42a2a 48%, #8f1414 100%);
    box-shadow: 0 3px 0 #150b22; box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    font: 14px "Press Start 2P", monospace; color: #fff; text-shadow: 1px 1px 0 #150b22; }
  #touch .btn small { font-size: 6px; letter-spacing: 0; }
  #touch .btn.shoot { left: 5%; top: 32%; }
  #touch .btn.jump { right: 5%; top: 0; }
  #touch .btn.on { transform: translateY(2px); box-shadow: 0 1px 0 #150b22; filter: brightness(1.15); }
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
    <div class="pad" aria-label="Move">
      <div class="key up"><div class="arrow"></div></div>
      <div class="key left"><div class="arrow"></div></div>
      <div class="key right"><div class="arrow"></div></div>
      <div class="key down"><div class="arrow"></div></div>
    </div>
    <div class="buttons">
      <div class="pill"></div>
      <div class="btn shoot" aria-label="Shoot">B<small>SHOOT</small></div>
      <div class="btn jump" aria-label="Jump">A<small>JUMP</small></div>
    </div>`;
  const game = document.getElementById('game');
  game.after(bar);

  const rotate = document.createElement('div');
  rotate.id = 'rotate';
  rotate.innerHTML = 'Turn your phone sideways<br>to play';
  document.body.appendChild(rotate);

  setupPad(bar.querySelector('.pad'));
  setupButton(bar.querySelector('.btn.jump'), 'jump', 'jumpQueued');
  setupButton(bar.querySelector('.btn.shoot'), 'action', 'shootQueued');

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

function releaseAll() {
  Object.assign(touch, { left: false, right: false, up: false, down: false, jump: false, action: false });
  document.querySelectorAll('#touch .on').forEach((el) => el.classList.remove('on'));
}

// The cross: the thumb can still roll from one key to another without lifting.
function setupPad(pad) {
  const keys = {};
  for (const k of ['left', 'right', 'up', 'down']) keys[k] = pad.querySelector(`.key.${k}`);
  let activeId = null;

  const set = (dirs) => {
    for (const k of Object.keys(keys)) {
      const on = Boolean(dirs[k]);
      if (k === 'down' && on && !touch.down) touch.downQueued = true;
      touch[k] = on;
      keys[k].classList.toggle('on', on);
    }
  };

  // Measured from the centre of the cross, in units of the left/right key height (--r).
  const fromPoint = (e) => {
    const rect = pad.getBoundingClientRect();
    const r = rect.height / 2.1;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / r;
    const dy = (e.clientY - (rect.top + rect.height / 2)) / r;
    // In the left/right row: the gap in the middle presses neither. Above or below it: up or down.
    if (Math.abs(dy) <= 0.5) return { left: dx < -0.44, right: dx > 0.44 };
    return { up: dy < 0, down: dy > 0, left: dx < -0.6, right: dx > 0.6 };
  };

  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    activeId = e.pointerId;
    pad.setPointerCapture?.(e.pointerId);
    set(fromPoint(e));
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.pointerId === activeId) set(fromPoint(e));
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    set({});
  };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}

function setupButton(el, held, queued) {
  const ids = new Set();
  const update = () => {
    touch[held] = ids.size > 0;
    el.classList.toggle('on', touch[held]);
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    if (ids.size === 0) touch[queued] = true;
    ids.add(e.pointerId);
    update();
  });
  const end = (e) => {
    ids.delete(e.pointerId);
    update();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
