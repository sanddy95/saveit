# PWA + Web Share Target — Design Spec

## Overview

Make SaveIt a Progressive Web App that's installable on mobile/desktop and acts as a share target. When users share a link from any app (LinkedIn, Instagram, YouTube, Chrome, etc.), it auto-saves as a todo with URL + metadata in SaveIt.

## Decisions

- **Share flow:** Auto-create todo with URL + metadata, show toast with "Edit" option (zero friction)
- **Offline:** Static asset caching for fast loads, share queue for offline shares synced when back online
- **Service worker:** Manual lightweight SW (no next-pwa dependency — it's unmaintained for App Router)
- **Install:** Native browser install prompt, no custom banner

---

## 1. Web App Manifest

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
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
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

## 2. Manifest Link in Layout

Add `<link rel="manifest" href="/manifest.json" />` to the root layout's `<head>` via Next.js metadata.

## 3. App Icons

Generate two PNG icons:
- `public/icons/icon-192.png` (192x192)
- `public/icons/icon-512.png` (512x512)

Design: Indigo-to-violet gradient background (#6366f1 → #8b5cf6), white "S" letter centered, rounded corners for maskable support.

## 4. Service Worker

Create `public/sw.js` — a manual, lightweight service worker:

**Install event:**
- Precache the app shell: `/dashboard`, `/login`, key static assets
- Skip waiting for immediate activation

**Activate event:**
- Claim all clients
- Clean up old caches

**Fetch event:**
- Static assets (JS, CSS, fonts, images): Cache-first strategy
- API routes: Network-first, fall back to cache
- Navigation requests: Network-first with offline fallback page
- Share target POST (`/api/share`): If offline, store the share data in the cache/queue and redirect to `/dashboard?shared=queued`

**Background Sync:**
- Register a sync event `share-sync` when a share is queued offline
- On sync: replay queued shares to `/api/share`

## 5. Service Worker Registration

Create `src/components/ServiceWorkerRegistration.tsx`:

- Client component that registers `/sw.js` on mount
- Listens for `online` event to trigger sync of queued shares
- Included in the root layout or app layout

## 6. Share Target API Route

Create `src/app/api/share/route.ts`:

**POST handler:**
1. Parse form-urlencoded body (the share target sends this format)
2. Extract URL: check `url` param first, then parse URLs from `text` param using regex
3. Authenticate via `auth()` — if no session, redirect to `/login?returnUrl=...`
4. Find user's first workspace (default workspace)
5. Fetch metadata via `fetchUrlMetadata(url)`
6. Create `TodoItem` with:
   - `title`: metadata title or shared title or URL
   - `description`: metadata description or shared text
   - `url`: the extracted URL
   - `thumbnail`, `siteName`, `favicon`: from metadata
   - `workspaceId`: user's default workspace
7. Redirect to `/dashboard?shared=true`

**Error handling:**
- No URL found in share: redirect to `/dashboard?shared=error&reason=no-url`
- Metadata fetch fails: still create todo with URL as title
- Auth fails: redirect to login with return URL

## 7. Dashboard Toast for Shared Links

Modify `src/app/(app)/dashboard/page.tsx`:

- Check for `?shared=true` query param on mount
- Show a toast/notification: "Link saved!" with an "Edit" button
- "Edit" navigates to the todos page
- Remove the query param from URL after showing toast (using `router.replace`)
- Handle `?shared=queued`: show "Link queued — will save when online"
- Handle `?shared=error`: show error message

## 8. Toast Component

If no toast component exists, create a simple one or use a lightweight approach:
- Temporary div that slides in from top/bottom
- Auto-dismisses after 4 seconds
- "Edit" action button

## 9. Offline Share Queue

For offline shares, the service worker:
1. Intercepts the POST to `/api/share`
2. Stores the share data in a dedicated cache (`share-queue`)
3. Registers for Background Sync (`share-sync` tag)
4. Redirects to `/dashboard?shared=queued`

On sync event:
1. Read all entries from `share-queue` cache
2. Replay each as a POST to `/api/share`
3. Clear the queue on success

Fallback: If Background Sync is not supported, the ServiceWorkerRegistration component listens for `online` event and manually triggers a replay.

## 10. Edge Cases

- **URL extraction from text:** Apps share URLs differently. LinkedIn might send `text: "Check this out https://example.com"`, Instagram might send `url: "https://..."`. Parse both fields, extract first valid `https?://` URL.
- **No session on share:** Redirect to login, preserve share params in returnUrl so after login the share completes.
- **Duplicate URL:** Create the todo anyway — zero friction, user can delete.
- **Very long shared text:** Truncate description to 500 chars.
- **Multiple URLs in text:** Use the first one.
