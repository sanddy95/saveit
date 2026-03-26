"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceContext } from "@/contexts/workspace-context";

export default function BoardsRedirect() {
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspaceContext();

  useEffect(() => {
    if (currentWorkspaceId) {
      router.replace(`/workspaces/${currentWorkspaceId}/boards`);
    }
  }, [currentWorkspaceId, router]);

  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      {currentWorkspaceId ? "Redirecting..." : "Please select a workspace first."}
    </div>
  );
}
