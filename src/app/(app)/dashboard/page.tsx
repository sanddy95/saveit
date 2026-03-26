"use client";

import { useSession } from "next-auth/react";
import { UpcomingTodos } from "@/components/dashboard/UpcomingTodos";
import { RecentLinks } from "@/components/dashboard/RecentLinks";

export default function DashboardPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
        <p className="text-muted-foreground">
          Your personal productivity hub for todos, links, and kanban boards.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingTodos />
        <RecentLinks />
      </div>
    </div>
  );
}
