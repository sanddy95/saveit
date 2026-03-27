# Kanban Boards — Design Spec

## Overview

Add Kanban boards to SaveIt as a visual organizer for both todos and saved links. Boards live within workspaces and let users arrange content into customizable, styled columns with full drag & drop support.

## Decisions

- **Content types**: Cards reference existing todos or saved links (not standalone)
- **Quick-create**: Users can create new todos/links inline from the board — the item is created first, then added as a card
- **Drag & drop**: Full reordering within and between columns using `@hello-pangea/dnd`
- **Default columns**: New boards start with "To Do", "In Progress", "Done"
- **Column styling**: Columns support optional color (hex) and icon (lucide icon name)
- **Column management**: Rename, add, delete (if empty), reorder via drag & drop

## Data Model Changes

Add `color` and `icon` fields to `KanbanColumn`:

```prisma
model KanbanColumn {
  id       String @id @default(cuid())
  name     String
  position Int
  color    String?   // optional hex color
  icon     String?   // optional lucide icon name
  boardId  String
  board KanbanBoard  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards KanbanCard[]
  @@index([boardId])
}
```

All other models (`KanbanBoard`, `KanbanCard`) remain unchanged. `KanbanCard` already supports `position`, `todoId`, and `savedLinkId`.

## API Routes

### Board CRUD

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/workspaces/[workspaceId]/boards` | List boards in workspace |
| `POST` | `/api/workspaces/[workspaceId]/boards` | Create board (auto-creates 3 default columns) |
| `GET` | `/api/workspaces/[workspaceId]/boards/[boardId]` | Fetch board with columns, cards, and related todo/link data |
| `PATCH` | `/api/workspaces/[workspaceId]/boards/[boardId]` | Rename board |
| `DELETE` | `/api/workspaces/[workspaceId]/boards/[boardId]` | Delete board (cascades to columns and cards) |

### Column Management

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/workspaces/[workspaceId]/boards/[boardId]/columns` | Add column (name, optional color/icon, auto-position at end) |
| `PATCH` | `/api/workspaces/[workspaceId]/boards/[boardId]/columns/[columnId]` | Update name, color, icon, or position |
| `DELETE` | `/api/workspaces/[workspaceId]/boards/[boardId]/columns/[columnId]` | Delete column (must be empty) |

### Card Management

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/workspaces/[workspaceId]/boards/[boardId]/cards` | Add card — reference existing (`{ columnId, todoId/savedLinkId }`) or quick-create (`{ columnId, type, title/url, ... }`) |
| `PATCH` | `/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]` | Move card (update columnId and/or position) |
| `DELETE` | `/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]` | Remove card from board (does NOT delete underlying todo/link) |

### Reorder

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/workspaces/[workspaceId]/boards/[boardId]/reorder` | Batch update positions: `{ columns?: [{id, position}], cards?: [{id, columnId, position}] }` |

All routes require authentication and workspace membership verification.

## UI Components & Pages

### Pages

- **`/workspaces/[workspaceId]/boards`** — Board list. Grid of board cards showing name, column count, card count, last updated. "New Board" button opens a dialog.
- **`/workspaces/[workspaceId]/boards/[boardId]`** — Board view. The main Kanban interface.

### Board View Layout

- Top bar: board name (editable inline), back button, "Add Column" button
- Horizontal scrolling container of columns
- Each column: header (name, color dot, icon, menu), vertically stacked cards, "Add Card" button at bottom

### Components

| Component | Purpose |
|-----------|---------|
| `BoardList` | Grid of board preview cards |
| `BoardForm` | Dialog for creating/renaming boards |
| `KanbanBoard` | Main board container, wraps `DragDropContext` |
| `KanbanColumn` | Single column with droppable area |
| `KanbanColumnHeader` | Column name, color, icon, dropdown menu (rename, change color/icon, delete) |
| `KanbanCard` | Card displaying todo or link preview |
| `AddCardDialog` | Dialog with tabs: "Existing Todo", "Existing Link", "New Todo", "New Link" |
| `ColumnSettingsDialog` | Edit column name, pick color, pick icon |

### Card Display

- **Todo cards**: Title, priority badge, due date (if set), completion checkbox
- **Link cards**: Favicon, title, site name, thumbnail (if available)
- Both types show a subtle type indicator icon in the corner

### Drag & Drop (`@hello-pangea/dnd`)

- `DragDropContext` wraps the board
- Each column is a `Droppable` (type "column" for column reorder, type "card" for cards)
- Each card and column header is a `Draggable`
- On drag end: optimistically reorder in React Query cache, POST to `/reorder`

## State Management

### React Query Hooks

| Hook | Purpose |
|------|---------|
| `useBoards(workspaceId)` | Fetch board list |
| `useBoard(workspaceId, boardId)` | Fetch full board with columns, cards, nested todo/link data |
| `useCreateBoard()` | Create board mutation |
| `useUpdateBoard()` | Rename board mutation |
| `useDeleteBoard()` | Delete board mutation |
| `useBoardMutations()` | Grouped mutations for columns, cards, and reorder |

### Optimistic Updates

- Drag & drop immediately updates the React Query cache with new positions
- `/reorder` POST fires in the background
- On error: roll back to previous cache state and show a toast

### Data Loading

- Board list page: lightweight query with counts
- Board view: single query fetches full board (columns, cards, nested todo/link data) to avoid waterfall requests

### Cache Invalidation

- Creating/deleting cards invalidates the board query
- Quick-creating a todo/link also invalidates the workspace todos/links queries

## Dashboard & Navigation

### Sidebar

The "Boards" nav item redirects to current workspace's boards page, matching the pattern of Todos and Links.

### Dashboard Widget

- "Recent Boards" widget showing up to 3 most recently updated boards
- Displays board name, column count, card count
- New API route: `GET /api/dashboard/boards`

### Mobile

- Board list: responsive grid (works as-is)
- Board view: horizontal scroll for columns (min-width ~280px per column). Column drag-to-reorder disabled on mobile to avoid conflicts with horizontal scroll. Card drag works normally.
- "Add Card" FAB on mobile (consistent with existing Todos/Links FAB pattern)

## Edge Cases & Constraints

### Limits

- Max 10 columns per board
- Max 100 cards per column
- A todo/link can appear only once per board (enforced at API level)

### Column Deletion

- Only allowed when the column has no cards
- API returns an error if deletion is attempted on a non-empty column

### Cascading Behavior

- Deleting a board cascades to columns and cards (not to underlying todos/links)
- Deleting a todo/link from Todos/Links pages removes associated kanban cards (Prisma `onDelete: Cascade`)
- Deleting a card removes it from the board only — underlying item preserved

### Empty States

- No boards: illustration + "Create your first board" CTA
- Board with no cards: each column shows subtle drop zone hint text
- Adding card with no existing items: "Existing" tabs show message prompting to use "New" tabs
