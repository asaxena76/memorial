"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { StaticPhotoSwipeGallery } from "@/components/gallery/static-photoswipe-gallery";
import { heroStripImages } from "@/lib/data/hero-strip";
import { HeroStrip } from "@/components/hero/hero-strip";
import { featuredGalleryImages } from "@/lib/data/featured-gallery";
import { memoryQuotes } from "@/lib/data/memories";
import { MemoriesRotator } from "@/components/memories/memories-rotator";

export default function PublicHomePage() {
  const { user } = useAuth();
  const [galleryLoading] = useState(false);

  const featuredImages = useMemo(
    () =>
      featuredGalleryImages.slice(0, 9).map((src) => ({
        src,
      })),
    []
  );

  return (
    <div className="grid gap-10">
      <div className="relative">
        <HeroStrip
          images={heroStripImages}
          leftLabel="श्रद्धांजलि"
          name="Ajai Saxena"
          dates="04.11.44 - 02.03.25"
        />
      </div>

      <section className="grid gap-4">
        {galleryLoading ? (
          <p className="text-sm text-muted-foreground">Loading gallery...</p>
        ) : featuredImages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No featured photos yet.
          </p>
        ) : (
          <StaticPhotoSwipeGallery
            items={featuredImages}
            galleryId="public-gallery"
            className="mx-auto w-full max-w-5xl px-8 sm:px-12"
          />
        )}
      </section>

      <MemoriesRotator quotes={memoryQuotes} />
    </div>
  );
}
