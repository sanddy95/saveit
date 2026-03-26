"use client";

import { useState } from "react";
import { Plus, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useWorkspaces,
  useCreateWorkspace,
  useDeleteWorkspace,
} from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import Link from "next/link";

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const { setCurrentWorkspace } = useWorkspaceContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : !workspaces || workspaces.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No workspaces yet</p>
          <p className="text-sm">
            Create your first workspace to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card key={ws.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: ws.color || "#6366f1" }}
                  />
                  <CardTitle>{ws.name}</CardTitle>
                </div>
                {ws.description && (
                  <CardDescription>{ws.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {ws._count.members}{" "}
                    {ws._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Link
                  href={`/workspaces/${ws.id}/todos`}
                  onClick={() => setCurrentWorkspace(ws.id)}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-all"
                >
                  Open
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this workspace?")) {
                      deleteWorkspace.mutate(ws.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
