import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedLinkInput } from "@/lib/validators";

export interface SavedLink {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  siteName: string | null;
  favicon: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  workspace?: { id: string; name: string; color: string | null };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

export function useLinks(workspaceId: string | null, search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const qs = params.toString();

  return useQuery<SavedLink[]>({
    queryKey: ["links", workspaceId, search],
    queryFn: () =>
      fetchJson(
        `/api/workspaces/${workspaceId}/links${qs ? `?${qs}` : ""}`
      ),
    enabled: !!workspaceId,
  });
}

export function useRecentLinks() {
  return useQuery<SavedLink[]>({
    queryKey: ["dashboard", "recent-links"],
    queryFn: () => fetchJson("/api/dashboard/links"),
  });
}

export function useCreateLink(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SavedLinkInput) =>
      fetchJson<SavedLink>(`/api/workspaces/${workspaceId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateLink(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string; title?: string; description?: string }) =>
      fetchJson<SavedLink>(
        `/api/workspaces/${workspaceId}/links/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["links", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteLink(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) =>
      fetchJson(`/api/workspaces/${workspaceId}/links/${linkId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links", workspaceId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export interface UrlMetadata {
  title: string;
  description: string;
  thumbnail: string;
  siteName: string;
  favicon: string;
}

export function useFetchMetadata() {
  return useMutation({
    mutationFn: (url: string) =>
      fetchJson<UrlMetadata>("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }),
  });
}
