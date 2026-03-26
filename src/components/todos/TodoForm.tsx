"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { todoSchema, type TodoInput } from "@/lib/validators";

// Use the output type (with defaults resolved) for the form
type TodoFormValues = z.output<typeof todoSchema>;
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
import type { Todo } from "@/hooks/use-todos";

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  onSubmit: (data: TodoInput) => void;
  isLoading?: boolean;
}

export function TodoForm({
  open,
  onOpenChange,
  todo,
  onSubmit,
  isLoading,
}: TodoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema) as never,
    values: todo
      ? {
          title: todo.title,
          description: todo.description || "",
          priority: todo.priority as "low" | "medium" | "high",
          dueDate: todo.dueDate
            ? new Date(todo.dueDate).toISOString().split("T")[0]
            : "",
          reminderAt: todo.reminderAt
            ? new Date(todo.reminderAt).toISOString().slice(0, 16)
            : "",
        }
      : {
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          reminderAt: "",
        },
  });

  const handleFormSubmit = (data: TodoFormValues) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "Edit Todo" : "Create Todo"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

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
            <Input
              id="reminderAt"
              type="datetime-local"
              {...register("reminderAt")}
            />
          </div>

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
