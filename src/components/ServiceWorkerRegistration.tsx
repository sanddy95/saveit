"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);

          // Listen for online event to sync queued shares
          const handleOnline = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sync = (registration as any).sync;
            if (sync) {
              try {
                await sync.register("share-sync");
              } catch {
                // Background Sync not supported, manual replay
                replayShares();
              }
            } else {
              replayShares();
            }
          };

          window.addEventListener("online", handleOnline);

          return () => {
            window.removeEventListener("online", handleOnline);
          };
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}

async function replayShares() {
  try {
    const cache = await caches.open("share-queue-v1");
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const shareData = await response.json();
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
    }
  } catch {
    // Silently fail
  }
}
