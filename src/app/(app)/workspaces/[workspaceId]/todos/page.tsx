"use client";

import { useState, use } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodoList } from "@/components/todos/TodoList";
import { TodoForm } from "@/components/todos/TodoForm";
import { TodoFilters } from "@/components/todos/TodoFilters";
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  type Todo,
  type TodoFilters as Filters,
} from "@/hooks/use-todos";
import type { TodoInput } from "@/lib/validators";

export default function WorkspaceTodosPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    priority: "",
    sort: "createdAt",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const { data: todos, isLoading } = useTodos(workspaceId, filters);
  const createTodo = useCreateTodo(workspaceId);
  const updateTodo = useUpdateTodo(workspaceId);
  const deleteTodo = useDeleteTodo(workspaceId);

  const handleCreate = (data: TodoInput) => {
    createTodo.mutate(data);
  };

  const handleUpdate = (data: TodoInput) => {
    if (!editingTodo) return;
    updateTodo.mutate({ id: editingTodo.id, ...data });
    setEditingTodo(null);
  };

  const handleToggle = (id: string, completed: boolean) => {
    updateTodo.mutate({ id, completed });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this todo?")) {
      deleteTodo.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos</h1>
        <Button
          onClick={() => {
            setEditingTodo(null);
            setFormOpen(true);
          }}
          className="hidden gap-2 sm:flex"
        >
          <Plus className="h-4 w-4" />
          Add Todo
        </Button>
      </div>

      <TodoFilters
        status={filters.status || "all"}
        priority={filters.priority || ""}
        sort={filters.sort || "createdAt"}
        onStatusChange={(status) => setFilters((f) => ({ ...f, status }))}
        onPriorityChange={(priority) =>
          setFilters((f) => ({ ...f, priority }))
        }
        onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : (
        <TodoList
          todos={todos || []}
          onToggle={handleToggle}
          onEdit={(todo) => {
            setEditingTodo(todo);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Mobile FAB */}
      <Button
        onClick={() => {
          setEditingTodo(null);
          setFormOpen(true);
        }}
        size="icon"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TodoForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTodo(null);
        }}
        todo={editingTodo}
        onSubmit={editingTodo ? handleUpdate : handleCreate}
        isLoading={createTodo.isPending || updateTodo.isPending}
      />
    </div>
  );
}
