"use client";

import { useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import type {
  BoardDetail,
  KanbanColumnData,
  KanbanCardData,
} from "@/hooks/use-boards";
import type { AddCardInput, ReorderInput } from "@/lib/validators";

interface KanbanBoardProps {
  board: BoardDetail;
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
  onReorder: (data: ReorderInput) => void;
  isUpdateColumnLoading?: boolean;
  isAddCardLoading?: boolean;
}

export function KanbanBoard({
  board,
  workspaceId,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onDeleteCard,
  onReorder,
  isUpdateColumnLoading,
  isAddCardLoading,
}: KanbanBoardProps) {
  const qc = useQueryClient();
  const boardKey = ["board", workspaceId, board.id];

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type } = result;

      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const prev = qc.getQueryData<BoardDetail>(boardKey);
      if (!prev) return;

      if (type === "column") {
        const newColumns = [...prev.columns];
        const [moved] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, moved);

        const updatedColumns = newColumns.map((col, i) => ({
          ...col,
          position: i,
        }));

        qc.setQueryData<BoardDetail>(boardKey, {
          ...prev,
          columns: updatedColumns,
        });

        onReorder({
          columns: updatedColumns.map((c) => ({
            id: c.id,
            position: c.position,
          })),
        });
      } else {
        const sourceCol = prev.columns.find(
          (c) => c.id === source.droppableId
        );
        const destCol = prev.columns.find(
          (c) => c.id === destination.droppableId
        );
        if (!sourceCol || !destCol) return;

        if (source.droppableId === destination.droppableId) {
          const newCards = [...sourceCol.cards];
          const [moved] = newCards.splice(source.index, 1);
          newCards.splice(destination.index, 0, moved);

          const updatedCards = newCards.map((card, i) => ({
            ...card,
            position: i,
          }));

          qc.setQueryData<BoardDetail>(boardKey, {
            ...prev,
            columns: prev.columns.map((col) =>
              col.id === sourceCol.id
                ? { ...col, cards: updatedCards }
                : col
            ),
          });

          onReorder({
            cards: updatedCards.map((c) => ({
              id: c.id,
              columnId: sourceCol.id,
              position: c.position,
            })),
          });
        } else {
          const sourceCards = [...sourceCol.cards];
          const destCards = [...destCol.cards];
          const [moved] = sourceCards.splice(source.index, 1);
          destCards.splice(destination.index, 0, {
            ...moved,
            columnId: destCol.id,
          });

          const updatedSourceCards = sourceCards.map((card, i) => ({
            ...card,
            position: i,
          }));
          const updatedDestCards = destCards.map((card, i) => ({
            ...card,
            position: i,
          }));

          qc.setQueryData<BoardDetail>(boardKey, {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === sourceCol.id)
                return { ...col, cards: updatedSourceCards };
              if (col.id === destCol.id)
                return { ...col, cards: updatedDestCards };
              return col;
            }),
          });

          onReorder({
            cards: [
              ...updatedSourceCards.map((c) => ({
                id: c.id,
                columnId: sourceCol.id,
                position: c.position,
              })),
              ...updatedDestCards.map((c) => ({
                id: c.id,
                columnId: destCol.id,
                position: c.position,
              })),
            ],
          });
        }
      }
    },
    [board.id, boardKey, onReorder, qc]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="column" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ minHeight: "calc(100vh - 180px)" }}
          >
            {board.columns.map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                index={index}
                workspaceId={workspaceId}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
                onAddCard={onAddCard}
                onDeleteCard={onDeleteCard}
                isUpdateLoading={isUpdateColumnLoading}
                isAddCardLoading={isAddCardLoading}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
