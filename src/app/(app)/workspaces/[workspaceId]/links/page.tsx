"use client";

import { useState, use } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkGrid } from "@/components/links/LinkGrid";
import { LinkForm } from "@/components/links/LinkForm";
import {
  useLinks,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
  type SavedLink,
} from "@/hooks/use-links";
import type { SavedLinkInput } from "@/lib/validators";

export default function WorkspaceLinksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null);

  const { data: links, isLoading } = useLinks(workspaceId, search);
  const createLink = useCreateLink(workspaceId);
  const updateLink = useUpdateLink(workspaceId);
  const deleteLink = useDeleteLink(workspaceId);

  const handleCreate = (data: SavedLinkInput) => {
    createLink.mutate(data);
  };

  const handleUpdate = (data: SavedLinkInput) => {
    if (!editingLink) return;
    updateLink.mutate({
      id: editingLink.id,
      title: data.title,
      description: data.description,
    });
    setEditingLink(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this link?")) {
      deleteLink.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saved Links</h1>
        <Button
          onClick={() => {
            setEditingLink(null);
            setFormOpen(true);
          }}
          className="hidden gap-2 sm:flex"
        >
          <Plus className="h-4 w-4" />
          Save Link
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search links by title or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <LinkGrid
        links={links || []}
        isLoading={isLoading}
        onEdit={(link) => {
          setEditingLink(link);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* Mobile FAB */}
      <Button
        onClick={() => {
          setEditingLink(null);
          setFormOpen(true);
        }}
        size="icon"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <LinkForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLink(null);
        }}
        link={editingLink}
        onSubmit={editingLink ? handleUpdate : handleCreate}
        isLoading={createLink.isPending || updateLink.isPending}
      />
    </div>
  );
}
