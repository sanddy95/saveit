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
