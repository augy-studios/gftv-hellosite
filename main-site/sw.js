// GFTV HelloSpot service worker.
//
// Precaches the page and everything it needs to draw, and never activates a
// new version on its own: it installs, then waits until the page sends
// "skip-waiting" from the update bar (docs/update-bar-spec.md). skipWaiting()
// and clients.claim() appear nowhere outside that handler.
//
// VERSION is a whole number. Raise it by one on every deploy that changes
// anything below or anything in PRECACHE. The browser compares this file byte
// for byte; if nothing here changes, nobody is told.
//
// Strategies:
//   precached shell        cache first
//   /photos.json           network first, so a photo added to the gallery
//                          shows on the next visit without a version bump
//   other same-origin GETs cache first, stored on first use (the gallery and
//                          ramen photos, fetched by js/blob-images.js)
//   other origins          never touched (Google Analytics)

const VERSION = 14;
// Every cache this site has made starts with PREFIX, including release 1's
// date-named one, so activate clears them all but the current.
const PREFIX = 'gftv-hellospot-';
const CACHE = `${PREFIX}v${VERSION}`;

const PRECACHE = [
  '/',
  '/404.html',
  '/style.css',
  '/manifest.json',
  '/favicon.ico',
  '/gftv-flag.png',
  '/HSP-192.png',
  '/HSP-512.png',
  '/HSP-main.png',
  '/assets/fonts/ProximaNova-Regular.woff2',
  '/assets/12Ann%20Front.png',
  '/assets/12Ann%20Back.png',
  '/images/hellosmile.png',
  '/assets/i18n/i18n.js',
  '/assets/i18n/locales.js',
  '/assets/i18n/switcher.js',
  '/assets/i18n/boot.js',
  '/assets/i18n/en-GB.json',
  '/assets/i18n/en-US.json',
  '/assets/i18n/en-ARR.json',
  '/assets/i18n/zh-SG.json',
  '/assets/i18n/zh-CN.json',
  '/assets/i18n/zh-TW.json',
  '/assets/i18n/zh-HK.json',
  '/assets/i18n/ms.json',
  '/assets/i18n/ta.json',
  '/assets/i18n/id.json',
  '/assets/i18n/hi.json',
  '/assets/i18n/bn.json',
  '/assets/i18n/te.json',
  '/assets/i18n/es-MX.json',
  '/assets/i18n/es-ES.json',
  '/assets/i18n/nl.json',
  '/assets/i18n/eo.json',
  '/assets/i18n/th.json',
  '/assets/i18n/my.json',
  '/assets/i18n/lo.json',
  '/assets/i18n/vi.json',
  '/assets/i18n/tl.json',
  '/assets/i18n/tet.json',
  '/assets/i18n/ko-KR.json',
  '/assets/i18n/ko-KP.json',
  '/assets/i18n/ja.json',
  '/assets/i18n/ru.json',
  '/assets/i18n/uk.json',
  '/assets/i18n/pt-PT.json',
  '/assets/i18n/da.json',
  '/assets/i18n/nb.json',
  '/assets/i18n/sv.json',
  '/assets/i18n/bg.json',
  '/assets/i18n/hr.json',
  '/assets/i18n/cs.json',
  '/assets/i18n/et.json',
  '/assets/i18n/fi.json',
  '/assets/i18n/fr.json',
  '/assets/i18n/de.json',
  '/assets/i18n/el.json',
  '/assets/i18n/hu.json',
  '/assets/i18n/ga.json',
  '/assets/i18n/it.json',
  '/assets/i18n/lv.json',
  '/assets/i18n/lt.json',
  '/assets/i18n/mt.json',
  '/assets/i18n/pl.json',
  '/assets/i18n/ro.json',
  '/assets/i18n/sk.json',
  '/assets/i18n/sl.json',
  '/assets/i18n/en-UWU.json',
  '/assets/i18n/zh-Latn.json',
  '/assets/i18n/ta-Latn.json',
  '/assets/i18n/hi-Latn.json',
  '/assets/i18n/bn-Latn.json',
  '/assets/i18n/te-Latn.json',
  '/assets/i18n/th-Latn.json',
  '/assets/i18n/my-Latn.json',
  '/assets/i18n/lo-Latn.json',
  '/assets/i18n/ar-Latn.json',
  '/assets/i18n/ko-Latn-KR.json',
  '/assets/i18n/ko-Latn-KP.json',
  '/assets/i18n/ja-Latn.json',
  '/assets/i18n/ru-Latn.json',
  '/assets/i18n/uk-Latn.json',
  '/assets/i18n/bg-Latn.json',
  '/assets/i18n/el-Latn.json',
  '/assets/i18n/la.json',
  '/js/prepaint.js',
  '/js/scene-flag.js',
  '/js/hero-top.js',
  '/js/official-bar.js',
  '/js/analytics.js',
  '/js/app.js',
  '/js/page.js',
  '/js/chrome.js',
  '/js/theme.js',
  '/js/icons.js',
  '/js/ui.js',
  '/js/update-bar.js',
  '/js/photos.js',
  '/js/blob-images.js',
  '/js/shapes-data.js',
  '/js/backdrop-static.js',
  '/js/liquid-glass.js',
  '/js/section-dots.js',
  '/js/scene/main.js',
  '/js/scene/card.js',
  '/js/scene/smile-face.js',
  '/js/scene/smile-line.js',
  '/js/scene/smile-shape.js',
  '/js/scene/ring.js',
  '/js/scene/bowl.js',
  '/js/scene/colours.js',
  '/js/scene/maths.js',
  '/js/scene/paint.js',
  '/js/scene/shapes.js',
  '/js/vendor/three.module.min.js',
];

const NETWORK_FIRST = new Set(['/photos.json']);

// A redirected response cannot be served to a navigation, so store a clean copy.
async function fetchForCache(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`precache ${url}: ${response.status}`);
  if (!response.redirected) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  return new Response(await response.blob(), { status: 200, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(PRECACHE.map(async (url) => cache.put(url, await fetchForCache(url))));
    })
  );
  // No skipWaiting() here. The update bar asks for it.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  // No clients.claim() here either; see the message handler.
});

self.addEventListener('message', (event) => {
  const type = typeof event.data === 'string' ? event.data : event.data?.type;

  // The only place either of these is ever called.
  if (type === 'skip-waiting') {
    event.waitUntil(self.skipWaiting().then(() => self.clients.claim()));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (cause) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw cause;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

// Pages: the home page from the cache (it is the shell), anything else from
// the network, with the cached 404 page when offline.
async function navigation(request) {
  const url = new URL(request.url);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const cached = await caches.match('/');
    if (cached) return cached;
  }
  try {
    return await fetch(request);
  } catch (cause) {
    const fallback = await caches.match(url.pathname === '/' ? '/' : '/404.html');
    if (fallback) return fallback;
    throw cause;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigation(request));
  } else if (NETWORK_FIRST.has(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
