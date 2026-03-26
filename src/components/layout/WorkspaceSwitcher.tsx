"use client";

import { useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Skeleton UI — will be wired up with real data in Phase 2
const mockWorkspaces = [{ id: "1", name: "Personal", color: "#6366f1" }];

export function WorkspaceSwitcher() {
  const [current] = useState(mockWorkspaces[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: current.color }}
          />
          <span className="truncate">{current.name}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {mockWorkspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} className="gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: ws.color }}
            />
            <span>{ws.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Create workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
