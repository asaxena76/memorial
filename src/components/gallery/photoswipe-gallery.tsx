/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

import type { PostMedia } from "@/lib/models/post";
import { getImageUrl } from "@/lib/storage/media";
import { cn } from "@/lib/utils";

export type PhotoSwipeGalleryItem = {
  id: string;
  caption: string;
  media: PostMedia;
};

export function PhotoSwipeGallery({
  items,
  galleryId,
  className,
}: {
  items: PhotoSwipeGalleryItem[];
  galleryId: string;
  className?: string;
}) {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [sizeMap, setSizeMap] = useState<Record<string, [number, number]>>({});

  const imageItems = useMemo(
    () => items.filter((item) => item.media.kind === "image"),
    [items]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      const entries = await Promise.all(
        imageItems.map(async (item) => {
          const path = item.media.thumbnailPath || item.media.storagePath;
          const url = await getImageUrl(path);
          return [item.media.storagePath, url] as const;
        })
      );

      if (active) {
        setUrlMap(Object.fromEntries(entries));
      }
    };

    load().catch((error) => console.error("Failed to load gallery images", error));

    return () => {
      active = false;
    };
  }, [imageItems]);

  useEffect(() => {
    let active = true;

    const loadSizes = async () => {
      const pending = imageItems.filter((item) => {
        const url = urlMap[item.media.storagePath];
        return url && !sizeMap[item.media.storagePath];
      });
      if (pending.length === 0) return;

      const results = await Promise.all(
        pending.map((item) => {
          const url = urlMap[item.media.storagePath]!;
          return new Promise<[string, [number, number]]>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve([
                item.media.storagePath,
                [img.naturalWidth, img.naturalHeight],
              ]);
            };
            img.onerror = () => resolve([item.media.storagePath, [1600, 1600]]);
            img.src = url;
          });
        })
      );

      if (active) {
        setSizeMap((prev) => ({
          ...prev,
          ...Object.fromEntries(results),
        }));
      }
    };

    loadSizes().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [imageItems, urlMap, sizeMap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!galleryId) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: `#${galleryId}`,
      children: "a",
      pswpModule: () => import("photoswipe"),
    });

    lightbox.init();
    return () => {
      lightbox.destroy();
    };
  }, [galleryId, imageItems.length]);

  if (imageItems.length === 0) {
    return null;
  }

  return (
    <div
      id={galleryId}
      className={cn(
        "grid grid-cols-3 gap-6 sm:gap-8",
        className
      )}
    >
      {imageItems.map((item) => {
        const url = urlMap[item.media.storagePath];
        const size = sizeMap[item.media.storagePath];
        const width = size?.[0] ?? item.media.width ?? 1600;
        const height = size?.[1] ?? item.media.height ?? 1600;

        return (
          <a
            key={`${item.id}-${item.media.storagePath}`}
            href={url || "#"}
            data-pswp-width={width}
            data-pswp-height={height}
            data-pswp-title={item.caption}
            className={cn(
              "relative block aspect-square overflow-hidden bg-muted/20",
              url ? "cursor-zoom-in" : "pointer-events-none"
            )}
          >
            {url ? (
              <img
                src={url}
                alt={item.caption || "Memorial photo"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-muted/50" />
            )}
          </a>
        );
      })}
    </div>
  );
}
