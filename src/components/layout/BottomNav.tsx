"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceContext } from "@/contexts/workspace-context";

export function BottomNav() {
  const pathname = usePathname();
  const { currentWorkspaceId } = useWorkspaceContext();

  const wsPrefix = currentWorkspaceId
    ? `/workspaces/${currentWorkspaceId}`
    : "";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: wsPrefix ? `${wsPrefix}/todos` : "/todos",
      label: "Todos",
      icon: CheckSquare,
    },
    {
      href: wsPrefix ? `${wsPrefix}/boards` : "/boards",
      label: "Boards",
      icon: Kanban,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "fill-primary/20")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
