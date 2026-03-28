"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/boards/KanbanBoard";
import { TodoForm } from "@/components/todos/TodoForm";
import { useBoard, useUpdateBoard, useBoardMutations, type KanbanCardData } from "@/hooks/use-boards";
import { useUpdateTodo, type Todo } from "@/hooks/use-todos";
import type { TodoInput } from "@/lib/validators";

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
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

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
  const updateTodo = useUpdateTodo(workspaceId);

  const handleRenameBoard = () => {
    if (editName.trim() && editName.trim() !== board?.name) {
      updateBoard.mutate({ name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleEditCard = (card: KanbanCardData) => {
    if (!card.todo) return;
    const t = card.todo;
    setEditingTodo({
      id: t.id,
      title: t.title,
      description: t.description,
      completed: t.completed,
      priority: t.priority,
      dueDate: t.dueDate,
      reminderAt: null,
      url: t.url,
      thumbnail: t.thumbnail,
      siteName: t.siteName,
      favicon: t.favicon,
      workspaceId,
      createdAt: "",
      updatedAt: "",
    });
    setEditFormOpen(true);
  };

  const handleUpdateTodo = (data: TodoInput) => {
    if (!editingTodo) return;
    updateTodo.mutate({ id: editingTodo.id, ...data });
    setEditingTodo(null);
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

      <KanbanBoard
        board={board}
        workspaceId={workspaceId}
        onUpdateColumn={(data) =>
          updateColumn.mutate({
            ...data,
            color: data.color ?? undefined,
            icon: data.icon ?? undefined,
          })
        }
        onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
        onAddCard={(data) => addCard.mutate(data)}
        onDeleteCard={(cardId) => {
          if (confirm("Remove this card from the board?")) {
            deleteCard.mutate(cardId);
          }
        }}
        onEditCard={handleEditCard}
        onReorder={(data) => reorder.mutate(data)}
        isUpdateColumnLoading={updateColumn.isPending}
        isAddCardLoading={addCard.isPending}
      />

      <TodoForm
        open={editFormOpen}
        onOpenChange={(open) => {
          setEditFormOpen(open);
          if (!open) setEditingTodo(null);
        }}
        todo={editingTodo}
        onSubmit={handleUpdateTodo}
        isLoading={updateTodo.isPending}
      />
    </div>
  );
}
