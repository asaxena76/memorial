"use client";

import { useEffect, useMemo, useState } from "react";

import { listApprovedPosts, type PostWithId } from "@/lib/db/posts";
import type { PostMedia } from "@/lib/models/post";
import { PhotoSwipeGallery } from "@/components/gallery/photoswipe-gallery";

type GalleryItem = {
  id: string;
  caption: string;
  media: PostMedia;
};

export default function GalleryPage() {
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);

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
            id: post.id,
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
    <PhotoSwipeGallery
      items={items}
      galleryId="protected-gallery"
      className="mx-auto w-full max-w-5xl px-8 sm:px-12"
    />
  );
}
