"use client";

import { Bookmark } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <span className="font-heading text-lg font-bold tracking-[-0.03em]">SaveIt</span>
      </div>
      <WorkspaceSwitcher />
    </header>
  );
}
