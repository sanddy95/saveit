"use client";

import { WorkspaceProvider } from "@/contexts/workspace-context";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="md:hidden">
            <TopBar />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
