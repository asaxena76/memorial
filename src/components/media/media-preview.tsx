/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import type { PostMedia } from "@/lib/models/post";
import { getImageUrl, getVideoUrl } from "@/lib/storage/media";
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

    const load = async () => {
      try {
        if (media.kind === "image") {
          const path = media.thumbnailPath || media.storagePath;
          const downloadUrl = await getImageUrl(path);
          if (active) setUrl(downloadUrl);
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
        preload="metadata"
        src={url}
      />
    );
  }

  return (
    <img
      src={url}
      alt="Memorial media"
      loading="lazy"
      decoding="async"
      className={cn(
        "h-56 w-full rounded-2xl",
        mode === "cover" ? "object-cover" : "object-contain",
        className
      )}
    />
  );
}
