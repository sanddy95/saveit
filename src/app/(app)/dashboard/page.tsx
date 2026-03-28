"use client";

import { Suspense } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UpcomingTodos } from "@/components/dashboard/UpcomingTodos";
import { RecentBoards } from "@/components/dashboard/RecentBoards";
import { ShareToast } from "@/components/ShareToast";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <ShareToast />
      </Suspense>
      <DashboardHero />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingTodos />
        <RecentBoards />
      </div>
    </div>
  );
}
