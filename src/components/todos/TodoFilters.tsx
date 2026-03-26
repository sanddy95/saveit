"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TodoFiltersProps {
  status: string;
  priority: string;
  sort: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onSortChange: (sort: string) => void;
}

export function TodoFilters({
  status,
  priority,
  sort,
  onStatusChange,
  onPriorityChange,
  onSortChange,
}: TodoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={status} onValueChange={onStatusChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={priority} onValueChange={onPriorityChange}>
          <TabsList>
            <TabsTrigger value="">Any</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
            <TabsTrigger value="medium">Med</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="flex h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="createdAt">Newest first</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}
