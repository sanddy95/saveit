# Kanban Boards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kanban boards to SaveIt so users can visually organize todos and saved links into drag-and-drop columns within workspaces.

**Architecture:** Boards are workspace-scoped. Each board has ordered columns, each column has ordered cards. Cards reference existing TodoItem or SavedLink records. Drag & drop uses `@hello-pangea/dnd` with optimistic React Query cache updates and a batch `/reorder` endpoint. Quick-create lets users create new todos/links inline from the board.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React Query, `@hello-pangea/dnd`, Zod, shadcn/ui, Tailwind CSS 4, lucide-react

---

## File Structure

### New Files

```
prisma/schema.prisma                                          — MODIFY (add color/icon to KanbanColumn)
src/lib/validators.ts                                         — MODIFY (add board/column/card schemas)
src/hooks/use-boards.ts                                       — CREATE (React Query hooks for boards)
src/app/api/workspaces/[workspaceId]/boards/route.ts          — CREATE (list + create boards)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/route.ts — CREATE (get + patch + delete board)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/route.ts — CREATE (create column)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/[columnId]/route.ts — CREATE (patch + delete column)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/route.ts — CREATE (create card)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/route.ts — CREATE (patch + delete card)
src/app/api/workspaces/[workspaceId]/boards/[boardId]/reorder/route.ts — CREATE (batch reorder)
src/app/api/dashboard/boards/route.ts                         — CREATE (recent boards for dashboard)
src/components/boards/BoardList.tsx                            — CREATE (board grid on list page)
src/components/boards/BoardForm.tsx                            — CREATE (create/rename board dialog)
src/components/boards/KanbanBoard.tsx                          — CREATE (main DnD board container)
src/components/boards/KanbanColumn.tsx                         — CREATE (droppable column)
src/components/boards/KanbanColumnHeader.tsx                   — CREATE (column name, color, icon, menu)
src/components/boards/KanbanCard.tsx                           — CREATE (todo/link card display)
src/components/boards/AddCardDialog.tsx                        — CREATE (add card with tabs)
src/components/boards/ColumnSettingsDialog.tsx                 — CREATE (edit column color/icon/name)
src/components/dashboard/RecentBoards.tsx                      — CREATE (dashboard widget)
src/app/(app)/workspaces/[workspaceId]/boards/page.tsx         — CREATE (board list page)
src/app/(app)/workspaces/[workspaceId]/boards/[boardId]/page.tsx — CREATE (board view page)
```

### Modified Files

```
src/app/(app)/boards/page.tsx                                  — MODIFY (update redirect)
src/app/(app)/dashboard/page.tsx                               — MODIFY (add RecentBoards widget)
src/components/layout/BottomNav.tsx                            — MODIFY (if needed for boards link)
```

---

## Task 1: Schema Migration — Add color and icon to KanbanColumn

**Files:**
- Modify: `prisma/schema.prisma:141-149`

- [ ] **Step 1: Update the KanbanColumn model**

In `prisma/schema.prisma`, replace the KanbanColumn model:

```prisma
model KanbanColumn {
  id       String @id @default(cuid())
  name     String
  position Int
  color    String?
  icon     String?
  boardId  String
  board KanbanBoard  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards KanbanCard[]
  @@index([boardId])
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name add-kanban-column-color-icon`
Expected: Migration applied successfully

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(kanban): add color and icon fields to KanbanColumn"
```

---

## Task 2: Zod Validators for Boards, Columns, and Cards

**Files:**
- Modify: `src/lib/validators.ts`

- [ ] **Step 1: Add board, column, card, and reorder schemas**

Append to `src/lib/validators.ts`:

```typescript
export const boardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type BoardInput = z.infer<typeof boardSchema>;

export const columnSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().max(7).optional(),
  icon: z.string().max(50).optional(),
});

export type ColumnInput = z.infer<typeof columnSchema>;

export const addCardSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    columnId: z.string().min(1),
    todoId: z.string().optional(),
    savedLinkId: z.string().optional(),
  }),
  z.object({
    mode: z.literal("new-todo"),
    columnId: z.string().min(1),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    dueDate: z.string().optional(),
  }),
  z.object({
    mode: z.literal("new-link"),
    columnId: z.string().min(1),
    url: z.string().url("Invalid URL"),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
]);

export type AddCardInput = z.infer<typeof addCardSchema>;

export const reorderSchema = z.object({
  columns: z
    .array(z.object({ id: z.string(), position: z.number().int().min(0) }))
    .optional(),
  cards: z
    .array(
      z.object({
        id: z.string(),
        columnId: z.string(),
        position: z.number().int().min(0),
      })
    )
    .optional(),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors from validators.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat(kanban): add Zod schemas for boards, columns, cards, reorder"
```

---

## Task 3: Board CRUD API Routes

**Files:**
- Create: `src/app/api/workspaces/[workspaceId]/boards/route.ts`
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/route.ts`

- [ ] **Step 1: Create the boards list + create route**

Create `src/app/api/workspaces/[workspaceId]/boards/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const boards = await prisma.kanbanBoard.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { columns: true } },
      columns: {
        include: { _count: { select: { cards: true } } },
      },
    },
  });

  const result = boards.map((b) => ({
    ...b,
    columnCount: b._count.columns,
    cardCount: b.columns.reduce((sum, c) => sum + c._count.cards, 0),
    columns: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = boardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const board = await prisma.kanbanBoard.create({
    data: {
      name: parsed.data.name,
      workspaceId,
      columns: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 },
        ],
      },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
```

- [ ] **Step 2: Create the single board route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string }>;
};

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const board = await prisma.kanbanBoard.findFirst({
    where: { id: boardId, workspaceId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              todo: true,
              savedLink: true,
            },
          },
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = boardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const board = await prisma.kanbanBoard.update({
    where: { id: boardId, workspaceId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(board);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  await prisma.kanbanBoard.delete({
    where: { id: boardId, workspaceId },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/workspaces/\[workspaceId\]/boards/
git commit -m "feat(kanban): add board CRUD API routes"
```

---

## Task 4: Column Management API Routes

**Files:**
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/route.ts`
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/[columnId]/route.ts`

- [ ] **Step 1: Create column creation route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { columnSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const board = await prisma.kanbanBoard.findFirst({
    where: { id: boardId, workspaceId },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  // Check max 10 columns
  const columnCount = await prisma.kanbanColumn.count({
    where: { boardId },
  });
  if (columnCount >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 columns per board" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = columnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const column = await prisma.kanbanColumn.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
      position: columnCount,
      boardId,
    },
  });

  return NextResponse.json(column, { status: 201 });
}
```

- [ ] **Step 2: Create single column route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/columns/[columnId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string; columnId: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, columnId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, board: { id: boardId, workspaceId } },
  });
  if (!column) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, color, icon, position } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (color !== undefined) data.color = color;
  if (icon !== undefined) data.icon = icon;
  if (position !== undefined) data.position = position;

  const updated = await prisma.kanbanColumn.update({
    where: { id: columnId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, columnId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, board: { id: boardId, workspaceId } },
    include: { _count: { select: { cards: true } } },
  });
  if (!column) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (column._count.cards > 0) {
    return NextResponse.json(
      { error: "Cannot delete column with cards. Move or remove cards first." },
      { status: 400 }
    );
  }

  await prisma.kanbanColumn.delete({ where: { id: columnId } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/workspaces/\[workspaceId\]/boards/\[boardId\]/columns/
git commit -m "feat(kanban): add column management API routes"
```

---

## Task 5: Card Management and Reorder API Routes

**Files:**
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/route.ts`
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/route.ts`
- Create: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/reorder/route.ts`

- [ ] **Step 1: Create card creation route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCardSchema } from "@/lib/validators";
import { fetchMetadata } from "@/lib/metadata";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const board = await prisma.kanbanBoard.findFirst({
    where: { id: boardId, workspaceId },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = addCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify column belongs to this board
  const column = await prisma.kanbanColumn.findFirst({
    where: { id: data.columnId, boardId },
  });
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  // Check max 100 cards per column
  const cardCount = await prisma.kanbanCard.count({
    where: { columnId: data.columnId },
  });
  if (cardCount >= 100) {
    return NextResponse.json(
      { error: "Maximum 100 cards per column" },
      { status: 400 }
    );
  }

  let todoId: string | undefined;
  let savedLinkId: string | undefined;

  if (data.mode === "existing") {
    todoId = data.todoId;
    savedLinkId = data.savedLinkId;

    if (!todoId && !savedLinkId) {
      return NextResponse.json(
        { error: "Must provide todoId or savedLinkId" },
        { status: 400 }
      );
    }

    // Check duplicate on this board
    const existingCard = await prisma.kanbanCard.findFirst({
      where: {
        column: { boardId },
        ...(todoId ? { todoId } : { savedLinkId }),
      },
    });
    if (existingCard) {
      return NextResponse.json(
        { error: "This item is already on the board" },
        { status: 400 }
      );
    }
  } else if (data.mode === "new-todo") {
    const todo = await prisma.todoItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        workspaceId,
      },
    });
    todoId = todo.id;
  } else if (data.mode === "new-link") {
    let metadata = { title: "", description: "", thumbnail: "", siteName: "", favicon: "" };
    try {
      metadata = await fetchMetadata(data.url);
    } catch {
      // Continue without metadata
    }

    const link = await prisma.savedLink.create({
      data: {
        url: data.url,
        title: data.title || metadata.title || null,
        description: data.description || metadata.description || null,
        thumbnail: metadata.thumbnail || null,
        siteName: metadata.siteName || null,
        favicon: metadata.favicon || null,
        workspaceId,
      },
    });
    savedLinkId = link.id;
  }

  const card = await prisma.kanbanCard.create({
    data: {
      position: cardCount,
      columnId: data.columnId,
      todoId,
      savedLinkId,
    },
    include: {
      todo: true,
      savedLink: true,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
```

- [ ] **Step 2: Create single card route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string; cardId: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, cardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId, column: { board: { id: boardId, workspaceId } } },
  });
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { columnId, position } = body;

  const data: Record<string, unknown> = {};
  if (columnId !== undefined) data.columnId = columnId;
  if (position !== undefined) data.position = position;

  const updated = await prisma.kanbanCard.update({
    where: { id: cardId },
    data,
    include: { todo: true, savedLink: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, cardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId, column: { board: { id: boardId, workspaceId } } },
  });
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.kanbanCard.delete({ where: { id: cardId } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create reorder route**

Create `src/app/api/workspaces/[workspaceId]/boards/[boardId]/reorder/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reorderSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const board = await prisma.kanbanBoard.findFirst({
    where: { id: boardId, workspaceId },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { columns, cards } = parsed.data;

  const operations: Promise<unknown>[] = [];

  if (columns) {
    for (const col of columns) {
      operations.push(
        prisma.kanbanColumn.update({
          where: { id: col.id },
          data: { position: col.position },
        })
      );
    }
  }

  if (cards) {
    for (const card of cards) {
      operations.push(
        prisma.kanbanCard.update({
          where: { id: card.id },
          data: { columnId: card.columnId, position: card.position },
        })
      );
    }
  }

  await Promise.all(operations);

  // Touch board updatedAt
  await prisma.kanbanBoard.update({
    where: { id: boardId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/workspaces/\[workspaceId\]/boards/\[boardId\]/cards/ src/app/api/workspaces/\[workspaceId\]/boards/\[boardId\]/reorder/
git commit -m "feat(kanban): add card management and reorder API routes"
```

---

## Task 6: Dashboard Boards API Route

**Files:**
- Create: `src/app/api/dashboard/boards/route.ts`

- [ ] **Step 1: Create dashboard boards route**

Create `src/app/api/dashboard/boards/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  const workspaceIds = memberships.map((m) => m.workspaceId);

  const boards = await prisma.kanbanBoard.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: {
      workspace: { select: { id: true, name: true, color: true } },
      _count: { select: { columns: true } },
      columns: {
        include: { _count: { select: { cards: true } } },
      },
    },
  });

  const result = boards.map((b) => ({
    id: b.id,
    name: b.name,
    workspaceId: b.workspaceId,
    updatedAt: b.updatedAt,
    workspace: b.workspace,
    columnCount: b._count.columns,
    cardCount: b.columns.reduce((sum, c) => sum + c._count.cards, 0),
  }));

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/dashboard/boards/
git commit -m "feat(kanban): add dashboard boards API route"
```

---

## Task 7: React Query Hooks for Boards

**Files:**
- Create: `src/hooks/use-boards.ts`

- [ ] **Step 1: Create the boards hooks file**

Create `src/hooks/use-boards.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BoardInput,
  ColumnInput,
  AddCardInput,
  ReorderInput,
} from "@/lib/validators";

// Types

export interface BoardSummary {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columnCount: number;
  cardCount: number;
}

export interface KanbanCardData {
  id: string;
  position: number;
  columnId: string;
  todoId: string | null;
  savedLinkId: string | null;
  createdAt: string;
  updatedAt: string;
  todo: {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    priority: string;
    dueDate: string | null;
  } | null;
  savedLink: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    siteName: string | null;
    favicon: string | null;
  } | null;
}

export interface KanbanColumnData {
  id: string;
  name: string;
  position: number;
  color: string | null;
  icon: string | null;
  boardId: string;
  cards: KanbanCardData[];
}

export interface BoardDetail {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumnData[];
}

export interface DashboardBoard {
  id: string;
  name: string;
  workspaceId: string;
  updatedAt: string;
  workspace: { id: string; name: string; color: string | null };
  columnCount: number;
  cardCount: number;
}

// Fetch helper (same pattern as use-todos.ts)

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

// Board hooks

export function useBoards(workspaceId: string | null) {
  return useQuery<BoardSummary[]>({
    queryKey: ["boards", workspaceId],
    queryFn: () =>
      fetchJson(`/api/workspaces/${workspaceId}/boards`),
    enabled: !!workspaceId,
  });
}

export function useBoard(workspaceId: string | null, boardId: string | null) {
  return useQuery<BoardDetail>({
    queryKey: ["board", workspaceId, boardId],
    queryFn: () =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`),
    enabled: !!workspaceId && !!boardId,
  });
}

export function useCreateBoard(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BoardInput) =>
      fetchJson<BoardDetail>(`/api/workspaces/${workspaceId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBoard(workspaceId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BoardInput) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteBoard(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDashboardBoards() {
  return useQuery<DashboardBoard[]>({
    queryKey: ["dashboard", "recent-boards"],
    queryFn: () => fetchJson("/api/dashboard/boards"),
  });
}

// Board mutations (columns, cards, reorder)

export function useBoardMutations(workspaceId: string, boardId: string) {
  const qc = useQueryClient();
  const boardKey = ["board", workspaceId, boardId];

  const createColumn = useMutation({
    mutationFn: (data: ColumnInput) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const updateColumn = useMutation({
    mutationFn: ({
      columnId,
      ...data
    }: Partial<ColumnInput> & { columnId: string; position?: number }) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const addCard = useMutation({
    mutationFn: (data: AddCardInput) =>
      fetchJson<KanbanCardData>(
        `/api/workspaces/${workspaceId}/boards/${boardId}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
      qc.invalidateQueries({ queryKey: ["todos", workspaceId] });
      qc.invalidateQueries({ queryKey: ["links", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const reorder = useMutation({
    mutationFn: (data: ReorderInput) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    // No invalidation needed — optimistic update handles UI
  });

  return {
    createColumn,
    updateColumn,
    deleteColumn,
    addCard,
    deleteCard,
    reorder,
  };
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-boards.ts
git commit -m "feat(kanban): add React Query hooks for boards"
```

---

## Task 8: Install @hello-pangea/dnd

**Files:** None (dependency only)

- [ ] **Step 1: Install the package**

Run: `npm install @hello-pangea/dnd`
Expected: Package added to package.json

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @hello-pangea/dnd for kanban drag and drop"
```

---

## Task 9: Board List Page and Components

**Files:**
- Create: `src/components/boards/BoardList.tsx`
- Create: `src/components/boards/BoardForm.tsx`
- Create: `src/app/(app)/workspaces/[workspaceId]/boards/page.tsx`
- Modify: `src/app/(app)/boards/page.tsx`

- [ ] **Step 1: Create BoardForm dialog**

Create `src/components/boards/BoardForm.tsx`:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boardSchema, type BoardInput } from "@/lib/validators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BoardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board?: { id: string; name: string } | null;
  onSubmit: (data: BoardInput) => void;
  isLoading?: boolean;
}

export function BoardForm({
  open,
  onOpenChange,
  board,
  onSubmit,
  isLoading,
}: BoardFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardInput>({
    resolver: zodResolver(boardSchema) as never,
    values: board ? { name: board.name } : { name: "" },
  });

  const handleFormSubmit = (data: BoardInput) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {board ? "Rename Board" : "Create Board"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              placeholder="e.g., Project Alpha"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : board ? "Rename" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create BoardList component**

Create `src/components/boards/BoardList.tsx`:

```typescript
"use client";

import { LayoutGrid, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BoardSummary } from "@/hooks/use-boards";

interface BoardListProps {
  boards: BoardSummary[];
  isLoading: boolean;
  onOpen: (board: BoardSummary) => void;
  onEdit: (board: BoardSummary) => void;
  onDelete: (id: string) => void;
}

export function BoardList({
  boards,
  isLoading,
  onOpen,
  onEdit,
  onDelete,
}: BoardListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No boards yet</p>
        <p className="text-sm">Create your first board to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <div
          key={board.id}
          className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer"
          onClick={() => onOpen(board)}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(board);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(board.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg leading-tight pr-8">
              {board.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{board.columnCount} columns</span>
              <span>{board.cardCount} cards</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated{" "}
              {formatDistanceToNow(new Date(board.updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create board list page**

Create `src/app/(app)/workspaces/[workspaceId]/boards/page.tsx`:

```typescript
"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardList } from "@/components/boards/BoardList";
import { BoardForm } from "@/components/boards/BoardForm";
import {
  useBoards,
  useCreateBoard,
  useDeleteBoard,
  type BoardSummary,
} from "@/hooks/use-boards";
import type { BoardInput } from "@/lib/validators";

export default function WorkspaceBoardsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardSummary | null>(null);

  const { data: boards, isLoading } = useBoards(workspaceId);
  const createBoard = useCreateBoard(workspaceId);
  const deleteBoard = useDeleteBoard(workspaceId);

  const handleCreate = (data: BoardInput) => {
    createBoard.mutate(data);
  };

  const handleOpen = (board: BoardSummary) => {
    router.push(`/workspaces/${workspaceId}/boards/${board.id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this board and all its columns and cards?")) {
      deleteBoard.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Boards</h1>
        <Button
          onClick={() => {
            setEditingBoard(null);
            setFormOpen(true);
          }}
          className="hidden gap-2 sm:flex"
        >
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      <BoardList
        boards={boards || []}
        isLoading={isLoading}
        onOpen={handleOpen}
        onEdit={(board) => {
          setEditingBoard(board);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <Button
        onClick={() => {
          setEditingBoard(null);
          setFormOpen(true);
        }}
        size="icon"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <BoardForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBoard(null);
        }}
        board={editingBoard}
        onSubmit={handleCreate}
        isLoading={createBoard.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update the boards redirect page**

Read and update `src/app/(app)/boards/page.tsx` to match the existing pattern used by `/todos` and `/links` redirect pages (redirect to current workspace boards).

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/boards/BoardForm.tsx src/components/boards/BoardList.tsx src/app/\(app\)/workspaces/\[workspaceId\]/boards/page.tsx src/app/\(app\)/boards/page.tsx
git commit -m "feat(kanban): add board list page and components"
```

---

## Task 10: KanbanCard Component

**Files:**
- Create: `src/components/boards/KanbanCard.tsx`

- [ ] **Step 1: Create the KanbanCard component**

Create `src/components/boards/KanbanCard.tsx`:

```typescript
"use client";

import { Draggable } from "@hello-pangea/dnd";
import {
  CheckSquare,
  Link2,
  MoreVertical,
  Trash2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { isPast } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanCardData } from "@/hooks/use-boards";

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  medium: {
    label: "Med",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  high: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
};

interface KanbanCardProps {
  card: KanbanCardData;
  index: number;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({ card, index, onDelete }: KanbanCardProps) {
  const isTodo = !!card.todo;
  const isLink = !!card.savedLink;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group rounded-md border bg-card p-3 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-lg rotate-2"
          )}
        >
          {/* Card actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isTodo && card.todo && (
                <TodoCardContent todo={card.todo} />
              )}
              {isLink && card.savedLink && (
                <LinkCardContent link={card.savedLink} />
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center h-6 w-6 rounded hover:bg-accent">
                <MoreVertical className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(card.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Type indicator */}
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {isTodo ? (
              <CheckSquare className="h-3 w-3" />
            ) : (
              <Link2 className="h-3 w-3" />
            )}
            <span>{isTodo ? "Todo" : "Link"}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function TodoCardContent({
  todo,
}: {
  todo: NonNullable<KanbanCardData["todo"]>;
}) {
  const priority = priorityConfig[todo.priority] || priorityConfig.medium;
  const isOverdue =
    todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate));

  return (
    <div className="space-y-1.5">
      <p
        className={cn(
          "text-sm font-medium leading-tight",
          todo.completed && "line-through opacity-60"
        )}
      >
        {todo.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
            priority.className
          )}
        >
          {priority.label}
        </span>
        {todo.dueDate && (
          <span
            className={cn(
              "text-[10px]",
              isOverdue
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

function LinkCardContent({
  link,
}: {
  link: NonNullable<KanbanCardData["savedLink"]>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        {link.favicon ? (
          <img
            src={link.favicon}
            alt=""
            className="h-4 w-4 mt-0.5 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {link.title || link.url}
        </p>
      </div>
      {link.siteName && (
        <p className="text-[10px] text-muted-foreground truncate">
          {link.siteName}
        </p>
      )}
      <button
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          window.open(link.url, "_blank", "noopener,noreferrer");
        }}
      >
        <ExternalLink className="h-3 w-3" />
        Open
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/boards/KanbanCard.tsx
git commit -m "feat(kanban): add KanbanCard component with todo and link display"
```

---

## Task 11: KanbanColumnHeader and ColumnSettingsDialog

**Files:**
- Create: `src/components/boards/KanbanColumnHeader.tsx`
- Create: `src/components/boards/ColumnSettingsDialog.tsx`

- [ ] **Step 1: Create ColumnSettingsDialog**

Create `src/components/boards/ColumnSettingsDialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLUMN_COLORS = [
  null,
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const COLUMN_ICONS = [
  null,
  "circle",
  "star",
  "flag",
  "zap",
  "target",
  "clock",
  "check-circle",
  "alert-circle",
];

interface ColumnSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: { id: string; name: string; color: string | null; icon: string | null };
  onSave: (data: { name: string; color: string | null; icon: string | null }) => void;
  isLoading?: boolean;
}

export function ColumnSettingsDialog({
  open,
  onOpenChange,
  column,
  onSave,
  isLoading,
}: ColumnSettingsDialogProps) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState<string | null>(column.color);
  const [icon, setIcon] = useState<string | null>(column.icon);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Column name"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c ?? "none"}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c ?? "transparent",
                    ...(c === null
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)",
                          backgroundSize: "8px 8px",
                        }
                      : {}),
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_ICONS.map((ic) => (
                <button
                  key={ic ?? "none"}
                  type="button"
                  className={`h-8 w-8 rounded-md border text-xs flex items-center justify-center transition-colors ${
                    icon === ic
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setIcon(ic)}
                >
                  {ic ? ic.slice(0, 2) : "—"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create KanbanColumnHeader**

Create `src/components/boards/KanbanColumnHeader.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnSettingsDialog } from "./ColumnSettingsDialog";
import type { KanbanColumnData } from "@/hooks/use-boards";

interface KanbanColumnHeaderProps {
  column: KanbanColumnData;
  onUpdate: (data: {
    columnId: string;
    name?: string;
    color?: string | null;
    icon?: string | null;
  }) => void;
  onDelete: (columnId: string) => void;
  isUpdateLoading?: boolean;
}

export function KanbanColumnHeader({
  column,
  onUpdate,
  onDelete,
  isUpdateLoading,
}: KanbanColumnHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== column.name) {
      onUpdate({ columnId: column.id, name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          {column.color && (
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          {isEditing ? (
            <input
              className="text-sm font-semibold bg-transparent border-b border-primary outline-none w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(column.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold truncate">{column.name}</h3>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {column.cards.length}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded hover:bg-accent">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(column.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ColumnSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        column={column}
        onSave={(data) =>
          onUpdate({
            columnId: column.id,
            name: data.name,
            color: data.color,
            icon: data.icon,
          })
        }
        isLoading={isUpdateLoading}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/boards/KanbanColumnHeader.tsx src/components/boards/ColumnSettingsDialog.tsx
git commit -m "feat(kanban): add column header and settings dialog"
```

---

## Task 12: AddCardDialog Component

**Files:**
- Create: `src/components/boards/AddCardDialog.tsx`

- [ ] **Step 1: Create AddCardDialog**

Create `src/components/boards/AddCardDialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckSquare, Link2 } from "lucide-react";
import { useTodos, type Todo } from "@/hooks/use-todos";
import { useLinks, type SavedLink } from "@/hooks/use-links";
import type { AddCardInput } from "@/lib/validators";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  workspaceId: string;
  onSubmit: (data: AddCardInput) => void;
  isLoading?: boolean;
}

export function AddCardDialog({
  open,
  onOpenChange,
  columnId,
  workspaceId,
  onSubmit,
  isLoading,
}: AddCardDialogProps) {
  const [tab, setTab] = useState("existing-todo");

  // Existing items
  const { data: todos } = useTodos(workspaceId, { status: "active" });
  const { data: links } = useLinks(workspaceId);

  // New todo fields
  const [todoTitle, setTodoTitle] = useState("");
  const [todoPriority, setTodoPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );

  // New link fields
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const handleSubmit = () => {
    if (tab === "existing-todo") return; // handled by item click
    if (tab === "existing-link") return; // handled by item click

    if (tab === "new-todo") {
      if (!todoTitle.trim()) return;
      onSubmit({
        mode: "new-todo",
        columnId,
        title: todoTitle.trim(),
        priority: todoPriority,
      });
      setTodoTitle("");
      setTodoPriority("medium");
    } else if (tab === "new-link") {
      if (!linkUrl.trim()) return;
      onSubmit({
        mode: "new-link",
        columnId,
        url: linkUrl.trim(),
        title: linkTitle.trim() || undefined,
      });
      setLinkUrl("");
      setLinkTitle("");
    }

    onOpenChange(false);
  };

  const handleAddExisting = (todoId?: string, savedLinkId?: string) => {
    onSubmit({
      mode: "existing",
      columnId,
      todoId,
      savedLinkId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="existing-todo" className="text-xs">
              Existing Todo
            </TabsTrigger>
            <TabsTrigger value="existing-link" className="text-xs">
              Existing Link
            </TabsTrigger>
            <TabsTrigger value="new-todo" className="text-xs">
              New Todo
            </TabsTrigger>
            <TabsTrigger value="new-link" className="text-xs">
              New Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing-todo" className="mt-4">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(todos || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active todos. Try the &quot;New Todo&quot; tab.
                </p>
              ) : (
                (todos || []).map((todo: Todo) => (
                  <button
                    key={todo.id}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => handleAddExisting(todo.id, undefined)}
                    disabled={isLoading}
                  >
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{todo.title}</span>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="existing-link" className="mt-4">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(links || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved links. Try the &quot;New Link&quot; tab.
                </p>
              ) : (
                (links || []).map((link: SavedLink) => (
                  <button
                    key={link.id}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => handleAddExisting(undefined, link.id)}
                    disabled={isLoading}
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {link.title || link.url}
                    </span>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new-todo" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="todo-title">Title</Label>
              <Input
                id="todo-title"
                value={todoTitle}
                onChange={(e) => setTodoTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={todoPriority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTodoPriority(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new-link" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-title">Title (optional)</Label>
              <Input
                id="link-title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Custom title"
              />
            </div>
          </TabsContent>
        </Tabs>

        {(tab === "new-todo" || tab === "new-link") && (
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Card"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/boards/AddCardDialog.tsx
git commit -m "feat(kanban): add AddCardDialog with tabs for existing/new todos and links"
```

---

## Task 13: KanbanColumn Component

**Files:**
- Create: `src/components/boards/KanbanColumn.tsx`

- [ ] **Step 1: Create KanbanColumn**

Create `src/components/boards/KanbanColumn.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KanbanColumnHeader } from "./KanbanColumnHeader";
import { KanbanCard } from "./KanbanCard";
import { AddCardDialog } from "./AddCardDialog";
import type { KanbanColumnData } from "@/hooks/use-boards";
import type { AddCardInput } from "@/lib/validators";

interface KanbanColumnProps {
  column: KanbanColumnData;
  index: number;
  workspaceId: string;
  onUpdateColumn: (data: {
    columnId: string;
    name?: string;
    color?: string | null;
    icon?: string | null;
  }) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (data: AddCardInput) => void;
  onDeleteCard: (cardId: string) => void;
  isUpdateLoading?: boolean;
  isAddCardLoading?: boolean;
}

export function KanbanColumn({
  column,
  index,
  workspaceId,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onDeleteCard,
  isUpdateLoading,
  isAddCardLoading,
}: KanbanColumnProps) {
  const [addCardOpen, setAddCardOpen] = useState(false);

  const handleDeleteColumn = () => {
    if (column.cards.length > 0) {
      alert("Cannot delete column with cards. Move or remove cards first.");
      return;
    }
    if (confirm(`Delete column "${column.name}"?`)) {
      onDeleteColumn(column.id);
    }
  };

  return (
    <Draggable draggableId={`column-${column.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72"
        >
          <div
            className="flex flex-col rounded-lg bg-muted/50 border"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            {/* Column header (drag handle for column) */}
            <div {...provided.dragHandleProps} className="p-3 pb-0">
              <KanbanColumnHeader
                column={column}
                onUpdate={onUpdateColumn}
                onDelete={handleDeleteColumn}
                isUpdateLoading={isUpdateLoading}
              />
            </div>

            {/* Card drop zone */}
            <Droppable droppableId={column.id} type="card">
              {(dropProvided, dropSnapshot) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto px-3 py-1 space-y-2 min-h-[60px]",
                    dropSnapshot.isDraggingOver && "bg-primary/5 rounded-md"
                  )}
                >
                  {column.cards.length === 0 && !dropSnapshot.isDraggingOver && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Drop cards here
                    </p>
                  )}
                  {column.cards.map((card, cardIndex) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onDelete={onDeleteCard}
                    />
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add card button */}
            <div className="p-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setAddCardOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add card
              </Button>
            </div>
          </div>

          <AddCardDialog
            open={addCardOpen}
            onOpenChange={setAddCardOpen}
            columnId={column.id}
            workspaceId={workspaceId}
            onSubmit={onAddCard}
            isLoading={isAddCardLoading}
          />
        </div>
      )}
    </Draggable>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/boards/KanbanColumn.tsx
git commit -m "feat(kanban): add KanbanColumn with droppable area and add card dialog"
```

---

## Task 14: KanbanBoard Component (Main DnD Container)

**Files:**
- Create: `src/components/boards/KanbanBoard.tsx`

- [ ] **Step 1: Create KanbanBoard**

Create `src/components/boards/KanbanBoard.tsx`:

```typescript
"use client";

import { useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import type {
  BoardDetail,
  KanbanColumnData,
  KanbanCardData,
} from "@/hooks/use-boards";
import type { AddCardInput, ReorderInput } from "@/lib/validators";

interface KanbanBoardProps {
  board: BoardDetail;
  workspaceId: string;
  onUpdateColumn: (data: {
    columnId: string;
    name?: string;
    color?: string | null;
    icon?: string | null;
  }) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (data: AddCardInput) => void;
  onDeleteCard: (cardId: string) => void;
  onReorder: (data: ReorderInput) => void;
  isUpdateColumnLoading?: boolean;
  isAddCardLoading?: boolean;
}

export function KanbanBoard({
  board,
  workspaceId,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onDeleteCard,
  onReorder,
  isUpdateColumnLoading,
  isAddCardLoading,
}: KanbanBoardProps) {
  const qc = useQueryClient();
  const boardKey = ["board", workspaceId, board.id];

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type } = result;

      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      // Optimistic update
      const prev = qc.getQueryData<BoardDetail>(boardKey);
      if (!prev) return;

      if (type === "column") {
        // Reorder columns
        const newColumns = [...prev.columns];
        const [moved] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, moved);

        const updatedColumns = newColumns.map((col, i) => ({
          ...col,
          position: i,
        }));

        qc.setQueryData<BoardDetail>(boardKey, {
          ...prev,
          columns: updatedColumns,
        });

        onReorder({
          columns: updatedColumns.map((c) => ({
            id: c.id,
            position: c.position,
          })),
        });
      } else {
        // Reorder cards
        const sourceCol = prev.columns.find(
          (c) => c.id === source.droppableId
        );
        const destCol = prev.columns.find(
          (c) => c.id === destination.droppableId
        );
        if (!sourceCol || !destCol) return;

        if (source.droppableId === destination.droppableId) {
          // Same column
          const newCards = [...sourceCol.cards];
          const [moved] = newCards.splice(source.index, 1);
          newCards.splice(destination.index, 0, moved);

          const updatedCards = newCards.map((card, i) => ({
            ...card,
            position: i,
          }));

          qc.setQueryData<BoardDetail>(boardKey, {
            ...prev,
            columns: prev.columns.map((col) =>
              col.id === sourceCol.id
                ? { ...col, cards: updatedCards }
                : col
            ),
          });

          onReorder({
            cards: updatedCards.map((c) => ({
              id: c.id,
              columnId: sourceCol.id,
              position: c.position,
            })),
          });
        } else {
          // Different columns
          const sourceCards = [...sourceCol.cards];
          const destCards = [...destCol.cards];
          const [moved] = sourceCards.splice(source.index, 1);
          destCards.splice(destination.index, 0, {
            ...moved,
            columnId: destCol.id,
          });

          const updatedSourceCards = sourceCards.map((card, i) => ({
            ...card,
            position: i,
          }));
          const updatedDestCards = destCards.map((card, i) => ({
            ...card,
            position: i,
          }));

          qc.setQueryData<BoardDetail>(boardKey, {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === sourceCol.id)
                return { ...col, cards: updatedSourceCards };
              if (col.id === destCol.id)
                return { ...col, cards: updatedDestCards };
              return col;
            }),
          });

          onReorder({
            cards: [
              ...updatedSourceCards.map((c) => ({
                id: c.id,
                columnId: sourceCol.id,
                position: c.position,
              })),
              ...updatedDestCards.map((c) => ({
                id: c.id,
                columnId: destCol.id,
                position: c.position,
              })),
            ],
          });
        }
      }
    },
    [board.id, boardKey, onReorder, qc]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="column" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ minHeight: "calc(100vh - 180px)" }}
          >
            {board.columns.map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                index={index}
                workspaceId={workspaceId}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
                onAddCard={onAddCard}
                onDeleteCard={onDeleteCard}
                isUpdateLoading={isUpdateColumnLoading}
                isAddCardLoading={isAddCardLoading}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/boards/KanbanBoard.tsx
git commit -m "feat(kanban): add KanbanBoard DnD container with optimistic reorder"
```

---

## Task 15: Board View Page

**Files:**
- Create: `src/app/(app)/workspaces/[workspaceId]/boards/[boardId]/page.tsx`

- [ ] **Step 1: Create the board view page**

Create `src/app/(app)/workspaces/[workspaceId]/boards/[boardId]/page.tsx`:

```typescript
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/boards/KanbanBoard";
import { useBoard, useUpdateBoard, useBoardMutations } from "@/hooks/use-boards";
import type { ColumnInput } from "@/lib/validators";

export default function BoardViewPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const { workspaceId, boardId } = use(params);
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const { data: board, isLoading } = useBoard(workspaceId, boardId);
  const updateBoard = useUpdateBoard(workspaceId, boardId);
  const {
    createColumn,
    updateColumn,
    deleteColumn,
    addCard,
    deleteCard,
    reorder,
  } = useBoardMutations(workspaceId, boardId);

  const handleRenameBoard = () => {
    if (editName.trim() && editName.trim() !== board?.name) {
      updateBoard.mutate({ name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    createColumn.mutate({ name: newColumnName.trim() });
    setNewColumnName("");
    setShowAddColumn(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-96 w-72 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Board not found</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push(`/workspaces/${workspaceId}/boards`)}
        >
          Back to boards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/workspaces/${workspaceId}/boards`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isEditingName ? (
          <input
            className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameBoard}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameBoard();
              if (e.key === "Escape") setIsEditingName(false);
            }}
            autoFocus
          />
        ) : (
          <h1
            className="text-2xl font-bold cursor-pointer hover:text-primary/80 flex items-center gap-2 group"
            onClick={() => {
              setEditName(board.name);
              setIsEditingName(true);
            }}
          >
            {board.name}
            <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50" />
          </h1>
        )}

        <div className="ml-auto flex items-center gap-2">
          {showAddColumn ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-40"
                placeholder="Column name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") setShowAddColumn(false);
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleAddColumn}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddColumn(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddColumn(true)}
              disabled={(board.columns?.length || 0) >= 10}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <KanbanBoard
        board={board}
        workspaceId={workspaceId}
        onUpdateColumn={(data) => updateColumn.mutate(data)}
        onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
        onAddCard={(data) => addCard.mutate(data)}
        onDeleteCard={(cardId) => {
          if (confirm("Remove this card from the board?")) {
            deleteCard.mutate(cardId);
          }
        }}
        onReorder={(data) => reorder.mutate(data)}
        isUpdateColumnLoading={updateColumn.isPending}
        isAddCardLoading={addCard.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/workspaces/\[workspaceId\]/boards/\[boardId\]/page.tsx
git commit -m "feat(kanban): add board view page with inline rename and add column"
```

---

## Task 16: Dashboard Recent Boards Widget

**Files:**
- Create: `src/components/dashboard/RecentBoards.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create RecentBoards component**

Create `src/components/dashboard/RecentBoards.tsx`:

```typescript
"use client";

import Link from "next/link";
import { LayoutGrid, Columns3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardBoards, type DashboardBoard } from "@/hooks/use-boards";

export function RecentBoards() {
  const { data: boards, isLoading } = useDashboardBoards();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Recent Boards
        </h2>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        Recent Boards
      </h2>

      {!boards || boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Columns3 className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No boards yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {boards.map((board: DashboardBoard) => (
            <Link
              key={board.id}
              href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {board.workspace.color && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: board.workspace.color }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{board.name}</p>
                <p className="text-xs text-muted-foreground">
                  {board.columnCount} columns &middot; {board.cardCount} cards
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(board.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add RecentBoards to the dashboard page**

Read `src/app/(app)/dashboard/page.tsx` and add the `RecentBoards` import and component. Place it after the existing widgets (UpcomingTodos and RecentLinks). Follow the existing pattern — add the import at the top and render `<RecentBoards />` in the grid/layout.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/RecentBoards.tsx src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(kanban): add RecentBoards dashboard widget"
```

---

## Task 17: Update Boards Redirect Page

**Files:**
- Modify: `src/app/(app)/boards/page.tsx`

- [ ] **Step 1: Read current redirect page**

Read `src/app/(app)/boards/page.tsx` to see the current redirect logic.

- [ ] **Step 2: Update to match workspace redirect pattern**

Ensure it follows the same pattern as `/todos/page.tsx` and `/links/page.tsx` — redirect to `/workspaces/{currentWorkspaceId}/boards` using the workspace context. The existing code likely already does this; verify and fix if needed.

- [ ] **Step 3: Commit (if changed)**

```bash
git add src/app/\(app\)/boards/page.tsx
git commit -m "fix(kanban): update boards redirect to workspace-scoped route"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Run TypeScript compilation check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean, no errors

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 3: Manually test in browser**

1. Navigate to dashboard — verify "Recent Boards" widget appears
2. Navigate to boards list — verify empty state shows
3. Create a board — verify default 3 columns appear
4. Add cards (existing todos, existing links, new todo, new link)
5. Drag cards between columns and within columns
6. Drag columns to reorder
7. Rename board inline
8. Open column settings — change color and icon
9. Delete a card (should keep underlying todo/link)
10. Delete an empty column
11. Delete a board

- [ ] **Step 4: Commit any fixes**

If any issues found during testing, fix and commit each fix separately.
