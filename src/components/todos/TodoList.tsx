"use client";

import { TodoItem } from "./TodoItem";
import type { Todo } from "@/hooks/use-todos";
import { CheckSquare } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, onToggle, onEdit, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckSquare className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No todos yet</p>
        <p className="text-sm">Create your first todo to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
