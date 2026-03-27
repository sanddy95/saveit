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
