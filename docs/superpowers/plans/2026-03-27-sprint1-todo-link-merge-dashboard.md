# Sprint 1: Todo/Link Merge + Dashboard UI Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify todos and links (URL auto-detect in todo title with metadata fetch) and overhaul the dashboard with an editorial/modern design featuring a hero section, progress stats, and visually varied widgets.

**Architecture:** Add URL + metadata fields to TodoItem schema. Enhance TodoForm with URL auto-detection on paste/blur. Redesign dashboard with DashboardHero component (time-aware greeting, stats, quick actions) and restyled widgets (checklist todos, media-rich links, mini kanban boards). Add Space Grotesk display font.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React Query, Zod, shadcn/ui, Tailwind CSS 4, next/font/google, lucide-react, date-fns

---

## File Structure

### New Files

```
src/components/todos/LinkPreview.tsx                — Link preview card (reused in TodoForm, TodoItem, KanbanCard)
src/components/dashboard/DashboardHero.tsx           — Hero section with greeting, stats, quick actions
src/components/dashboard/CompletionRing.tsx           — Circular progress SVG component
src/app/api/dashboard/stats/route.ts                 — Dashboard stats API (completed today, due today, overdue)
```

### Modified Files

```
prisma/schema.prisma                                 — Add url, thumbnail, siteName, favicon to TodoItem
src/lib/validators.ts                                — Add URL/metadata fields to todoSchema and addCardSchema
src/hooks/use-todos.ts                               — Add url/metadata fields to Todo interface, add useDashboardStats hook
src/app/api/workspaces/[workspaceId]/todos/route.ts  — Accept and store url/metadata fields
src/app/api/workspaces/[workspaceId]/todos/[todoId]/route.ts — Accept url/metadata in PATCH
src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/route.ts — new-link mode creates TodoItem with URL
src/components/todos/TodoForm.tsx                    — Add URL auto-detect, link preview, metadata fields
src/components/todos/TodoItem.tsx                    — Show link indicator for todos with URLs
src/components/boards/AddCardDialog.tsx              — Expandable form, URL auto-detect, new-link creates todo
src/components/boards/KanbanCard.tsx                 — Richer display for todos-with-URLs
src/components/dashboard/UpcomingTodos.tsx            — Checklist style with progress bar, priority strips
src/components/dashboard/RecentLinks.tsx              — Rich media mini-grid with thumbnails
src/components/dashboard/RecentBoards.tsx             — Mini kanban preview with column dots
src/app/(app)/dashboard/page.tsx                     — Add hero section, restructure layout
src/app/layout.tsx                                   — Add Space Grotesk display font
```

---

## Task 1: Schema Migration — Add URL and metadata fields to TodoItem

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to TodoItem model**

In `prisma/schema.prisma`, add these 4 fields to the `TodoItem` model after `reminderAt`:

```prisma
  url         String?
  thumbnail   String?
  siteName    String?
  favicon     String?
```

- [ ] **Step 2: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 3: Apply migration**

Run: `npx prisma db push`
Expected: Schema pushed successfully (use `db push` since `migrate dev` has issues with Prisma Local Postgres)

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/generated/
git commit -m "feat: add url and metadata fields to TodoItem schema"
```

---

## Task 2: Update Zod Validators

**Files:**
- Modify: `src/lib/validators.ts`

- [ ] **Step 1: Update todoSchema to accept URL and metadata**

Replace the `todoSchema` definition (lines 27-33) with:

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

- [ ] **Step 2: Update addCardSchema new-todo variant to include URL fields**

Replace the `new-todo` variant in `addCardSchema` (lines 68-75) with:

```typescript
  z.object({
    mode: z.literal("new-todo"),
    columnId: z.string().min(1),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    dueDate: z.string().optional(),
    reminderAt: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
    thumbnail: z.string().optional(),
    siteName: z.string().optional(),
    favicon: z.string().optional(),
  }),
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: add url and metadata fields to todo and card validators"
```

---

## Task 3: Update Todo API Routes

**Files:**
- Modify: `src/app/api/workspaces/[workspaceId]/todos/route.ts`
- Modify: `src/app/api/workspaces/[workspaceId]/todos/[todoId]/route.ts`

- [ ] **Step 1: Update POST handler to store URL and metadata**

In `src/app/api/workspaces/[workspaceId]/todos/route.ts`, replace lines 72-81 (the destructuring and create call) with:

```typescript
  const { dueDate, reminderAt, url, ...rest } = parsed.data;

  const todo = await prisma.todoItem.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      reminderAt: reminderAt ? new Date(reminderAt) : undefined,
      url: url || undefined,
      workspaceId,
    },
  });
```

- [ ] **Step 2: Update PATCH handler to accept URL and metadata fields**

Read `src/app/api/workspaces/[workspaceId]/todos/[todoId]/route.ts`. In the PATCH handler, add handling for the new fields in the `data` object construction. After the existing field checks (title, description, completed, priority, dueDate, reminderAt), add:

```typescript
  if (url !== undefined) data.url = url || null;
  if (thumbnail !== undefined) data.thumbnail = thumbnail || null;
  if (siteName !== undefined) data.siteName = siteName || null;
  if (favicon !== undefined) data.favicon = favicon || null;
```

Also destructure `url`, `thumbnail`, `siteName`, `favicon` from the request body alongside the existing fields.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/workspaces/\[workspaceId\]/todos/
git commit -m "feat: accept url and metadata fields in todo API routes"
```

---

## Task 4: Update Todo Hook Types

**Files:**
- Modify: `src/hooks/use-todos.ts`

- [ ] **Step 1: Add URL and metadata fields to Todo interface**

In `src/hooks/use-todos.ts`, add these fields to the `Todo` interface after `reminderAt`:

```typescript
  url: string | null;
  thumbnail: string | null;
  siteName: string | null;
  favicon: string | null;
```

- [ ] **Step 2: Add useDashboardStats hook**

Append after the `useDeleteTodo` function:

```typescript
export interface DashboardStats {
  totalTodosToday: number;
  completedToday: number;
  dueToday: number;
  overdue: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetchJson("/api/dashboard/stats"),
  });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-todos.ts
git commit -m "feat: add url/metadata to Todo type and dashboard stats hook"
```

---

## Task 5: Dashboard Stats API Route

**Files:**
- Create: `src/app/api/dashboard/stats/route.ts`

- [ ] **Step 1: Create the stats route**

Create `src/app/api/dashboard/stats/route.ts`:

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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [dueToday, overdue, completedToday, totalTodosToday] =
    await Promise.all([
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: false,
          dueDate: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: false,
          dueDate: { lt: startOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: true,
          updatedAt: { gte: startOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          OR: [
            { createdAt: { gte: startOfDay } },
            { dueDate: { gte: startOfDay, lt: endOfDay } },
          ],
        },
      }),
    ]);

  return NextResponse.json({
    totalTodosToday,
    completedToday,
    dueToday,
    overdue,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/dashboard/stats/
git commit -m "feat: add dashboard stats API route"
```

---

## Task 6: LinkPreview Component

**Files:**
- Create: `src/components/todos/LinkPreview.tsx`

- [ ] **Step 1: Create the LinkPreview component**

Create `src/components/todos/LinkPreview.tsx`:

```typescript
"use client";

import { X, ExternalLink, Globe } from "lucide-react";

interface LinkPreviewProps {
  url: string;
  thumbnail?: string | null;
  siteName?: string | null;
  favicon?: string | null;
  onRemove?: () => void;
  compact?: boolean;
}

export function LinkPreview({
  url,
  thumbnail,
  siteName,
  favicon,
  onRemove,
  compact,
}: LinkPreviewProps) {
  let displayUrl = url;
  try {
    displayUrl = new URL(url).hostname;
  } catch {}

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {favicon ? (
          <img src={favicon} alt="" className="h-3.5 w-3.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
        <span className="truncate max-w-[150px]">{siteName || displayUrl}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="h-14 w-20 rounded object-cover shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="h-14 w-20 rounded bg-muted flex items-center justify-center shrink-0">
          <Globe className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {favicon ? (
            <img src={favicon} alt="" className="h-4 w-4 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {siteName || displayUrl}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">{url}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-muted hover:bg-destructive/10 flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todos/LinkPreview.tsx
git commit -m "feat: add LinkPreview component for todos with URLs"
```

---

## Task 7: Enhance TodoForm with URL Auto-Detection

**Files:**
- Modify: `src/components/todos/TodoForm.tsx`

- [ ] **Step 1: Rewrite TodoForm with URL detection**

Replace the entire content of `src/components/todos/TodoForm.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { todoSchema, type TodoInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LinkPreview } from "./LinkPreview";
import type { Todo } from "@/hooks/use-todos";

type TodoFormValues = z.output<typeof todoSchema>;

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  onSubmit: (data: TodoInput) => void;
  isLoading?: boolean;
}

function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function TodoForm({
  open,
  onOpenChange,
  todo,
  onSubmit,
  isLoading,
}: TodoFormProps) {
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [linkMeta, setLinkMeta] = useState<{
    url: string;
    thumbnail?: string;
    siteName?: string;
    favicon?: string;
  } | null>(todo?.url ? { url: todo.url, thumbnail: todo.thumbnail ?? undefined, siteName: todo.siteName ?? undefined, favicon: todo.favicon ?? undefined } : null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema) as never,
    values: todo
      ? {
          title: todo.title,
          description: todo.description || "",
          priority: todo.priority as "low" | "medium" | "high",
          dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "",
          reminderAt: todo.reminderAt ? new Date(todo.reminderAt).toISOString().slice(0, 16) : "",
          url: todo.url || "",
          thumbnail: todo.thumbnail || "",
          siteName: todo.siteName || "",
          favicon: todo.favicon || "",
        }
      : {
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          reminderAt: "",
          url: "",
          thumbnail: "",
          siteName: "",
          favicon: "",
        },
  });

  const fetchMetadata = useCallback(async (url: string) => {
    setFetchingMeta(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return;
      const meta = await res.json();
      if (meta.title) setValue("title", meta.title);
      if (meta.description) setValue("description", meta.description);
      setValue("url", url);
      setValue("thumbnail", meta.thumbnail || "");
      setValue("siteName", meta.siteName || "");
      setValue("favicon", meta.favicon || "");
      setLinkMeta({
        url,
        thumbnail: meta.thumbnail,
        siteName: meta.siteName,
        favicon: meta.favicon,
      });
    } catch {
      // Still store the URL even if metadata fetch fails
      setValue("url", url);
      setLinkMeta({ url });
    } finally {
      setFetchingMeta(false);
    }
  }, [setValue]);

  const handleTitleChange = useCallback(
    (e: React.FocusEvent<HTMLInputElement> | React.ClipboardEvent<HTMLInputElement>) => {
      const value = "clipboardData" in e
        ? e.clipboardData.getData("text")
        : (e.target as HTMLInputElement).value;
      if (value && isUrl(value.trim()) && !linkMeta) {
        fetchMetadata(value.trim());
      }
    },
    [fetchMetadata, linkMeta]
  );

  const handleRemoveLink = () => {
    setValue("url", "");
    setValue("thumbnail", "");
    setValue("siteName", "");
    setValue("favicon", "");
    setLinkMeta(null);
  };

  const handleFormSubmit = (data: TodoFormValues) => {
    onSubmit(data);
    reset();
    setLinkMeta(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setLinkMeta(todo?.url ? linkMeta : null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "Edit Todo" : "Create Todo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <Input
                id="title"
                placeholder="What needs to be done? (paste a URL to auto-fetch)"
                {...register("title")}
                onBlur={handleTitleChange}
                onPaste={handleTitleChange}
              />
              {fetchingMeta && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {linkMeta && (
            <LinkPreview
              url={linkMeta.url}
              thumbnail={linkMeta.thumbnail}
              siteName={linkMeta.siteName}
              favicon={linkMeta.favicon}
              onRemove={handleRemoveLink}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Add details..."
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("priority")}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderAt">Reminder</Label>
            <Input id="reminderAt" type="datetime-local" {...register("reminderAt")} />
          </div>

          {/* Hidden fields for URL metadata */}
          <input type="hidden" {...register("url")} />
          <input type="hidden" {...register("thumbnail")} />
          <input type="hidden" {...register("siteName")} />
          <input type="hidden" {...register("favicon")} />

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : todo ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
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
git add src/components/todos/TodoForm.tsx
git commit -m "feat: add URL auto-detection and link preview to TodoForm"
```

---

## Task 8: Enhance TodoItem with Link Indicator

**Files:**
- Modify: `src/components/todos/TodoItem.tsx`

- [ ] **Step 1: Add link indicator to TodoItem**

After the existing badges section (line 102, after the closing `</div>` of the flex-wrap badges), add:

```typescript
        {todo.url && (
          <div className="mt-1">
            <LinkPreview url={todo.url} siteName={todo.siteName} favicon={todo.favicon} compact />
          </div>
        )}
```

Also add the import at the top:

```typescript
import { LinkPreview } from "./LinkPreview";
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/todos/TodoItem.tsx
git commit -m "feat: show link indicator on todos with URLs"
```

---

## Task 9: Enhance AddCardDialog with Expandable Form and URL Detection

**Files:**
- Modify: `src/components/boards/AddCardDialog.tsx`

- [ ] **Step 1: Rewrite AddCardDialog with expandable form and URL detection**

Replace the entire content of `src/components/boards/AddCardDialog.tsx`. The new version:
- "New Todo" tab: compact by default (title + priority + URL detect), "More options" button expands to show description, due date, reminder
- "New Link" tab: creates a TodoItem with URL (unified model)
- URL auto-detection same as TodoForm

```typescript
"use client";

import { useState, useCallback } from "react";
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
import { CheckSquare, Link2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { LinkPreview } from "@/components/todos/LinkPreview";
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

function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const [expanded, setExpanded] = useState(false);

  const { data: todos } = useTodos(workspaceId, { status: "active" });
  const { data: links } = useLinks(workspaceId);

  // New todo fields
  const [todoTitle, setTodoTitle] = useState("");
  const [todoPriority, setTodoPriority] = useState<"low" | "medium" | "high">("medium");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoDueDate, setTodoDueDate] = useState("");
  const [todoReminderAt, setTodoReminderAt] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [linkMeta, setLinkMeta] = useState<{ url: string; thumbnail?: string; siteName?: string; favicon?: string } | null>(null);

  // New link fields
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const fetchMetadata = useCallback(async (url: string) => {
    setFetchingMeta(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return;
      const meta = await res.json();
      if (meta.title) setTodoTitle(meta.title);
      if (meta.description) setTodoDescription(meta.description);
      setLinkMeta({ url, thumbnail: meta.thumbnail, siteName: meta.siteName, favicon: meta.favicon });
    } catch {
      setLinkMeta({ url });
    } finally {
      setFetchingMeta(false);
    }
  }, []);

  const handleTitleBlurOrPaste = useCallback(
    (value: string) => {
      if (value && isUrl(value.trim()) && !linkMeta) {
        fetchMetadata(value.trim());
      }
    },
    [fetchMetadata, linkMeta]
  );

  const resetForm = () => {
    setTodoTitle("");
    setTodoPriority("medium");
    setTodoDescription("");
    setTodoDueDate("");
    setTodoReminderAt("");
    setLinkMeta(null);
    setLinkUrl("");
    setLinkTitle("");
    setExpanded(false);
  };

  const handleSubmit = () => {
    if (tab === "new-todo") {
      if (!todoTitle.trim()) return;
      onSubmit({
        mode: "new-todo",
        columnId,
        title: todoTitle.trim(),
        description: todoDescription || undefined,
        priority: todoPriority,
        dueDate: todoDueDate || undefined,
        reminderAt: todoReminderAt || undefined,
        url: linkMeta?.url || undefined,
        thumbnail: linkMeta?.thumbnail || undefined,
        siteName: linkMeta?.siteName || undefined,
        favicon: linkMeta?.favicon || undefined,
      });
    } else if (tab === "new-link") {
      if (!linkUrl.trim()) return;
      // Create as a todo with URL (unified model)
      onSubmit({
        mode: "new-todo",
        columnId,
        title: linkTitle.trim() || linkUrl.trim(),
        priority: "medium",
        url: linkUrl.trim(),
      });
    }
    resetForm();
    onOpenChange(false);
  };

  const handleAddExisting = (todoId?: string, savedLinkId?: string) => {
    onSubmit({ mode: "existing", columnId, todoId, savedLinkId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="existing-todo" className="text-xs">Existing Todo</TabsTrigger>
            <TabsTrigger value="existing-link" className="text-xs">Existing Link</TabsTrigger>
            <TabsTrigger value="new-todo" className="text-xs">New Todo</TabsTrigger>
            <TabsTrigger value="new-link" className="text-xs">New Link</TabsTrigger>
          </TabsList>

          <TabsContent value="existing-todo" className="mt-4">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(todos || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active todos. Try the &quot;New Todo&quot; tab.</p>
              ) : (
                (todos || []).map((todo: Todo) => (
                  <button key={todo.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2" onClick={() => handleAddExisting(todo.id, undefined)} disabled={isLoading}>
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
                <p className="text-sm text-muted-foreground text-center py-4">No saved links. Try the &quot;New Link&quot; tab.</p>
              ) : (
                (links || []).map((link: SavedLink) => (
                  <button key={link.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2" onClick={() => handleAddExisting(undefined, link.id)} disabled={isLoading}>
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{link.title || link.url}</span>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new-todo" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="card-todo-title">Title</Label>
              <div className="relative">
                <Input
                  id="card-todo-title"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  onBlur={(e) => handleTitleBlurOrPaste(e.target.value)}
                  onPaste={(e) => { setTimeout(() => handleTitleBlurOrPaste(e.currentTarget.value), 0); }}
                  placeholder="What needs to be done? (paste URL to auto-fetch)"
                />
                {fetchingMeta && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>

            {linkMeta && (
              <LinkPreview url={linkMeta.url} thumbnail={linkMeta.thumbnail} siteName={linkMeta.siteName} favicon={linkMeta.favicon} onRemove={() => setLinkMeta(null)} />
            )}

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button key={p} type="button" variant={todoPriority === p ? "default" : "outline"} size="sm" onClick={() => setTodoPriority(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Less options" : "More options"}
            </button>

            {expanded && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="card-todo-desc">Description</Label>
                  <textarea
                    id="card-todo-desc"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Add details..."
                    value={todoDescription}
                    onChange={(e) => setTodoDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="card-todo-due">Due Date</Label>
                    <Input id="card-todo-due" type="date" value={todoDueDate} onChange={(e) => setTodoDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-todo-remind">Reminder</Label>
                    <Input id="card-todo-remind" type="datetime-local" value={todoReminderAt} onChange={(e) => setTodoReminderAt(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new-link" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="card-link-url">URL</Label>
              <Input id="card-link-url" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-link-title">Title (optional)</Label>
              <Input id="card-link-title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Custom title" />
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
git commit -m "feat: enhance AddCardDialog with expandable form and URL auto-detect"
```

---

## Task 10: Enhance KanbanCard for Todos with URLs

**Files:**
- Modify: `src/components/boards/KanbanCard.tsx`

- [ ] **Step 1: Update TodoCardContent to show link info**

In `src/components/boards/KanbanCard.tsx`, update the `TodoCardContent` function. After the existing badges section (the `<div className="flex items-center gap-1.5 flex-wrap">` block), add:

```typescript
      {todo.url && (
        <div className="mt-1">
          <a
            href={todo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {todo.favicon ? (
              <img src={todo.favicon} alt="" className="h-3 w-3" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            <span className="truncate max-w-[120px]">{todo.siteName || "Open link"}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}
```

Also update the `todo` type in `TodoCardContent` to include the new fields. The `KanbanCardData["todo"]` type should already include them from the Prisma response.

Add missing imports at the top if not already present: `Globe`, `ExternalLink` from `lucide-react`.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/boards/KanbanCard.tsx
git commit -m "feat: show link info on kanban cards for todos with URLs"
```

---

## Task 11: Update Cards API — new-link Mode Creates Todo

**Files:**
- Modify: `src/app/api/workspaces/[workspaceId]/boards/[boardId]/cards/route.ts`

- [ ] **Step 1: Update new-todo mode to store URL metadata**

In the cards route POST handler, find the `else if (data.mode === "new-todo")` block. Update it to include URL metadata:

```typescript
  } else if (data.mode === "new-todo") {
    const todo = await prisma.todoItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
        url: data.url || undefined,
        thumbnail: data.thumbnail || undefined,
        siteName: data.siteName || undefined,
        favicon: data.favicon || undefined,
        workspaceId,
      },
    });
    todoId = todo.id;
  }
```

The `new-link` mode stays unchanged since the AddCardDialog now sends `mode: "new-todo"` for new links too.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/workspaces/\[workspaceId\]/boards/\[boardId\]/cards/
git commit -m "feat: store URL metadata when creating todo cards on boards"
```

---

## Task 12: Add Space Grotesk Display Font

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Space Grotesk font**

In `src/app/layout.tsx`, add the font import and CSS variable:

```typescript
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
```

Add the font configuration after the existing fonts:

```typescript
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

Update the `<html>` className to include the new variable:

```typescript
className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Space Grotesk display font"
```

---

## Task 13: CompletionRing Component

**Files:**
- Create: `src/components/dashboard/CompletionRing.tsx`

- [ ] **Step 1: Create the completion ring SVG component**

Create `src/components/dashboard/CompletionRing.tsx`:

```typescript
"use client";

interface CompletionRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function CompletionRing({ completed, total, size = 80 }: CompletionRingProps) {
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold font-[family-name:var(--font-space-grotesk)]">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CompletionRing.tsx
git commit -m "feat: add CompletionRing SVG component for dashboard"
```

---

## Task 14: DashboardHero Component

**Files:**
- Create: `src/components/dashboard/DashboardHero.tsx`

- [ ] **Step 1: Create the hero component**

Create `src/components/dashboard/DashboardHero.tsx`:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Link2, LayoutGrid, CalendarCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompletionRing } from "./CompletionRing";
import { useDashboardStats } from "@/hooks/use-todos";
import { useWorkspaceContext } from "@/contexts/workspace-context";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const { data: session } = useSession();
  const { data: stats } = useDashboardStats();
  const { currentWorkspaceId } = useWorkspaceContext();
  const router = useRouter();
  const name = session?.user?.name?.split(" ")[0] || "there";
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side — greeting + actions */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
              {getGreeting()}, {name}
            </h1>
            <p className="text-muted-foreground mt-1">{today}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/todos` : "/todos")}
            >
              <Plus className="h-3.5 w-3.5" />
              New Todo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/links` : "/links")}
            >
              <Link2 className="h-3.5 w-3.5" />
              New Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/boards` : "/boards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              New Board
            </Button>
          </div>
        </div>

        {/* Right side — stats */}
        <div className="flex items-center gap-5">
          <CompletionRing
            completed={stats?.completedToday || 0}
            total={stats?.totalTodosToday || 0}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none">
                  {stats?.dueToday || 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Due Today</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${(stats?.overdue || 0) > 0 ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30" : "bg-card/80"}`}>
              <AlertTriangle className={`h-4 w-4 ${(stats?.overdue || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none ${(stats?.overdue || 0) > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {stats?.overdue || 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DashboardHero.tsx
git commit -m "feat: add DashboardHero with greeting, stats, and quick actions"
```

---

## Task 15: Redesign UpcomingTodos Widget

**Files:**
- Modify: `src/components/dashboard/UpcomingTodos.tsx`

- [ ] **Step 1: Replace with checklist-style widget**

Replace the entire content of `src/components/dashboard/UpcomingTodos.tsx`:

```typescript
"use client";

import { formatDistanceToNow, isPast } from "date-fns";
import { CalendarClock, CheckSquare, Globe } from "lucide-react";
import { useUpcomingTodos } from "@/hooks/use-todos";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
};

export function UpcomingTodos() {
  const { data: todos, isLoading } = useUpcomingTodos();
  const completed = todos?.filter((t) => t.completed).length || 0;
  const total = todos?.length || 0;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
          <CalendarClock className="h-4 w-4 text-primary" />
          Upcoming Todos
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !todos || todos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todos.map((todo, i) => {
                const overdue = todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate));
                const color = priorityColors[todo.priority] || priorityColors.medium;
                return (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent/50 transition-colors group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Priority strip */}
                    <div className={cn("w-1 h-8 rounded-full shrink-0", color)} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-sm font-medium truncate", todo.completed && "line-through opacity-60")}>
                          {todo.title}
                        </p>
                        {todo.url && todo.favicon && (
                          <img src={todo.favicon} alt="" className="h-3.5 w-3.5 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                      {todo.workspace && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: todo.workspace.color || "#6366f1" }} />
                          <span className="text-[10px] text-muted-foreground">{todo.workspace.name}</span>
                        </div>
                      )}
                    </div>

                    {todo.dueDate && (
                      <span className={cn(
                        "text-[10px] shrink-0",
                        overdue ? "text-red-500 font-medium" : "text-muted-foreground"
                      )}>
                        {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/UpcomingTodos.tsx
git commit -m "feat: redesign UpcomingTodos with progress bar and priority strips"
```

---

## Task 16: Redesign RecentLinks Widget

**Files:**
- Modify: `src/components/dashboard/RecentLinks.tsx`

- [ ] **Step 1: Replace with rich media mini-grid widget**

Replace the entire content of `src/components/dashboard/RecentLinks.tsx`:

```typescript
"use client";

import { Link2, Globe, ImageOff } from "lucide-react";
import { useRecentLinks } from "@/hooks/use-links";
import { useState } from "react";

export function RecentLinks() {
  const { data: links, isLoading } = useRecentLinks();

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms" }}>
      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
          <Link2 className="h-4 w-4 text-primary" />
          Recent Links
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !links || links.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No saved links yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {links.slice(0, 4).map((link) => (
                <LinkMiniCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkMiniCard({ link }: { link: { id: string; url: string; title: string | null; thumbnail: string | null; favicon: string | null; siteName: string | null } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      <div className="h-16 bg-muted overflow-hidden">
        {link.thumbnail && !imgError ? (
          <img src={link.thumbnail} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <ImageOff className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-1">{link.title || link.url}</p>
        <div className="flex items-center gap-1 mt-1">
          {link.favicon ? (
            <img src={link.favicon} alt="" className="h-3 w-3 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {link.siteName || (() => { try { return new URL(link.url).hostname; } catch { return link.url; } })()}
          </span>
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/RecentLinks.tsx
git commit -m "feat: redesign RecentLinks with rich media mini-grid"
```

---

## Task 17: Redesign RecentBoards Widget

**Files:**
- Modify: `src/components/dashboard/RecentBoards.tsx`

- [ ] **Step 1: Replace with mini kanban preview widget**

Replace the entire content of `src/components/dashboard/RecentBoards.tsx`:

```typescript
"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardBoards, type DashboardBoard } from "@/hooks/use-boards";

export function RecentBoards() {
  const { data: boards, isLoading } = useDashboardBoards();

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms" }}>
      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Recent Boards
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !boards || boards.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <LayoutGrid className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No boards yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boards.map((board: DashboardBoard) => (
                <Link
                  key={board.id}
                  href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
                  className="block rounded-lg border p-3 hover:border-primary/50 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {board.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Column dots */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[...Array(Math.min(board.columnCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary/40"
                      />
                    ))}
                    {board.columnCount > 5 && (
                      <span className="text-[9px] text-muted-foreground">+{board.columnCount - 5}</span>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {board.cardCount} cards across {board.columnCount} columns
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/RecentBoards.tsx
git commit -m "feat: redesign RecentBoards with mini kanban preview"
```

---

## Task 18: Restructure Dashboard Page

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard page with hero + widget grid**

Replace the entire content of `src/app/(app)/dashboard/page.tsx`:

```typescript
"use client";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UpcomingTodos } from "@/components/dashboard/UpcomingTodos";
import { RecentLinks } from "@/components/dashboard/RecentLinks";
import { RecentBoards } from "@/components/dashboard/RecentBoards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
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

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: restructure dashboard with hero section and 3-column widget grid"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Run TypeScript compilation check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean, no errors

- [ ] **Step 2: Run build**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Manual testing checklist**

1. Dashboard — hero shows greeting, stats, quick actions
2. Dashboard — completion ring animates
3. Dashboard — overdue stat turns red when > 0
4. Dashboard — widgets have staggered animations
5. Dashboard — todos widget shows priority strips, progress bar
6. Dashboard — links widget shows thumbnail grid
7. Dashboard — boards widget shows column dots
8. Todos page — paste a URL in title, metadata auto-fetches
9. Todos page — link preview appears, can remove with X
10. Todos page — submit creates todo with URL attached
11. Todos page — todo with URL shows link indicator
12. Board — add card dialog "New Todo" has expandable form
13. Board — paste URL in card title, auto-fetches
14. Board — kanban card shows link info for todos with URLs
15. Dark mode — all new components render correctly

- [ ] **Step 4: Commit any fixes**
