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
import { CheckSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { LinkPreview } from "@/components/todos/LinkPreview";
import { useTodos, type Todo } from "@/hooks/use-todos";
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

  // New todo fields
  const [todoTitle, setTodoTitle] = useState("");
  const [todoPriority, setTodoPriority] = useState<"low" | "medium" | "high">("medium");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoDueDate, setTodoDueDate] = useState("");
  const [todoReminderAt, setTodoReminderAt] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [linkMeta, setLinkMeta] = useState<{ url: string; thumbnail?: string; siteName?: string; favicon?: string } | null>(null);

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
    }
    resetForm();
    onOpenChange(false);
  };

  const handleAddExisting = (todoId: string) => {
    onSubmit({ mode: "existing", columnId, todoId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing-todo" className="text-xs">Existing Todo</TabsTrigger>
            <TabsTrigger value="new-todo" className="text-xs">New Todo</TabsTrigger>
          </TabsList>

          <TabsContent value="existing-todo" className="mt-4">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(todos || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active todos. Try the &quot;New Todo&quot; tab.</p>
              ) : (
                (todos || []).map((todo: Todo) => (
                  <button key={todo.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2" onClick={() => handleAddExisting(todo.id)} disabled={isLoading}>
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{todo.title}</span>
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
        </Tabs>

        {tab === "new-todo" && (
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
