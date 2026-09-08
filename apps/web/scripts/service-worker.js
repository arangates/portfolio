/* Only public assets belong in this cache. Never add dashboard, RSC, API or document responses. */
const CACHE = "selvam-static-__BUILD_VERSION__";
const PUBLIC_FILES = [
  "/offline.html",
  "/favicon/web-app-manifest-192x192.png",
  "/favicon/web-app-manifest-512x512.png",
  "/favicon/maskable-512.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_FILES)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("selvam-static-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "APPLY_UPDATE") return;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.length !== 1 || windows[0].id !== event.source?.id) {
        event.source?.postMessage({ type: "UPDATE_BLOCKED" });
        return;
      }
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        async () =>
          (await caches.match("/offline.html", { cacheName: CACHE }).catch(() => undefined)) ??
          new Response("Selvam is offline. Reconnect and reload.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    return;
  }
  const publicFile = PUBLIC_FILES.includes(url.pathname) && !url.search;
  const immutableAsset =
    url.pathname.startsWith("/_next/static/") && /\.(?:js|css|woff2?|ttf|otf)$/.test(url.pathname);
  if (!publicFile && !immutableAsset) return;
  event.respondWith(
    (async () => {
      let cache;
      try {
        cache = await caches.open(CACHE);
        const stored = await cache.match(request);
        if (stored) return stored;
      } catch {
        return fetch(request);
      }
      const response = await fetch(request);
      if (
        response.ok &&
        response.type === "basic" &&
        !response.redirected &&
        !/private|no-store/i.test(response.headers.get("Cache-Control") ?? "")
      ) {
        try {
          await cache.put(request, response.clone());
          const keys = await cache.keys();
          const removable = keys.filter((key) => !PUBLIC_FILES.includes(new URL(key.url).pathname));
          await Promise.all(
            removable.slice(0, Math.max(0, keys.length - 180)).map((key) => cache.delete(key)),
          );
        } catch {
          /* Cache storage is optional; quota errors must not break online assets. */
        }
      }
      return response;
    })(),
  );
});
