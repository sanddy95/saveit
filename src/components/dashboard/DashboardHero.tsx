"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Link2, LayoutGrid, CalendarCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompletionRing } from "./CompletionRing";
import { useDashboardStats } from "@/hooks/use-todos";
import { useWorkspaceContext } from "@/contexts/workspace-context";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const { data: session } = useSession();
  const { data: stats } = useDashboardStats();
  const { currentWorkspaceId } = useWorkspaceContext();
  const router = useRouter();
  const name = session?.user?.name?.split(" ")[0] || "there";
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side — greeting + actions */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
              {getGreeting()}, {name}
            </h1>
            <p className="text-muted-foreground mt-1">{today}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/todos` : "/todos")}
            >
              <Plus className="h-3.5 w-3.5" />
              New Todo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/links` : "/links")}
            >
              <Link2 className="h-3.5 w-3.5" />
              New Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => router.push(currentWorkspaceId ? `/workspaces/${currentWorkspaceId}/boards` : "/boards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              New Board
            </Button>
          </div>
        </div>

        {/* Right side — stats */}
        <div className="flex items-center gap-5">
          <CompletionRing
            completed={stats?.completedToday || 0}
            total={stats?.totalTodosToday || 0}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none">
                  {stats?.dueToday || 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Due Today</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${(stats?.overdue || 0) > 0 ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30" : "bg-card/80"}`}>
              <AlertTriangle className={`h-4 w-4 ${(stats?.overdue || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none ${(stats?.overdue || 0) > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {stats?.overdue || 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
