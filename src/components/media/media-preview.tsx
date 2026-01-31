/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import type { PostMedia } from "@/lib/models/post";
import { getImageObjectUrl, getVideoUrl } from "@/lib/storage/media";
import { cn } from "@/lib/utils";

export function MediaPreview({
  media,
  className,
  mode = "cover",
}: {
  media: PostMedia;
  className?: string;
  mode?: "cover" | "contain";
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        if (media.kind === "image") {
          objectUrl = await getImageObjectUrl(media.storagePath);
          if (active) setUrl(objectUrl);
        } else {
          const downloadUrl = await getVideoUrl(media.storagePath);
          if (active) setUrl(downloadUrl);
        }
      } catch (error) {
        console.error("Failed to load media", error);
      }
    };

    load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media]);

  if (!url) {
    return (
      <div
        className={cn(
          "flex h-48 w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground",
          className
        )}
      >
        Loading media...
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <video
        className={cn("h-56 w-full rounded-2xl", className)}
        controls
        src={url}
      />
    );
  }

  return (
    <img
      src={url}
      alt="Memorial media"
      className={cn(
        "h-56 w-full rounded-2xl",
        mode === "cover" ? "object-cover" : "object-contain",
        className
      )}
    />
  );
}
