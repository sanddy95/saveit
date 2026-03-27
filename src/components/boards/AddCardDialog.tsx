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

  const { data: todos } = useTodos(workspaceId, { status: "active" });
  const { data: links } = useLinks(workspaceId);

  const [todoTitle, setTodoTitle] = useState("");
  const [todoPriority, setTodoPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const handleSubmit = () => {
    if (tab === "existing-todo") return;
    if (tab === "existing-link") return;

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
