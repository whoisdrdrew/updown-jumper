// On-screen controls for phones and tablets, NES style: a left/right rocker on the left, B (shoot, hold to run)
// and A (jump) on the right, see-through on top of the brick floor of a full-screen game. Computers with a mouse never see them. Phones play sideways only.
//
// The buttons only set flags in `touch`; Controls.js reads them next to the keyboard, so the
// game itself doesn't know or care where an input came from.

export const touch = {
  enabled: false,
  left: false,
  right: false,
  jump: false,
  action: false,
  // Presses remembered until the game reads them, so a quick tap is never lost.
  jumpQueued: false,
  shootQueued: false,
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
  #touch { position: fixed; left: 0; right: 0; bottom: 0; height: min(130px, 32vh); z-index: 5; pointer-events: none;
    display: flex; align-items: flex-end; justify-content: space-between; opacity: 0.55;
    padding: 0 max(14px, env(safe-area-inset-right, 0px)) max(8px, env(safe-area-inset-bottom, 0px)) max(14px, env(safe-area-inset-left, 0px));
    box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
  #touch .pad, #touch .btn { pointer-events: auto; }
  /* NES look, after Sandro's reference: black cross in a grey frame, red B and A on a grey pill. */
  #touch .pad { position: relative; height: 52%; aspect-ratio: 2.2; margin-bottom: 4%; }
  #touch .pad .frame { position: absolute; inset: 0; background: #8e8790; border: 2px solid #150b22; border-radius: 12px; }
  #touch .pad .arm { position: absolute; inset: 9%; background: #221533; border-radius: 8px;
    box-shadow: inset 0 3px 0 #30233f, inset 0 -3px 0 #0e0413; }
  #touch .pad .hub { position: absolute; left: 50%; top: 50%; width: 14%; aspect-ratio: 1; transform: translate(-50%, -50%);
    border-radius: 50%; background: #0e0413; }
  #touch .pad .arrow { position: absolute; top: 50%; width: 0; height: 0; border: 11px solid transparent; transform: translateY(-50%); }
  #touch .pad .a-left { left: 14%; border-right: 15px solid #0e0413; border-left: 0; }
  #touch .pad .a-right { right: 14%; border-left: 15px solid #0e0413; border-right: 0; }
  #touch .pad .a-left.on { border-right-color: #ffe680; }
  #touch .pad .a-right.on { border-left-color: #ffe680; }
  #touch .buttons { position: relative; height: 92%; aspect-ratio: 1.6; }
  #touch .pill { position: absolute; left: 4%; right: 4%; top: 26%; height: 52%; background: #a396a6;
    border: 2px solid #150b22; border-radius: 999px; transform: rotate(-22deg); }
  #touch .btn { position: absolute; width: 34%; aspect-ratio: 1; border-radius: 50%; border: 2px solid #150b22;
    background: radial-gradient(circle at 38% 32%, #ff6b6b 0 18%, #d42a2a 45%, #8f1414 100%);
    box-shadow: 0 3px 0 #150b22; }
  #touch .btn.shoot { left: 9%; top: 41%; }
  #touch .btn.jump { right: 9%; top: 9%; }
  #touch .btn.on { transform: translateY(2px); box-shadow: 0 1px 0 #150b22; filter: brightness(1.15); }
  #touch .label { position: absolute; font: 10px "Press Start 2P", monospace; color: #fff; text-shadow: 1px 1px 0 #150b22;
    white-space: nowrap; pointer-events: none; text-align: center; transform: translateX(-50%); }
  #touch .label small { display: block; font-size: 6px; color: #c9ccd3; margin-top: 3px; }
  #touch .label.b { left: 26%; top: 80%; }
  #touch .label.a { left: 74%; top: 48%; }
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
      <div class="frame"></div><div class="arm"></div><div class="hub"></div>
      <div class="arrow a-left"></div><div class="arrow a-right"></div>
    </div>
    <div class="buttons">
      <div class="pill"></div>
      <div class="btn shoot" aria-label="Shoot"></div>
      <div class="btn jump" aria-label="Jump"></div>
      <div class="label b">B<small>SHOOT</small></div>
      <div class="label a">A<small>JUMP</small></div>
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
  Object.assign(touch, { left: false, right: false, jump: false, action: false });
  document.querySelectorAll('#touch .on').forEach((el) => el.classList.remove('on'));
}

// Left/right rocker: the thumb can roll from one side to the other without lifting.
function setupPad(pad) {
  const arrows = { left: pad.querySelector('.a-left'), right: pad.querySelector('.a-right') };
  let activeId = null;

  const set = (dirs) => {
    for (const k of Object.keys(arrows)) {
      touch[k] = Boolean(dirs[k]);
      arrows[k].classList.toggle('on', touch[k]);
    }
  };

  const fromPoint = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    return { left: dx < -0.12, right: dx > 0.12 };
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
