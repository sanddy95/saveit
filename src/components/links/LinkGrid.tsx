"use client";

import { Link2 } from "lucide-react";
import { LinkCard } from "./LinkCard";
import { LinkCardSkeleton } from "./LinkCardSkeleton";
import type { SavedLink } from "@/hooks/use-links";

interface LinkGridProps {
  links: SavedLink[];
  isLoading: boolean;
  onEdit: (link: SavedLink) => void;
  onDelete: (id: string) => void;
}

export function LinkGrid({ links, isLoading, onEdit, onDelete }: LinkGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <LinkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Link2 className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No saved links yet</p>
        <p className="text-sm mt-1">
          Save a link by pasting a URL above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
