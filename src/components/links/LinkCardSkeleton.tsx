"use client";

export function LinkCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 w-3/4 rounded bg-muted" />
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-2/3 rounded bg-muted" />
        </div>
        {/* Footer */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
