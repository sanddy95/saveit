"use client";

import { useState, useEffect } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/contexts/workspace-context";

export function WorkspaceSwitcher() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { currentWorkspaceId, setCurrentWorkspace } = useWorkspaceContext();
  const createWorkspace = useCreateWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspace(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace]);

  const current = workspaces?.find((ws) => ws.id === currentWorkspaceId);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const ws = await createWorkspace.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });
    setCurrentWorkspace(ws.id);
    setDialogOpen(false);
    setName("");
    setDescription("");
    setColor("#6366f1");
  };

  if (isLoading) {
    return (
      <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{
                backgroundColor: current?.color || "#6366f1",
              }}
            />
            <span className="truncate">
              {current?.name || "Select workspace"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {workspaces?.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              className="gap-2"
              onClick={() => setCurrentWorkspace(ws.id)}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: ws.color || "#6366f1" }}
              />
              <span>{ws.name}</span>
            </DropdownMenuItem>
          ))}
          {workspaces && workspaces.length === 0 && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No workspaces yet
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Create workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                placeholder="My workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-desc">Description</Label>
              <Input
                id="ws-desc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="ws-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-input"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={createWorkspace.isPending || !name.trim()}
            >
              {createWorkspace.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
