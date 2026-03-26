import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TodoInput } from "@/lib/validators";

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  reminderAt: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  workspace?: { id: string; name: string; color: string | null };
}

export interface TodoFilters {
  status?: string;
  priority?: string;
  sort?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

export function useTodos(workspaceId: string | null, filters?: TodoFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.sort) params.set("sort", filters.sort);
  const qs = params.toString();

  return useQuery<Todo[]>({
    queryKey: ["todos", workspaceId, filters],
    queryFn: () =>
      fetchJson(`/api/workspaces/${workspaceId}/todos${qs ? `?${qs}` : ""}`),
    enabled: !!workspaceId,
  });
}

export function useUpcomingTodos() {
  return useQuery<Todo[]>({
    queryKey: ["dashboard", "upcoming-todos"],
    queryFn: () => fetchJson("/api/dashboard/todos"),
  });
}

export function useCreateTodo(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TodoInput) =>
      fetchJson<Todo>(`/api/workspaces/${workspaceId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTodo(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<TodoInput> & { id: string; completed?: boolean }) =>
      fetchJson<Todo>(`/api/workspaces/${workspaceId}/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onMutate: async (updated) => {
      await qc.cancelQueries({ queryKey: ["todos", workspaceId] });
      const prev = qc.getQueryData<Todo[]>(["todos", workspaceId]);
      qc.setQueriesData<Todo[]>(
        { queryKey: ["todos", workspaceId] },
        (old) =>
          old?.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueriesData(
          { queryKey: ["todos", workspaceId] },
          context.prev
        );
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTodo(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) =>
      fetchJson(`/api/workspaces/${workspaceId}/todos/${todoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
