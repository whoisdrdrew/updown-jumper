// On-screen controls for phones and tablets, NES style: a cross on the left, B (shoot, hold to run)
// and A (jump) on the right, in a bar under the game. Computers with a mouse never see them. Phones play sideways only.
//
// The buttons only set flags in `touch`; Controls.js reads them next to the keyboard, so the
// game itself doesn't know or care where an input came from.

export const touch = {
  enabled: false,
  left: false,
  right: false,
  up: false,
  down: false,
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
  #touch { flex: 0 0 auto; height: min(132px, 38vh); display: flex; align-items: center; justify-content: space-between;
    padding: 0 max(20px, env(safe-area-inset-right, 0px)) max(4px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px));
    box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
  /* NES look, after Sandro's reference: black cross in a grey frame, red B and A on a grey pill. */
  #touch .pad { position: relative; height: 92%; aspect-ratio: 1; }
  #touch .pad .frame { position: absolute; background: #8e8790; border: 2px solid #150b22; border-radius: 10px; }
  #touch .pad .frame.h { left: 0; right: 0; top: 30%; height: 40%; }
  #touch .pad .frame.v { top: 0; bottom: 0; left: 30%; width: 40%; }
  #touch .pad .frame.c { left: 30%; top: 30%; width: 40%; height: 40%; border: 0; border-radius: 0; }
  #touch .pad .arm { position: absolute; background: #221533; box-shadow: inset 0 3px 0 #30233f, inset 0 -3px 0 #0e0413; }
  #touch .pad .arm.h { left: 5%; right: 5%; top: 35%; height: 30%; border-radius: 6px; }
  #touch .pad .arm.v { top: 5%; bottom: 5%; left: 35%; width: 30%; border-radius: 6px; }
  #touch .pad .hub { position: absolute; left: 35%; top: 35%; width: 30%; height: 30%; background: #221533; }
  #touch .pad .hub::after { content: ''; position: absolute; inset: 25%; border-radius: 50%; background: #0e0413; }
  #touch .pad .arrow { position: absolute; width: 0; height: 0; border: 8px solid transparent; }
  #touch .pad .a-up { left: 50%; top: 10%; transform: translateX(-50%); border-bottom: 11px solid #0e0413; border-top: 0; }
  #touch .pad .a-down { left: 50%; bottom: 10%; transform: translateX(-50%); border-top: 11px solid #0e0413; border-bottom: 0; }
  #touch .pad .a-left { top: 50%; left: 10%; transform: translateY(-50%); border-right: 11px solid #0e0413; border-left: 0; }
  #touch .pad .a-right { top: 50%; right: 10%; transform: translateY(-50%); border-left: 11px solid #0e0413; border-right: 0; }
  #touch .pad .a-up.on { border-bottom-color: #ffe680; }
  #touch .pad .a-down.on { border-top-color: #ffe680; }
  #touch .pad .a-left.on { border-right-color: #ffe680; }
  #touch .pad .a-right.on { border-left-color: #ffe680; }
  #touch .buttons { position: relative; height: 100%; aspect-ratio: 1.6; }
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
      <div class="frame h"></div><div class="frame v"></div><div class="frame c"></div>
      <div class="arm h"></div><div class="arm v"></div><div class="hub"></div>
      <div class="arrow a-up"></div><div class="arrow a-down"></div><div class="arrow a-left"></div><div class="arrow a-right"></div>
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
  Object.assign(touch, { left: false, right: false, up: false, down: false, jump: false, action: false });
  document.querySelectorAll('#touch .on').forEach((el) => el.classList.remove('on'));
}

// The cross works like a real one: the thumb can roll between directions without lifting.
function setupPad(pad) {
  const arrows = {
    up: pad.querySelector('.a-up'),
    down: pad.querySelector('.a-down'),
    left: pad.querySelector('.a-left'),
    right: pad.querySelector('.a-right'),
  };
  let activeId = null;

  const set = (dirs) => {
    if (dirs.up && !touch.up) touch.jumpQueued = true; // up on the cross jumps, like the up arrow
    for (const k of Object.keys(arrows)) {
      touch[k] = Boolean(dirs[k]);
      arrows[k].classList.toggle('on', touch[k]);
    }
  };

  const fromPoint = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const dead = 0.25;
    // Diagonals count when the thumb is clearly between two arms.
    return {
      left: dx < -dead && Math.abs(dx) > Math.abs(dy) * 0.5,
      right: dx > dead && Math.abs(dx) > Math.abs(dy) * 0.5,
      up: dy < -dead && Math.abs(dy) > Math.abs(dx) * 0.5,
      down: dy > dead && Math.abs(dy) > Math.abs(dx) * 0.5,
    };
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
