"use client";

import { useState } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnSettingsDialog } from "./ColumnSettingsDialog";
import type { KanbanColumnData } from "@/hooks/use-boards";

interface KanbanColumnHeaderProps {
  column: KanbanColumnData;
  onUpdate: (data: {
    columnId: string;
    name?: string;
    color?: string | null;
    icon?: string | null;
  }) => void;
  onDelete: (columnId: string) => void;
  isUpdateLoading?: boolean;
}

export function KanbanColumnHeader({
  column,
  onUpdate,
  onDelete,
  isUpdateLoading,
}: KanbanColumnHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== column.name) {
      onUpdate({ columnId: column.id, name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          {column.color && (
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          {isEditing ? (
            <input
              className="text-sm font-semibold bg-transparent border-b border-primary outline-none w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(column.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold truncate">{column.name}</h3>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {column.cards.length}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded hover:bg-accent">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(column.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ColumnSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        column={column}
        onSave={(data) =>
          onUpdate({
            columnId: column.id,
            name: data.name,
            color: data.color,
            icon: data.icon,
          })
        }
        isLoading={isUpdateLoading}
      />
    </>
  );
}
