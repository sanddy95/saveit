const CACHE_NAME = "saveit-v1";
const SHARE_QUEUE = "share-queue-v1";

const PRECACHE_URLS = ["/dashboard", "/login"];

// Install — precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== SHARE_QUEUE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle share target POST when offline
  if (url.pathname === "/api/share" && request.method === "POST") {
    event.respondWith(handleShare(request));
    return;
  }

  // Static assets — cache first
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation and API — network first
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match("/dashboard"))
    );
    return;
  }

  // Default — network first
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Handle share target
async function handleShare(request) {
  // Parse form data before consuming the request
  const formData = await request.formData().catch(() => null);
  const title = formData ? formData.get("title") || "" : "";
  const text = formData ? formData.get("text") || "" : "";
  const url = formData ? formData.get("url") || "" : "";

  try {
    // Forward to server silently (don't follow redirects)
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (text) params.set("text", text);
    if (url) params.set("url", url);

    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      redirect: "manual",
    });

    // Show success notification
    const displayUrl = url || text || title || "Link";
    await self.registration.showNotification("SaveIt", {
      body: `Saved: ${displayUrl.slice(0, 100)}`,
      icon: "/icons/icon-192.png",
      tag: "share-saved",
      data: { url: "/dashboard" },
    });
  } catch (err) {
    // Offline — queue the share
    const shareData = { title, text, url, timestamp: Date.now() };
    const cache = await caches.open(SHARE_QUEUE);
    await cache.put(
      new Request(`/share-queue/${shareData.timestamp}`),
      new Response(JSON.stringify(shareData))
    );

    if (self.registration.sync) {
      await self.registration.sync.register("share-sync");
    }

    await self.registration.showNotification("SaveIt", {
      body: "Link queued — will save when online",
      icon: "/icons/icon-192.png",
      tag: "share-queued",
    });
  }

  // Return a self-closing page instead of redirecting to dashboard
  return new Response(
    `<!DOCTYPE html><html><head><title>Saved</title></head>
     <body><script>window.close();</script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

// Handle notification click — open dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Background sync — replay queued shares
self.addEventListener("sync", (event) => {
  if (event.tag === "share-sync") {
    event.waitUntil(replayQueuedShares());
  }
});

async function replayQueuedShares() {
  const cache = await caches.open(SHARE_QUEUE);
  const requests = await cache.keys();

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const shareData = await response.json();

    try {
      const params = new URLSearchParams();
      if (shareData.title) params.set("title", shareData.title);
      if (shareData.text) params.set("text", shareData.text);
      if (shareData.url) params.set("url", shareData.url);

      await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        redirect: "manual",
      });

      await cache.delete(request);
    } catch {
      // Will retry on next sync
    }
  }
}
