"use client";

import { Link2, Globe, ImageOff } from "lucide-react";
import { useRecentLinks } from "@/hooks/use-links";
import { useState } from "react";

export function RecentLinks() {
  const { data: links, isLoading } = useRecentLinks();

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms" }}>
      <div className="p-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
          <Link2 className="h-4 w-4 text-primary" />
          Recent Links
        </h2>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !links || links.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No saved links yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {links.slice(0, 4).map((link) => (
                <LinkMiniCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkMiniCard({ link }: { link: { id: string; url: string; title: string | null; thumbnail: string | null; favicon: string | null; siteName: string | null } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      <div className="h-16 bg-muted overflow-hidden">
        {link.thumbnail && !imgError ? (
          <img src={link.thumbnail} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <ImageOff className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-1">{link.title || link.url}</p>
        <div className="flex items-center gap-1 mt-1">
          {link.favicon ? (
            <img src={link.favicon} alt="" className="h-3 w-3 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {link.siteName || (() => { try { return new URL(link.url).hostname; } catch { return link.url; } })()}
          </span>
        </div>
      </div>
    </a>
  );
}
