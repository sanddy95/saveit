"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardBoards, type DashboardBoard } from "@/hooks/use-boards";

export function RecentBoards() {
  const { data: boards, isLoading } = useDashboardBoards();

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms" }}>
      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Recent Boards
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !boards || boards.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <LayoutGrid className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No boards yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boards.map((board: DashboardBoard) => (
                <Link
                  key={board.id}
                  href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
                  className="block rounded-lg border p-3 hover:border-primary/50 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {board.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Column dots */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[...Array(Math.min(board.columnCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary/40"
                      />
                    ))}
                    {board.columnCount > 5 && (
                      <span className="text-[9px] text-muted-foreground">+{board.columnCount - 5}</span>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {board.cardCount} cards across {board.columnCount} columns
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
