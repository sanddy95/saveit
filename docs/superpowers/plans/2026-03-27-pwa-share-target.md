# PWA + Web Share Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SaveIt a PWA installable on mobile/desktop with a Web Share Target so links shared from any app auto-save as todos with metadata.

**Architecture:** Manual service worker for asset caching + offline share queue. Web App Manifest with `share_target` config. Share API route receives POST from OS, extracts URL, fetches metadata, creates TodoItem, redirects to dashboard with toast. Background Sync replays queued offline shares.

**Tech Stack:** Next.js 16, Web App Manifest, Service Worker API, Background Sync API, IndexedDB (via cache API)

---

## File Structure

### New Files

```
public/manifest.json                              — Web App Manifest with share_target
public/sw.js                                       — Service worker (caching + offline share queue)
public/icons/icon-192.png                          — PWA icon 192x192
public/icons/icon-512.png                          — PWA icon 512x512
src/app/api/share/route.ts                         — Share target API handler
src/components/ShareToast.tsx                      — Toast notification for shared links
src/components/ServiceWorkerRegistration.tsx        — SW registration + online sync
```

### Modified Files

```
src/app/layout.tsx                                 — Add manifest link to metadata
src/app/(app)/dashboard/page.tsx                   — Add ShareToast with query param detection
```

---

## Task 1: Create PWA Icons

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

- [ ] **Step 1: Generate icons using a Node script**

Run this command to create simple gradient icons with an "S" letter:

```bash
node -e "
const { createCanvas } = require('canvas');
// If canvas not available, create placeholder SVG-based PNGs
const fs = require('fs');
fs.mkdirSync('public/icons', { recursive: true });

// Create a simple SVG and convert concept - for now create placeholder files
// We'll use an inline SVG approach
const svg192 = \`<svg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'>
  <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#6366f1'/><stop offset='100%' stop-color='#8b5cf6'/></linearGradient></defs>
  <rect width='192' height='192' rx='40' fill='url(#g)'/>
  <text x='96' y='130' text-anchor='middle' font-family='Arial,sans-serif' font-weight='bold' font-size='120' fill='white'>S</text>
</svg>\`;

const svg512 = svg192.replace(/192/g, '512').replace(/40/g, '106').replace(/96/g, '256').replace(/130/g, '346').replace(/120/g, '320');

fs.writeFileSync('public/icons/icon-192.svg', svg192);
fs.writeFileSync('public/icons/icon-512.svg', svg512);
console.log('SVG icons created');
" 2>&1 || echo "Fallback to manual creation"
```

If the canvas approach doesn't work, create the SVG files manually. The manifest can reference SVG icons too — update the manifest `type` to `image/svg+xml`.

- [ ] **Step 2: Commit**

```bash
git add public/icons/
git commit -m "feat: add PWA icons"
```

---

## Task 2: Web App Manifest

**Files:**
- Create: `public/manifest.json`

- [ ] **Step 1: Create the manifest**

Create `public/manifest.json`:

```json
{
  "name": "SaveIt",
  "short_name": "SaveIt",
  "description": "Your personal productivity hub — todos, links, and boards",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "share_target": {
    "action": "/api/share",
    "method": "POST",
    "enctype": "application/x-www-form-urlencoded",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

Note: If Task 1 created PNG files instead of SVG, update the `type` to `image/png` and `src` to `.png`.

- [ ] **Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "feat: add web app manifest with share target"
```

---

## Task 3: Add Manifest Link to Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add manifest to metadata export**

In `src/app/layout.tsx`, update the `metadata` export to include the manifest:

```typescript
export const metadata: Metadata = {
  title: "SaveIt",
  description: "Your personal productivity hub — todos, links, and boards",
  manifest: "/manifest.json",
};
```

Just add the `manifest` field to the existing `metadata` object.

- [ ] **Step 2: Verify the manifest is served**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: link manifest.json in root layout metadata"
```

---

## Task 4: Service Worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Create the service worker**

Create `public/sw.js`:

```javascript
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
  try {
    // Try to forward to server
    const response = await fetch(request.clone());
    return response;
  } catch (err) {
    // Offline — queue the share
    const formData = await request.formData().catch(() => null);
    if (formData) {
      const shareData = {
        title: formData.get("title") || "",
        text: formData.get("text") || "",
        url: formData.get("url") || "",
        timestamp: Date.now(),
      };

      const cache = await caches.open(SHARE_QUEUE);
      await cache.put(
        new Request(`/share-queue/${shareData.timestamp}`),
        new Response(JSON.stringify(shareData))
      );

      // Register for background sync
      if (self.registration.sync) {
        await self.registration.sync.register("share-sync");
      }
    }

    // Redirect to dashboard with queued status
    return Response.redirect("/dashboard?shared=queued", 303);
  }
}

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
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add service worker with caching and offline share queue"
```

---

## Task 5: Service Worker Registration Component

**Files:**
- Create: `src/components/ServiceWorkerRegistration.tsx`

- [ ] **Step 1: Create the registration component**

Create `src/components/ServiceWorkerRegistration.tsx`:

```typescript
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
            if (registration.sync) {
              try {
                await registration.sync.register("share-sync");
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
```

- [ ] **Step 2: Add to root layout body**

In `src/app/layout.tsx`, import and add the component inside `<body>` after `<Providers>`:

Add the import:
```typescript
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
```

Update the body:
```tsx
<body className="min-h-full flex flex-col">
  <Providers>{children}</Providers>
  <ServiceWorkerRegistration />
</body>
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ServiceWorkerRegistration.tsx src/app/layout.tsx
git commit -m "feat: add service worker registration with online sync"
```

---

## Task 6: Share Target API Route

**Files:**
- Create: `src/app/api/share/route.ts`

- [ ] **Step 1: Create the share handler**

Create `src/app/api/share/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUrlMetadata } from "@/lib/metadata";

function extractUrl(title?: string, text?: string, url?: string): string | null {
  // Check the url param first
  if (url && isValidUrl(url)) return url;

  // Parse URLs from text
  if (text) {
    const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i);
    if (urlMatch) return urlMatch[0];
  }

  // Check if title is a URL
  if (title && isValidUrl(title)) return title;

  return null;
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // Parse form-urlencoded body (share target sends this format)
  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let text = "";
  let url = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    title = (formData.get("title") as string) || "";
    text = (formData.get("text") as string) || "";
    url = (formData.get("url") as string) || "";
  } else {
    // JSON fallback (for manual replay from SW)
    try {
      const body = await req.json();
      title = body.title || "";
      text = body.text || "";
      url = body.url || "";
    } catch {
      // Try URL search params
      title = req.nextUrl.searchParams.get("title") || "";
      text = req.nextUrl.searchParams.get("text") || "";
      url = req.nextUrl.searchParams.get("url") || "";
    }
  }

  // Not authenticated — redirect to login
  if (!session?.user?.id) {
    const params = new URLSearchParams({ title, text, url });
    return NextResponse.redirect(
      new URL(`/login?returnUrl=/api/share?${params.toString()}`, req.url),
      303
    );
  }

  // Extract URL from shared data
  const extractedUrl = extractUrl(title, text, url);

  if (!extractedUrl) {
    return NextResponse.redirect(
      new URL("/dashboard?shared=error&reason=no-url", req.url),
      303
    );
  }

  // Get user's first workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.redirect(
      new URL("/dashboard?shared=error&reason=no-workspace", req.url),
      303
    );
  }

  // Fetch metadata
  let metadata = { title: "", description: "", thumbnail: "", siteName: "", favicon: "" };
  try {
    metadata = await fetchUrlMetadata(extractedUrl);
  } catch {
    // Continue without metadata
  }

  // Create todo with URL
  const todoTitle = metadata.title || title || extractedUrl;
  const todoDescription = metadata.description || (text !== extractedUrl ? text : "") || "";

  await prisma.todoItem.create({
    data: {
      title: todoTitle.slice(0, 200),
      description: todoDescription.slice(0, 500) || undefined,
      priority: "medium",
      url: extractedUrl,
      thumbnail: metadata.thumbnail || undefined,
      siteName: metadata.siteName || undefined,
      favicon: metadata.favicon || undefined,
      workspaceId: membership.workspaceId,
    },
  });

  return NextResponse.redirect(new URL("/dashboard?shared=true", req.url), 303);
}

// Also handle GET for share target fallback (some browsers use GET)
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") || "";
  const text = req.nextUrl.searchParams.get("text") || "";
  const url = req.nextUrl.searchParams.get("url") || "";

  // Redirect to POST handler by constructing a new request
  const params = new URLSearchParams({ title, text, url });
  return NextResponse.redirect(
    new URL(`/dashboard?share_pending=true&${params.toString()}`, req.url),
    303
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/share/
git commit -m "feat: add share target API route with URL extraction and metadata fetch"
```

---

## Task 7: ShareToast Component

**Files:**
- Create: `src/components/ShareToast.tsx`

- [ ] **Step 1: Create the toast component**

Create `src/components/ShareToast.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, AlertCircle, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "queued" | "error">("success");

  useEffect(() => {
    const shared = searchParams.get("shared");
    if (!shared) return;

    if (shared === "true") {
      setMessage("Link saved!");
      setVariant("success");
    } else if (shared === "queued") {
      setMessage("Link queued — will save when online");
      setVariant("queued");
    } else if (shared === "error") {
      const reason = searchParams.get("reason") || "unknown";
      setMessage(reason === "no-url" ? "No URL found in shared content" : "Failed to save link");
      setVariant("error");
    }

    setVisible(true);

    // Remove query params from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("shared");
    url.searchParams.delete("reason");
    router.replace(url.pathname, { scroll: false });

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  if (!visible) return null;

  const icons = {
    success: <Check className="h-4 w-4" />,
    queued: <Wifi className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    queued: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg", colors[variant])}>
        {icons[variant]}
        <span className="text-sm font-medium">{message}</span>
        {variant === "success" && (
          <button
            className="ml-2 text-xs font-semibold underline hover:no-underline"
            onClick={() => {
              setVisible(false);
              router.push("/todos");
            }}
          >
            Edit
          </button>
        )}
        <button
          className="ml-2 opacity-60 hover:opacity-100"
          onClick={() => setVisible(false)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ShareToast.tsx
git commit -m "feat: add ShareToast component for share target feedback"
```

---

## Task 8: Add ShareToast to Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add ShareToast to dashboard**

In `src/app/(app)/dashboard/page.tsx`, add the import:

```typescript
import { Suspense } from "react";
import { ShareToast } from "@/components/ShareToast";
```

Add `<Suspense fallback={null}><ShareToast /></Suspense>` at the top of the returned JSX, before `<DashboardHero />`:

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <ShareToast />
      </Suspense>
      <DashboardHero />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingTodos />
        <RecentLinks />
        <RecentBoards />
      </div>
    </div>
  );
}
```

Note: `Suspense` wrapping is required because `ShareToast` uses `useSearchParams()` which needs a Suspense boundary in Next.js App Router.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: add ShareToast to dashboard for share target feedback"
```

---

## Task 9: Final Verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean

- [ ] **Step 2: Build**

Run: `npx next build`
Expected: Succeeds, `/api/share` route appears

- [ ] **Step 3: Manual testing**

1. Start dev server: `npm run dev`
2. Open http://localhost:3000 — check manifest loads (DevTools > Application > Manifest)
3. Check service worker registers (DevTools > Application > Service Workers)
4. Test share API manually:
   ```bash
   curl -X POST http://localhost:3000/api/share \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "title=Test&text=Check+this+out+https://github.com&url=" \
     -v 2>&1 | grep "Location:"
   ```
   Expected: Redirects to `/dashboard?shared=true`
5. Check dashboard shows "Link saved!" toast
6. Verify a new todo was created with the GitHub URL + metadata

- [ ] **Step 4: Test installability**

On Chrome, visit the app and check if the install icon appears in the address bar. On mobile, use "Add to Home Screen".

- [ ] **Step 5: Commit any fixes**
