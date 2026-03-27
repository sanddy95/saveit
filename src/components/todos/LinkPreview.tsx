"use client";

import { X, ExternalLink, Globe } from "lucide-react";

interface LinkPreviewProps {
  url: string;
  thumbnail?: string | null;
  siteName?: string | null;
  favicon?: string | null;
  onRemove?: () => void;
  compact?: boolean;
}

export function LinkPreview({
  url,
  thumbnail,
  siteName,
  favicon,
  onRemove,
  compact,
}: LinkPreviewProps) {
  let displayUrl = url;
  try {
    displayUrl = new URL(url).hostname;
  } catch {}

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {favicon ? (
          <img src={favicon} alt="" className="h-3.5 w-3.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
        <span className="truncate max-w-[150px]">{siteName || displayUrl}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="h-14 w-20 rounded object-cover shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="h-14 w-20 rounded bg-muted flex items-center justify-center shrink-0">
          <Globe className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {favicon ? (
            <img src={favicon} alt="" className="h-4 w-4 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {siteName || displayUrl}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">{url}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-muted hover:bg-destructive/10 flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
