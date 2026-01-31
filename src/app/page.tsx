"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { listApprovedPosts, type PostWithId } from "@/lib/db/posts";
import type { PostMedia } from "@/lib/models/post";
import { PostCard } from "@/components/posts/post-card";
import { useSiteSettings } from "@/lib/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { MediaPreview } from "@/components/media/media-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { heroSlides } from "@/lib/data/hero-slides";
import { HeroCarousel } from "@/components/hero/hero-carousel";

type GalleryItem = {
  postId: string;
  caption: string;
  media: PostMedia;
};

export default function PublicHomePage() {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let mounted = true;
    listApprovedPosts()
      .then((data) => {
        if (mounted) setPosts(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const galleryItems = useMemo<GalleryItem[]>(
    () =>
      posts.flatMap((post) =>
        post.media
          .filter((media) => media.kind === "image")
          .map((media) => ({
            postId: post.id,
            caption: post.caption,
            media,
          }))
      ),
    [posts]
  );

  return (
    <div className="grid gap-10">
      <div className="relative">
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-wrap gap-3">
          <div className="pointer-events-auto flex flex-wrap gap-3">
            {user ? (
              <Button asChild>
                <Link href="/submit">Share a memory</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Sign in to share</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/gallery">Open full gallery</Link>
            </Button>
          </div>
        </div>

        <HeroCarousel
          slides={heroSlides}
          fallbackName={settings?.subjectName}
          fallbackDates={settings?.subjectDates}
        />
      </div>

      <section className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading gallery...</p>
        ) : galleryItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved photos yet.
          </p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {galleryItems.map((item) => (
              <button
                key={`${item.postId}-${item.media.storagePath}`}
                className="mb-4 w-full break-inside-avoid rounded-2xl border border-border/60 bg-card/60 p-3 text-left shadow-sm"
                onClick={() => setSelected(item)}
              >
                <MediaPreview media={item.media} className="h-auto w-full" />
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {item.caption}
                </p>
              </button>
            ))}

            <Dialog
              open={Boolean(selected)}
              onOpenChange={() => setSelected(null)}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    {selected?.caption}
                  </DialogTitle>
                </DialogHeader>
                {selected ? (
                  <MediaPreview
                    media={selected.media}
                    className="h-auto max-h-[70vh] w-full"
                    mode="contain"
                  />
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>

      <section className="grid gap-6">
        <div>
          <h3 className="font-serif text-2xl">Recent stories</h3>
          <p className="text-sm text-muted-foreground">
            Written memories approved by family moderators.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading memories...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No memories have been approved yet.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>
    </div>
  );
}
