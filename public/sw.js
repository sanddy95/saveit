const CACHE_NAME = "saveit-v3";
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

  // Handle share target POST — save silently and show notification
  if (url.pathname === "/api/share" && request.method === "POST") {
    event.respondWith(
      handleShare(request).catch(() =>
        new Response(
          `<!DOCTYPE html><html><head><title>Saved</title></head>
           <body><p>Saving...</p><script>window.close();</script></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        )
      )
    );
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
  const displayUrl = url || text || title || "Link";

  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (text) params.set("text", text);
  if (url) params.set("url", url);

  let saved = false;

  try {
    // Forward to server silently (don't follow redirects)
    await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      redirect: "manual",
    });
    saved = true;
  } catch (err) {
    // Offline — queue the share for later
    const shareData = { title, text, url, timestamp: Date.now() };
    const cache = await caches.open(SHARE_QUEUE);
    await cache.put(
      new Request(`/share-queue/${shareData.timestamp}`),
      new Response(JSON.stringify(shareData))
    );

    if (self.registration.sync) {
      await self.registration.sync.register("share-sync");
    }
  }

  // Show notification (won't throw if permission denied, just silently fails)
  try {
    await self.registration.showNotification("SaveIt", {
      body: saved
        ? `Saved: ${displayUrl.slice(0, 100)}`
        : "Link queued — will save when online",
      icon: "/icons/icon-192.png",
      tag: "share-result",
      data: { url: "/dashboard" },
    });
  } catch {
    // No notification permission — that's okay
  }

  // Return a brief confirmation page that auto-closes
  const message = saved ? "Link saved!" : "Link queued for later.";
  return new Response(
    `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>SaveIt</title>
      <style>
        body { font-family: system-ui; display: flex; align-items: center;
               justify-content: center; height: 100vh; margin: 0;
               background: #6366f1; color: white; }
        .msg { text-align: center; }
        h2 { margin: 0 0 8px; }
        p { margin: 0; opacity: 0.8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="msg">
        <h2>${message}</h2>
        <p>You can close this window.</p>
      </div>
      <script>
        // Try to close, then navigate back after a brief delay
        setTimeout(() => { window.close(); }, 1500);
        setTimeout(() => { history.back(); }, 2000);
      </script>
    </body></html>`,
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
