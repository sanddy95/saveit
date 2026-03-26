"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Globe,
  MoreVertical,
  ImageOff,
} from "lucide-react";
// Button not needed since DropdownMenuTrigger renders directly
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SavedLink } from "@/hooks/use-links";

interface LinkCardProps {
  link: SavedLink;
  onEdit: (link: SavedLink) => void;
  onDelete: (id: string) => void;
}

export function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleCardClick = () => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {link.thumbnail && !imgError ? (
          <img
            src={link.thumbnail}
            alt={link.title || "Link thumbnail"}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(link.url, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(link);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(link.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">
          {link.title || link.url}
        </h3>

        {link.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {link.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {link.favicon ? (
              <img
                src={link.favicon}
                alt=""
                className="h-4 w-4 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {link.siteName || new URL(link.url).hostname}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {formatDistanceToNow(new Date(link.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
