"use client";

import { useState } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Todo } from "@/hooks/use-todos";

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isChecking, setIsChecking] = useState(false);
  const priority = priorityConfig[todo.priority] || priorityConfig.medium;
  const isOverdue =
    todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate));

  const handleToggle = () => {
    setIsChecking(true);
    onToggle(todo.id, !todo.completed);
    setTimeout(() => setIsChecking(false), 300);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
        todo.completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isChecking}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          todo.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEdit(todo)}
      >
        <p
          className={cn(
            "text-sm font-medium",
            todo.completed && "line-through text-muted-foreground"
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {todo.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              "border-0 text-[10px] font-medium",
              priority.className
            )}
          >
            {priority.label}
          </Badge>
          {todo.dueDate && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                isOverdue && "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
              )}
            >
              {isOverdue ? "Overdue: " : ""}
              {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(todo)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(todo.id)}
            className="gap-2 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
