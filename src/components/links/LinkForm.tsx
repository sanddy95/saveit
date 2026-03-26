"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { savedLinkSchema } from "@/lib/validators";
import { Loader2, Globe, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFetchMetadata } from "@/hooks/use-links";
import type { SavedLink, UrlMetadata } from "@/hooks/use-links";

type LinkFormValues = z.output<typeof savedLinkSchema>;

interface LinkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: SavedLink | null;
  onSubmit: (data: LinkFormValues) => void;
  isLoading?: boolean;
}

export function LinkForm({
  open,
  onOpenChange,
  link,
  onSubmit,
  isLoading,
}: LinkFormProps) {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const fetchMetadata = useFetchMetadata();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(savedLinkSchema) as never,
    values: link
      ? {
          url: link.url,
          title: link.title || "",
          description: link.description || "",
        }
      : {
          url: "",
          title: "",
          description: "",
        },
  });

  const urlValue = watch("url");

  // Reset metadata when dialog closes or link changes
  useEffect(() => {
    if (!open) {
      setMetadata(null);
    } else if (link) {
      setMetadata({
        title: link.title || "",
        description: link.description || "",
        thumbnail: link.thumbnail || "",
        siteName: link.siteName || "",
        favicon: link.favicon || "",
      });
    }
  }, [open, link]);

  const handleFetchMetadata = useCallback(
    async (url: string) => {
      if (!url) return;
      try {
        new URL(url);
      } catch {
        return;
      }

      const result = await fetchMetadata.mutateAsync(url);
      setMetadata(result);

      // Auto-fill title and description if not already set by user
      if (result.title && !link) {
        setValue("title", result.title);
      }
      if (result.description && !link) {
        setValue("description", result.description);
      }
    },
    [fetchMetadata, link, setValue]
  );

  const handleUrlBlur = () => {
    if (urlValue && !link) {
      handleFetchMetadata(urlValue);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted && !link) {
      // Small delay to let the form update
      setTimeout(() => handleFetchMetadata(pasted), 100);
    }
  };

  const handleFormSubmit = (data: LinkFormValues) => {
    onSubmit(data);
    reset();
    setMetadata(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{link ? "Edit Link" : "Save Link"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              {...register("url")}
              onBlur={handleUrlBlur}
              onPaste={handleUrlPaste}
              disabled={!!link}
            />
            {errors.url && (
              <p className="text-xs text-destructive">
                {errors.url.message}
              </p>
            )}
          </div>

          {/* Metadata preview / loading */}
          {fetchMetadata.isPending && (
            <div className="flex items-center gap-2 rounded-md border p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Fetching page info...
              </span>
            </div>
          )}

          {metadata && !fetchMetadata.isPending && (
            <div className="overflow-hidden rounded-md border">
              {metadata.thumbnail ? (
                <img
                  src={metadata.thumbnail}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-20 items-center justify-center bg-muted">
                  <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-2 border-t bg-muted/50">
                {metadata.favicon ? (
                  <img src={metadata.favicon} alt="" className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {metadata.siteName}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Page title (auto-filled)"
              {...register("title")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Brief description (auto-filled)"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : link ? "Update" : "Save Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
