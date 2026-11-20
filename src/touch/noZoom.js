// Stops phones from zooming in on the game, and undoes it if one does anyway.
//
// On iPhones a quick double tap, a pinch (two thumbs on the controls count), or turning the phone
// while the installed app is open could zoom the page in, and the game stayed stuck zoomed until
// the app was closed. The viewport tag and `touch-action: none` in index.html ask the browser not
// to zoom; iOS doesn't always listen, so this also blocks the gestures themselves and, as a last
// resort, notices a zoom and resets it.

const DOUBLE_TAP_MS = 350;

export function preventZoom(getGame) {
  const block = (e) => {
    if (e.cancelable) e.preventDefault();
  };
  const opts = { passive: false, capture: true };

  // Safari's pinch gesture events.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, block, opts);

  // Pinch: two or more fingers moving, or a scaled touch (iOS reports `scale`).
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || (e.scale !== undefined && e.scale !== 1)) block(e);
  }, opts);

  // Double-tap zoom: cancel the second of two quick taps. The game reads pointer events, which still
  // arrive, so no press is lost.
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < DOUBLE_TAP_MS) block(e);
    lastTouchEnd = now;
  }, opts);
  document.addEventListener('dblclick', block, opts);

  // Last resort: if the page got zoomed after all, put the zoom back to 1 and refit the game.
  const vv = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!vv || !meta) return;
  const base = meta.getAttribute('content');
  let fixing = false;
  const unzoom = () => {
    if (fixing || vv.scale <= 1.01) return;
    fixing = true;
    // Changing the viewport tag makes iOS re-apply its scale limits, which resets the zoom.
    meta.setAttribute('content', base.replace('maximum-scale=1', 'maximum-scale=1.0001'));
    requestAnimationFrame(() => {
      meta.setAttribute('content', base);
      window.scrollTo(0, 0);
      getGame()?.scale?.refresh();
      fixing = false;
    });
  };
  vv.addEventListener('resize', unzoom);
  vv.addEventListener('scroll', unzoom);
  window.addEventListener('orientationchange', () => setTimeout(unzoom, 300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) unzoom(); });
  setInterval(unzoom, 1000);
}
