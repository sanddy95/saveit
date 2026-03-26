"use client";

import { Bookmark } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold">SaveIt</span>
      </div>
      <WorkspaceSwitcher />
    </header>
  );
}
