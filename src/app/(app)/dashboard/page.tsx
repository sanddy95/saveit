"use client";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UpcomingTodos } from "@/components/dashboard/UpcomingTodos";
import { RecentLinks } from "@/components/dashboard/RecentLinks";
import { RecentBoards } from "@/components/dashboard/RecentBoards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHero />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingTodos />
        <RecentLinks />
        <RecentBoards />
      </div>
    </div>
  );
}
