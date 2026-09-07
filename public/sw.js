// Minimal service worker.
// Its only job is to make the app "installable" (Chrome/Android show an Install
// prompt when a service worker with a fetch handler is present). It deliberately
// does NOT cache app files, so you never get stuck on an old version after a
// redeploy — every load fetches the latest from the network.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  // pass through to the network
  event.respondWith(fetch(event.request).catch(() => new Response("", { status: 504 })));
});
