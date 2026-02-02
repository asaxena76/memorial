/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

import { cn } from "@/lib/utils";

export type StaticGalleryItem = {
  src: string;
  caption?: string;
  width?: number;
  height?: number;
};

export function StaticPhotoSwipeGallery({
  items,
  galleryId,
  className,
}: {
  items: StaticGalleryItem[];
  galleryId: string;
  className?: string;
}) {
  const [sizeMap, setSizeMap] = useState<Record<string, [number, number]>>({});
  const imageItems = useMemo(() => items.filter((item) => item.src), [items]);

  useEffect(() => {
    let active = true;

    const loadSizes = async () => {
      const pending = imageItems.filter((item) => !sizeMap[item.src]);
      if (pending.length === 0) return;

      const results = await Promise.all(
        pending.map(
          (item) =>
            new Promise<[string, [number, number]]>((resolve) => {
              const img = new Image();
              img.onload = () => {
                resolve([item.src, [img.naturalWidth, img.naturalHeight]]);
              };
              img.onerror = () => resolve([item.src, [1600, 1600]]);
              img.src = item.src;
            })
        )
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
  }, [imageItems, sizeMap]);

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
  }, [galleryId, items.length]);

  if (imageItems.length === 0) {
    return null;
  }

  return (
    <div
      id={galleryId}
      className={cn("grid grid-cols-3 gap-6 sm:gap-8", className)}
    >
      {imageItems.map((item) => {
        const size = sizeMap[item.src];
        const width = size?.[0] ?? item.width ?? 1600;
        const height = size?.[1] ?? item.height ?? 1600;

        return (
        <a
          key={item.src}
          href={item.src}
          data-pswp-width={width}
          data-pswp-height={height}
          data-pswp-title={item.caption ?? ""}
          className="relative block aspect-square overflow-hidden bg-muted/20"
        >
          <img
            src={item.src}
            alt={item.caption || "Memorial photo"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </a>
        );
      })}
    </div>
  );
}
