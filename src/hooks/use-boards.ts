"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BoardInput,
  ColumnInput,
  AddCardInput,
  ReorderInput,
} from "@/lib/validators";

// Types

export interface BoardSummary {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columnCount: number;
  cardCount: number;
}

export interface KanbanCardData {
  id: string;
  position: number;
  columnId: string;
  todoId: string | null;
  savedLinkId: string | null;
  createdAt: string;
  updatedAt: string;
  todo: {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    priority: string;
    dueDate: string | null;
  } | null;
  savedLink: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    siteName: string | null;
    favicon: string | null;
  } | null;
}

export interface KanbanColumnData {
  id: string;
  name: string;
  position: number;
  color: string | null;
  icon: string | null;
  boardId: string;
  cards: KanbanCardData[];
}

export interface BoardDetail {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumnData[];
}

export interface DashboardBoard {
  id: string;
  name: string;
  workspaceId: string;
  updatedAt: string;
  workspace: { id: string; name: string; color: string | null };
  columnCount: number;
  cardCount: number;
}

// Fetch helper (same pattern as use-todos.ts)

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

// Board hooks

export function useBoards(workspaceId: string | null) {
  return useQuery<BoardSummary[]>({
    queryKey: ["boards", workspaceId],
    queryFn: () =>
      fetchJson(`/api/workspaces/${workspaceId}/boards`),
    enabled: !!workspaceId,
  });
}

export function useBoard(workspaceId: string | null, boardId: string | null) {
  return useQuery<BoardDetail>({
    queryKey: ["board", workspaceId, boardId],
    queryFn: () =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`),
    enabled: !!workspaceId && !!boardId,
  });
}

export function useCreateBoard(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BoardInput) =>
      fetchJson<BoardDetail>(`/api/workspaces/${workspaceId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBoard(workspaceId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BoardInput) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteBoard(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDashboardBoards() {
  return useQuery<DashboardBoard[]>({
    queryKey: ["dashboard", "recent-boards"],
    queryFn: () => fetchJson("/api/dashboard/boards"),
  });
}

// Board mutations (columns, cards, reorder)

export function useBoardMutations(workspaceId: string, boardId: string) {
  const qc = useQueryClient();
  const boardKey = ["board", workspaceId, boardId];

  const createColumn = useMutation({
    mutationFn: (data: ColumnInput) =>
      fetchJson(`/api/workspaces/${workspaceId}/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const updateColumn = useMutation({
    mutationFn: ({
      columnId,
      ...data
    }: Partial<ColumnInput> & { columnId: string; position?: number }) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const addCard = useMutation({
    mutationFn: (data: AddCardInput) =>
      fetchJson<KanbanCardData>(
        `/api/workspaces/${workspaceId}/boards/${boardId}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
      qc.invalidateQueries({ queryKey: ["todos", workspaceId] });
      qc.invalidateQueries({ queryKey: ["links", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
    },
  });

  const reorder = useMutation({
    mutationFn: (data: ReorderInput) =>
      fetchJson(
        `/api/workspaces/${workspaceId}/boards/${boardId}/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
  });

  return {
    createColumn,
    updateColumn,
    deleteColumn,
    addCard,
    deleteCard,
    reorder,
  };
}
