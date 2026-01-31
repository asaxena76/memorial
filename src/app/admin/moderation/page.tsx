"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { listPendingPosts, type PostWithId } from "@/lib/db/posts";
import { approvePost, rejectPost } from "@/lib/firebase/functions";
import { MediaPreview } from "@/components/media/media-preview";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

function ModerationCard({
  post,
  onApproved,
  onRejected,
}: {
  post: PostWithId;
  onApproved: (id: string) => void;
  onRejected: (id: string, reason?: string) => void;
}) {
  const { profile } = useUserProfile(post.createdBy);
  const createdAt = post.createdAt?.toDate?.() ?? null;

  return (
    <div className="grid gap-4 rounded-3xl border border-border/60 bg-card/60 p-5">
      <div>
        <p className="text-sm text-muted-foreground">
          {profile?.displayName ?? "Family member"}
          {createdAt ? ` · ${format(createdAt, "MMM d, yyyy")}` : ""}
        </p>
        <h3 className="font-serif text-lg">{post.caption}</h3>
      </div>
      <div className="grid gap-3">
        {post.media.map((item, index) => (
          <MediaPreview key={`${item.storagePath}-${index}`} media={item} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onApproved(post.id)}>Approve</Button>
        <Button variant="destructive" onClick={() => onRejected(post.id)}>
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    const data = await listPendingPosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const data = await listPendingPosts();
      if (!mounted) return;
      setPosts(data);
      setLoading(false);
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const handleApprove = async (postId: string) => {
    try {
      await approvePost(postId);
      toast.success("Post approved.");
      setLoading(true);
      await loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Could not approve post.");
      setLoading(false);
    }
  };

  const handleReject = async (postId: string) => {
    const reason = window.prompt("Optional rejection reason:") ?? undefined;
    try {
      await rejectPost(postId, reason);
      toast.success("Post rejected.");
      setLoading(true);
      await loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Could not reject post.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading moderation queue...</p>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending posts to review.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <ModerationCard
          key={post.id}
          post={post}
          onApproved={handleApprove}
          onRejected={handleReject}
        />
      ))}
    </div>
  );
}
