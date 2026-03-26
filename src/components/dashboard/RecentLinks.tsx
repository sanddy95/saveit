"use client";

import { Link2, ExternalLink, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRecentLinks } from "@/hooks/use-links";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export function RecentLinks() {
  const { data: links, isLoading } = useRecentLinks();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Recent Links
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
        ) : !links || links.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <Link2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No saved links yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-accent group"
              >
                {link.favicon ? (
                  <img
                    src={link.favicon}
                    alt=""
                    className="h-5 w-5 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {link.title || link.url}
                  </p>
                  {link.workspace && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            link.workspace.color || "#6366f1",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {link.workspace.name}
                      </span>
                    </div>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
