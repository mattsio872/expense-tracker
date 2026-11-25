// ===== Service worker =====
// A script the browser runs in the background, sitting BETWEEN the page and the network.
// Every request the app makes (the page, style.css, app.js, images) passes through the
// "fetch" handler below, which can answer from a saved copy (the cache) instead of the internet.
// That's what lets the app open with no signal.
//
// Your expenses are NOT stored here. They stay in localStorage, exactly as before.
// This file only saves the app's own files.

// Must match the ?v= number on the style.css and app.js links in index.html.
// Raise it whenever any app file changes: the browser sees sw.js changed, installs this new
// version, and the old cache is deleted.
const VERSION = 22;
const CACHE = `expense-tracker-v${VERSION}`;

// Everything the app needs to open offline
const APP_FILES = [
  './',
  `style.css?v=${VERSION}`,
  `app.js?v=${VERSION}`,
  'manifest.webmanifest',
  'images/monkey-icon.png',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/icon-maskable-512.png',
  'images/apple-touch-icon.png',
];

// 1. INSTALL: runs once per new version of this file. Download and save all the app files.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      // Don't wait for every open tab to close before taking over: the page itself is always
      // fetched fresh when online (see below), so the new version can start right away.
      .then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE: the new version takes over. Delete caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('expense-tracker-') && name !== CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim()) // start handling already-open pages too
  );
});

// 3. FETCH: every request from the app comes through here
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Only handle simple downloads of our own files; anything else goes to the network as normal
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // The page itself (index.html): NETWORK FIRST, so you always get the newest version when online
    event.respondWith(networkFirst(request));
  } else {
    // CSS, JS, images: CACHE FIRST. Safe because CSS/JS have a version in their address (?v=18),
    // so a new version is a NEW address that isn't in the cache yet.
    event.respondWith(cacheFirst(request));
  }
});

// Try the internet first; if that fails (offline), use the saved copy of the page
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    // cache: 'no-cache' = ask the server for the newest page, even if the browser has one saved
    let response = await fetch(request.url, { cache: 'no-cache' });
    // If the address was redirected (e.g. ".../expense-tracker" -> ".../expense-tracker/"),
    // Safari refuses a page a service worker hands over "after a redirect". Give it a clean copy.
    if (response.redirected) {
      response = new Response(await response.blob(), {
        status: response.status, statusText: response.statusText, headers: response.headers,
      });
    }
    if (response.ok) await cache.put('./', response.clone()); // keep the newest page for offline use
    return response;
  } catch (error) {
    const saved = await cache.match('./');
    return saved || Response.error();
  }
}

// Use the saved copy if we have one; otherwise download it and save it for next time
async function cacheFirst(request) {
  const saved = await caches.match(request);
  if (saved) return saved;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
