"use client";

import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KanbanColumnHeader } from "./KanbanColumnHeader";
import { KanbanCard } from "./KanbanCard";
import { AddCardDialog } from "./AddCardDialog";
import type { KanbanColumnData } from "@/hooks/use-boards";
import type { AddCardInput } from "@/lib/validators";

interface KanbanColumnProps {
  column: KanbanColumnData;
  index: number;
  workspaceId: string;
  onUpdateColumn: (data: {
    columnId: string;
    name?: string;
    color?: string | null;
    icon?: string | null;
  }) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (data: AddCardInput) => void;
  onDeleteCard: (cardId: string) => void;
  onEditCard?: (card: import("@/hooks/use-boards").KanbanCardData) => void;
  isUpdateLoading?: boolean;
  isAddCardLoading?: boolean;
}

export function KanbanColumn({
  column,
  index,
  workspaceId,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onDeleteCard,
  onEditCard,
  isUpdateLoading,
  isAddCardLoading,
}: KanbanColumnProps) {
  const [addCardOpen, setAddCardOpen] = useState(false);

  const handleDeleteColumn = () => {
    if (column.cards.length > 0) {
      alert("Cannot delete column with cards. Move or remove cards first.");
      return;
    }
    if (confirm(`Delete column "${column.name}"?`)) {
      onDeleteColumn(column.id);
    }
  };

  return (
    <Draggable draggableId={`column-${column.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72"
        >
          <div
            className="flex flex-col rounded-lg bg-muted/50 border"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <div {...provided.dragHandleProps} className="p-3 pb-0">
              <KanbanColumnHeader
                column={column}
                onUpdate={onUpdateColumn}
                onDelete={handleDeleteColumn}
                isUpdateLoading={isUpdateLoading}
              />
            </div>

            <Droppable droppableId={column.id} type="card">
              {(dropProvided, dropSnapshot) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto px-3 py-1 space-y-2 min-h-[60px]",
                    dropSnapshot.isDraggingOver && "bg-primary/5 rounded-md"
                  )}
                >
                  {column.cards.length === 0 && !dropSnapshot.isDraggingOver && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Drop cards here
                    </p>
                  )}
                  {column.cards.map((card, cardIndex) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onDelete={onDeleteCard}
                      onEdit={onEditCard}
                    />
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>

            <div className="p-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setAddCardOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add card
              </Button>
            </div>
          </div>

          <AddCardDialog
            open={addCardOpen}
            onOpenChange={setAddCardOpen}
            columnId={column.id}
            workspaceId={workspaceId}
            onSubmit={onAddCard}
            isLoading={isAddCardLoading}
          />
        </div>
      )}
    </Draggable>
  );
}
