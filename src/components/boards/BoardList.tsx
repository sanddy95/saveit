"use client";

import { LayoutGrid, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BoardSummary } from "@/hooks/use-boards";

interface BoardListProps {
  boards: BoardSummary[];
  isLoading: boolean;
  onOpen: (board: BoardSummary) => void;
  onEdit: (board: BoardSummary) => void;
  onDelete: (id: string) => void;
}

export function BoardList({
  boards,
  isLoading,
  onOpen,
  onEdit,
  onDelete,
}: BoardListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No boards yet</p>
        <p className="text-sm">Create your first board to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <div
          key={board.id}
          className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer"
          onClick={() => onOpen(board)}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(board);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(board.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg leading-tight pr-8">
              {board.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{board.columnCount} columns</span>
              <span>{board.cardCount} cards</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated{" "}
              {formatDistanceToNow(new Date(board.updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
