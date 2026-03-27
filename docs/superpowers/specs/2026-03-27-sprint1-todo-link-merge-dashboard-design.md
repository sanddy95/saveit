# Sprint 1: Todo/Link Merge + Dashboard UI Overhaul — Design Spec

## Overview

Two interconnected improvements to SaveIt:
1. **Unify todos and links** — Todos become the universal item. Pasting a URL in a todo title auto-fetches metadata and attaches it. The AddCardDialog on boards gets the same smart behavior.
2. **Dashboard UI overhaul** — Editorial/modern aesthetic with a hero section, progress stats, quick actions, and visually varied widgets.

## Decisions

- **Data model:** Add `url`, `thumbnail`, `siteName`, `favicon` fields directly to `TodoItem`. No changes to `SavedLink`.
- **URL detection:** Auto-detect on paste/blur in title field. Fetch metadata, replace title with page title, fill description, show link preview.
- **AddCardDialog:** Two-step form — compact by default (title + priority + URL detect), expandable for full fields.
- **Dashboard aesthetic:** Editorial & modern — large typography, asymmetric hero, varied widget styles, gradient mesh background, micro-animations, custom font pairing.
- **Stats in hero:** Time-aware greeting, completion ring, due-today count, overdue count, quick-action buttons.
- **Widget styles:** Varied — checklist for todos, rich media for links, mini kanban preview for boards.

---

## 1. Data Model Changes

Add 4 nullable fields to `TodoItem` in `prisma/schema.prisma`:

```prisma
model TodoItem {
  // ... existing fields ...
  url         String?
  thumbnail   String?
  siteName    String?
  favicon     String?
}
```

Migration: `prisma migrate dev --name add-todo-url-metadata`

No changes to `SavedLink`, `KanbanCard`, or any other model.

## 2. Zod Schema Updates

Update `todoSchema` in `src/lib/validators.ts` to accept optional URL + metadata:

```typescript
export const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  thumbnail: z.string().optional(),
  siteName: z.string().optional(),
  favicon: z.string().optional(),
});
```

## 3. API Route Updates

### `POST /api/workspaces/[workspaceId]/todos`
- Accept new fields: `url`, `thumbnail`, `siteName`, `favicon`
- Store them on the `TodoItem`

### `PATCH /api/workspaces/[workspaceId]/todos/[todoId]`
- Accept updates to `url`, `thumbnail`, `siteName`, `favicon`
- Allow clearing URL by passing `url: null`

### `GET` routes
- No changes — the new fields are returned automatically by Prisma

### Dashboard API
- `GET /api/dashboard/todos` — include `url`, `favicon`, `siteName` in response (already included since Prisma returns all fields)

## 4. TodoForm Enhancement

### URL Auto-Detection

In `src/components/todos/TodoForm.tsx`:

- On title field `paste` or `blur` event, check if the value matches a URL pattern
- URL pattern: starts with `http://` or `https://`, or matches common domain patterns
- If URL detected:
  1. Show a small loading spinner next to the title
  2. Call `POST /api/metadata` with the URL
  3. Set title to fetched page title (user can override)
  4. Set description to fetched description
  5. Store original URL in a hidden `url` field
  6. Show a **link preview card** below the title field:
     - Thumbnail image (if available)
     - Favicon + site name
     - The URL (truncated)
     - An "x" button to detach the link
  7. Store metadata (`thumbnail`, `siteName`, `favicon`) in hidden fields

- If user manually edits the title after auto-fill, no re-fetch
- Clicking "x" on the link preview clears `url`, `thumbnail`, `siteName`, `favicon` from the form

### Link Preview Component

New component `src/components/todos/LinkPreview.tsx`:
- Shows when a todo has a URL attached
- Displays: thumbnail (or placeholder), favicon, site name, truncated URL
- "x" button to detach
- Reused in TodoForm (edit mode) and TodoItem (display mode)

## 5. TodoItem Display Enhancement

In `src/components/todos/TodoItem.tsx`:

- If the todo has a `url`:
  - Show a small link indicator below the title: favicon + site name + external link icon
  - Clicking it opens the URL in a new tab
  - Subtle visual distinction (slightly different background or a link icon badge)

## 6. AddCardDialog Enhancement

In `src/components/boards/AddCardDialog.tsx`:

### "New Todo" Tab Redesign

**Default compact view:**
- Title field (with URL auto-detect — same logic as TodoForm)
- Priority selector (3 buttons: Low/Medium/High)
- Link preview card (appears when URL detected)

**Expanded view (via "More options" button):**
- Description textarea
- Due date picker
- Reminder time picker

The "More options" button toggles between compact and expanded. State resets when dialog closes.

### "New Link" Tab

Stays for now but internally creates a `TodoItem` with the URL. The UI stays the same (URL field, optional title), but the API call goes to the todos endpoint instead of links. This way new links from the board are unified as todos-with-URLs.

### Updated `addCardSchema`

The `new-todo` variant in the discriminated union gets the new fields:

```typescript
z.object({
  mode: z.literal("new-todo"),
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
  url: z.string().url().optional(),
  thumbnail: z.string().optional(),
  siteName: z.string().optional(),
  favicon: z.string().optional(),
}),
```

The `new-link` variant now creates a todo with URL internally (API-side change in the cards route).

## 7. KanbanCard Enhancement

In `src/components/boards/KanbanCard.tsx`:

- `TodoCardContent`: If the todo has a `url`, show a richer card:
  - Favicon + site name below the title
  - "Open" link button (same as current LinkCardContent)
  - Still show priority badge and due date
- This makes todos-with-URLs visually rich on the board without needing separate link cards

## 8. Dashboard UI Overhaul

### Typography

Add custom Google Fonts via `next/font/google` in the root layout or dashboard layout:
- **Display font:** `Space Grotesk` — geometric, modern, distinctive
- **Body font:** `Inter` for body text (already familiar, pairs well)

Apply display font to headings on the dashboard, body font stays default elsewhere.

### Hero Section

New component `src/components/dashboard/DashboardHero.tsx`:

**Layout:** Full-width section with gradient mesh background. Asymmetric — text left, stats right.

**Left side:**
- Time-aware greeting: "Good morning/afternoon/evening, {name}"
- Subtitle: today's date formatted nicely ("Thursday, March 27")
- 3 quick-action buttons in a row: "New Todo", "New Link", "New Board" — pill-shaped, subtle hover animations

**Right side:**
- Completion ring (circular progress): % of today's todos completed
- Two stat cards side by side:
  - "Due Today" count with calendar icon
  - "Overdue" count with alert icon (red accent if > 0)

**Background:** Subtle gradient mesh using the workspace accent color (from context) blended with the card background. Not overwhelming — just enough to give atmosphere.

### New Dashboard API: `/api/dashboard/stats`

Returns:
```json
{
  "totalTodosToday": 8,
  "completedToday": 3,
  "dueToday": 5,
  "overdue": 2
}
```

Query logic:
- `totalTodosToday`: todos created today or with dueDate today
- `completedToday`: todos completed today (completed = true, updatedAt is today)
- `dueToday`: todos with dueDate = today and not completed
- `overdue`: todos with dueDate < today and not completed

### Widget Section Redesign

**Layout:** 3-column grid on desktop, stacks on mobile. Each widget has a distinct visual treatment.

#### Upcoming Todos Widget

Component: `src/components/dashboard/UpcomingTodos.tsx` (modify existing)

- Mini progress bar at the top of the card (completed/total ratio, colored gradient)
- Each todo item has a priority color strip on the left edge (4px wide, rounded)
- Due dates in relative time ("in 2 hours", "tomorrow")
- Todos with URLs show a small favicon inline next to the title
- Completion checkbox inline (functional — toggles completion)
- Subtle staggered fade-in animation on load

#### Recent Links Widget

Component: `src/components/dashboard/RecentLinks.tsx` (modify existing)

- 2-column mini-grid inside the card
- Each link shows: thumbnail (or gradient placeholder), title, favicon + site name
- Hover: slight elevation + scale transform
- Cards have rounded corners, subtle shadow
- "View all" link at bottom

#### Recent Boards Widget

Component: `src/components/dashboard/RecentBoards.tsx` (modify existing)

- Each board shows a mini kanban preview:
  - Board name (bold)
  - Row of colored column dots (using column colors, or default gray)
  - Card count distribution text: "3 / 5 / 2" under the dots
  - "X cards across Y columns" subtitle
- Hover: border color shifts to primary

### Dashboard Page Restructure

`src/app/(app)/dashboard/page.tsx`:

```
<DashboardHero />
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <UpcomingTodos />   // checklist style
  <RecentLinks />     // rich media grid
  <RecentBoards />    // mini kanban previews
</div>
```

### Animations

- Dashboard widgets: staggered fade-in + slide-up on mount (CSS `@keyframes` with `animation-delay`)
- Cards: `transition-transform` + `transition-shadow` on hover
- Completion ring: animated fill on mount (CSS `stroke-dashoffset` transition)
- Quick-action buttons: subtle scale on hover

All animations are CSS-only (no additional dependencies). Use `prefers-reduced-motion` media query to disable for accessibility.

## 9. Edge Cases

- **Empty URL field:** If user clears the title after URL auto-fill, the URL stays attached. User must click "x" on preview to detach.
- **Failed metadata fetch:** Show the URL as the title, leave other metadata fields empty. Don't block form submission.
- **Existing SavedLinks:** Stay as-is. No migration of existing links to todos. They continue to work on boards and in the links page.
- **Dashboard with no data:** Hero stats show all zeros. Completion ring shows 100% (nothing to do). Empty state messages in widgets stay as-is.
- **Dark mode:** All new components must support dark mode. Gradient mesh uses CSS custom properties for theme-aware colors.
