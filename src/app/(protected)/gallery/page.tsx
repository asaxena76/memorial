"use client";

import { useEffect, useMemo, useState } from "react";

import { listApprovedPosts, type PostWithId } from "@/lib/db/posts";
import type { PostMedia } from "@/lib/models/post";
import { MediaPreview } from "@/components/media/media-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GalleryItem = {
  postId: string;
  caption: string;
  media: PostMedia;
};

export default function GalleryPage() {
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

  const items = useMemo<GalleryItem[]>(
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading gallery...</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No approved photos yet.
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((item) => (
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

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
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
  );
}
