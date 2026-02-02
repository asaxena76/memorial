"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Video } from "lucide-react";

import type { PostWithId } from "@/lib/db/posts";
import type { PostMedia } from "@/lib/models/post";
import { getImageUrl } from "@/lib/storage/media";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { cn } from "@/lib/utils";

function MediaThumb({ media }: { media: PostMedia }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (media.kind !== "image") return;

    const load = async () => {
      const path = media.thumbnailPath || media.storagePath;
      const downloadUrl = await getImageUrl(path);
      if (active) setUrl(downloadUrl);
    };

    load().catch((error) => console.error("Failed to load thumbnail", error));

    return () => {
      active = false;
    };
  }, [media]);

  if (media.kind === "video") {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
        <Video className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
      {url ? (
        <img
          src={url}
          alt="Memory thumbnail"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted/40" />
      )}
    </div>
  );
}

export function PostCard({ post }: { post: PostWithId }) {
  const { profile } = useUserProfile(post.createdBy);
  const createdAt = post.createdAt?.toDate?.() ?? null;
  const authorName =
    post.authorName || profile?.displayName || "Family member";

  return (
    <article className="rounded-3xl border border-border/60 bg-card/60 px-6 py-8 shadow-[0_18px_40px_-32px_rgba(20,15,10,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p className="italic">
          {createdAt ? format(createdAt, "MMMM d, yyyy") : "—"}
        </p>
      </div>

      <div className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground sm:text-lg">
        {post.caption}
      </div>

      {post.media.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {post.media.map((item, index) => (
            <MediaThumb key={`${item.storagePath}-${index}`} media={item} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end text-sm text-muted-foreground">
        <span
          className={cn(
            "font-serif text-base text-foreground/80 sm:text-lg"
          )}
        >
          {authorName}
        </span>
      </div>
    </article>
  );
}
