"use client";

import Link from "next/link";
import { LayoutGrid, Columns3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardBoards, type DashboardBoard } from "@/hooks/use-boards";

export function RecentBoards() {
  const { data: boards, isLoading } = useDashboardBoards();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Recent Boards
        </h2>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        Recent Boards
      </h2>

      {!boards || boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Columns3 className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No boards yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {boards.map((board: DashboardBoard) => (
            <Link
              key={board.id}
              href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {board.workspace.color && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: board.workspace.color }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{board.name}</p>
                <p className="text-xs text-muted-foreground">
                  {board.columnCount} columns &middot; {board.cardCount} cards
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(board.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
