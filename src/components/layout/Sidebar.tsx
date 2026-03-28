"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  LogOut,
  Bookmark,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useWorkspaceContext } from "@/contexts/workspace-context";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const { currentWorkspaceId } = useWorkspaceContext();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

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
    { href: "/workspaces", label: "Workspaces", icon: FolderOpen },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 p-4">
        <Bookmark className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">SaveIt</span>
      </div>

      <Separator />

      {/* Workspace switcher */}
      <div className="p-3">
        <WorkspaceSwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User menu */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
