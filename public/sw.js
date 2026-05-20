/* Book It Daily service worker.
 *
 * Strategy:
 *   - Precache the offline fallback page + manifest icons on install.
 *   - Navigation requests:    network-first → fall back to cached HTML → /offline.html.
 *   - Static asset requests:  cache-first   → fall back to network → put copy in cache.
 *   - Everything else (POST, API):  bypass — let the network handle it.
 *
 * Cache version is bumped manually when this file changes. Old caches are
 * deleted on activate so users don't end up with stale shells.
 */

const VERSION = "v1";
const PRECACHE = `bookitdaily-precache-${VERSION}`;
const RUNTIME = `bookitdaily-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/bookitdaily-192.svg",
  "/icons/bookitdaily-512.svg",
  "/icons/bookitdaily-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const expected = new Set([PRECACHE, RUNTIME]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !expected.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Don't try to cache non-GET (POST, PUT, DELETE) — these are mutations.
  if (request.method !== "GET") return;

  // Don't cache cross-origin requests (CDN scripts, third-party fonts).
  // Let the browser handle them with its own caching.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Don't cache Next.js dev / hot-reload / RSC / data fetches —
  // these change rapidly and stale copies cause real headaches.
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/data") ||
    url.search.includes("_rsc=")
  ) {
    return;
  }

  // Navigation requests (clicking a link, typing a URL, refresh).
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (images, fonts, CSS, JS chunks Next.js compiled).
  const dest = request.destination;
  if (
    dest === "style" ||
    dest === "script" ||
    dest === "image" ||
    dest === "font" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Fall through — default fetch behavior.
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const fresh = await fetch(request);
    // Only cache successful responses.
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort — the offline shell.
    const offline = await caches.match("/offline.html");
    return offline ?? new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    // No fallback for sub-resources — let the page handle missing assets.
    return new Response("", { status: 504 });
  }
}

// Allow the page to ask the SW to skip waiting (e.g. after a fresh deploy banner).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
