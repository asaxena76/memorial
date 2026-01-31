"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { getPostById, type PostWithId } from "@/lib/db/posts";
import { MediaPreview } from "@/components/media/media-preview";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string | undefined;
  const [post, setPost] = useState<PostWithId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    let mounted = true;
    getPostById(postId)
      .then((data) => {
        if (mounted) setPost(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [postId]);

  const { profile } = useUserProfile(post?.createdBy);
  const createdAt = post?.createdAt?.toDate?.() ?? null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading memory...</p>;
  }

  if (!post) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">Memory not found.</p>
        <button
          className="text-sm text-primary underline"
          onClick={() => router.replace("/home")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {profile?.displayName ?? "Family member"}
          {createdAt ? ` · ${format(createdAt, "MMM d, yyyy")}` : ""}
        </p>
        <h2 className="font-serif text-2xl">{post.caption}</h2>
      </header>
      <div className="grid gap-4">
        {post.media.map((item, index) => (
          <MediaPreview
            key={`${item.storagePath}-${index}`}
            media={item}
            className="h-auto max-h-[70vh]"
            mode="contain"
          />
        ))}
      </div>
    </div>
  );
}
