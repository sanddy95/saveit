"use client";

import { formatDistanceToNow, isPast } from "date-fns";
import { CalendarClock, CheckSquare, Globe } from "lucide-react";
import { useUpcomingTodos } from "@/hooks/use-todos";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
};

export function UpcomingTodos() {
  const { data: todos, isLoading } = useUpcomingTodos();
  const completed = todos?.filter((t) => t.completed).length || 0;
  const total = todos?.length || 0;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-heading tracking-[-0.03em]">
          <CalendarClock className="h-4 w-4 text-primary" />
          Upcoming Todos
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !todos || todos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todos.map((todo, i) => {
                const overdue = todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate));
                const color = priorityColors[todo.priority] || priorityColors.medium;
                return (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent/50 transition-colors group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Priority strip */}
                    <div className={cn("w-1 h-8 rounded-full shrink-0", color)} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-sm font-medium truncate", todo.completed && "line-through opacity-60")}>
                          {todo.title}
                        </p>
                        {todo.url && todo.favicon && (
                          <img src={todo.favicon} alt="" className="h-3.5 w-3.5 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                      {todo.workspace && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: todo.workspace.color || "#6366f1" }} />
                          <span className="text-[10px] text-muted-foreground">{todo.workspace.name}</span>
                        </div>
                      )}
                    </div>

                    {todo.dueDate && (
                      <span className={cn(
                        "text-[10px] shrink-0",
                        overdue ? "text-red-500 font-medium" : "text-muted-foreground"
                      )}>
                        {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
