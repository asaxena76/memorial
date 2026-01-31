"use client";

import Link from "next/link";
import { format } from "date-fns";

import type { PostWithId } from "@/lib/db/posts";
import { MediaPreview } from "@/components/media/media-preview";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PostCard({ post }: { post: PostWithId }) {
  const { profile } = useUserProfile(post.createdBy);
  const createdAt = post.createdAt?.toDate?.() ?? null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {profile?.displayName ?? "Family member"}
          {createdAt ? ` · ${format(createdAt, "MMM d, yyyy")}` : ""}
        </div>
        <p className="font-serif text-lg text-foreground">{post.caption}</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {post.media.map((item, index) => (
          <MediaPreview key={`${item.storagePath}-${index}`} media={item} />
        ))}
        <Link
          className="text-sm text-primary underline"
          href={`/post/${post.id}`}
        >
          View details
        </Link>
      </CardContent>
    </Card>
  );
}
