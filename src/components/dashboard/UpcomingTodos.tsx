"use client";

import { format, formatDistanceToNow, isPast } from "date-fns";
import { CalendarClock, CheckSquare } from "lucide-react";
import { useUpcomingTodos } from "@/hooks/use-todos";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UpcomingTodos() {
  const { data: todos, isLoading } = useUpcomingTodos();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Upcoming Todos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : !todos || todos.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No upcoming todos with due dates.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => {
              const overdue =
                todo.dueDate && isPast(new Date(todo.dueDate));
              return (
                <div
                  key={todo.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {todo.title}
                    </p>
                    {todo.workspace && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              todo.workspace.color || "#6366f1",
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {todo.workspace.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {todo.dueDate && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px]",
                        overdue &&
                          "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
                      )}
                    >
                      {formatDistanceToNow(new Date(todo.dueDate), {
                        addSuffix: true,
                      })}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
