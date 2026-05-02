// Minimal service worker — satisfies the PWA install prompt criteria.
// Intentionally does not cache routes: Next.js handles caching, and stale
// pre-cached HTML during active development causes real headaches. Add
// targeted runtime caching here once the app stabilizes.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op — let the network handle every request for now.
});
