"use client";

import { Draggable } from "@hello-pangea/dnd";
import {
  CheckSquare,
  Link2,
  MoreVertical,
  Trash2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { isPast } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanCardData } from "@/hooks/use-boards";

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  medium: {
    label: "Med",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  high: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
};

interface KanbanCardProps {
  card: KanbanCardData;
  index: number;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({ card, index, onDelete }: KanbanCardProps) {
  const isTodo = !!card.todo;
  const isLink = !!card.savedLink;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group rounded-md border bg-card p-3 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-lg rotate-2"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isTodo && card.todo && (
                <TodoCardContent todo={card.todo} />
              )}
              {isLink && card.savedLink && (
                <LinkCardContent link={card.savedLink} />
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center h-6 w-6 rounded hover:bg-accent">
                <MoreVertical className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(card.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {isTodo ? (
              <CheckSquare className="h-3 w-3" />
            ) : (
              <Link2 className="h-3 w-3" />
            )}
            <span>{isTodo ? "Todo" : "Link"}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function TodoCardContent({
  todo,
}: {
  todo: NonNullable<KanbanCardData["todo"]>;
}) {
  const priority = priorityConfig[todo.priority] || priorityConfig.medium;
  const isOverdue =
    todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate));

  return (
    <div className="space-y-1.5">
      <p
        className={cn(
          "text-sm font-medium leading-tight",
          todo.completed && "line-through opacity-60"
        )}
      >
        {todo.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
            priority.className
          )}
        >
          {priority.label}
        </span>
        {todo.dueDate && (
          <span
            className={cn(
              "text-[10px]",
              isOverdue
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

function LinkCardContent({
  link,
}: {
  link: NonNullable<KanbanCardData["savedLink"]>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        {link.favicon ? (
          <img
            src={link.favicon}
            alt=""
            className="h-4 w-4 mt-0.5 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {link.title || link.url}
        </p>
      </div>
      {link.siteName && (
        <p className="text-[10px] text-muted-foreground truncate">
          {link.siteName}
        </p>
      )}
      <button
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          window.open(link.url, "_blank", "noopener,noreferrer");
        }}
      >
        <ExternalLink className="h-3 w-3" />
        Open
      </button>
    </div>
  );
}
