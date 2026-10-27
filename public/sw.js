// Lets the installed app start and play without a connection. Nothing is downloaded up front:
// the page, game script, pictures, font and songs are kept the first time they load.
//   The page itself: fresh from the network when online (so new builds show up), the kept copy offline.
//   Everything else: the kept copy straight away, refreshed in the background.
// Songs play through <audio>, which asks for byte ranges; those are answered from the kept full file.
const CACHE = 'updown-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => keep(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./'))),
    );
    return;
  }
  if (req.headers.has('range')) {
    e.respondWith(ranged(req, url));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => keep(req, res));
      if (hit) {
        e.waitUntil(fresh.catch(() => {}));
        return hit;
      }
      return fresh;
    }),
  );
});

function keep(req, res) {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

// Answer a byte-range request (a song) from the kept file; if it isn't kept yet, pass the request
// on and fetch the whole file once in the background for next time.
async function ranged(req, url) {
  const hit = await caches.match(url.href);
  if (!hit) {
    fetch(url.href).then((res) => res.ok && caches.open(CACHE).then((c) => c.put(url.href, res))).catch(() => {});
    return fetch(req);
  }
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range')) || [];
  const start = m[1] ? Number(m[1]) : m[2] ? Math.max(0, buf.byteLength - Number(m[2])) : 0;
  const end = m[1] && m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
