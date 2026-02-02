"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

import { listPostsByUser, type PostWithId } from "@/lib/db/posts";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusStyles: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PostWithId | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    listPostsByUser(user.uid)
      .then((data) => {
        if (mounted) setPosts(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Sign in to view and manage your submissions.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading submissions...</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t submitted any memories yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-2xl border border-border/60 bg-card/60 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-lg">{post.caption}</p>
                <p className="text-xs text-muted-foreground">
                  {post.createdAt?.toDate
                    ? format(post.createdAt.toDate(), "MMM d, yyyy")
                    : ""}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
                  statusStyles[post.status]
                )}
              >
                {post.status}
              </span>
            </div>
            {post.rejectedReason ? (
              <p className="mt-3 text-sm text-destructive">
                Reason: {post.rejectedReason}
              </p>
            ) : null}
            {post.status === "pending" || post.status === "approved" ? (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(post);
                    setCaption(post.caption);
                  }}
                >
                  Edit caption
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Edit caption
            </DialogTitle>
          </DialogHeader>
          {editing?.status === "approved" ? (
            <p className="text-sm text-muted-foreground">
              Editing an approved post will send it back to the moderation queue.
            </p>
          ) : null}
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="edit-caption">
              Caption
            </label>
            <textarea
              id="edit-caption"
              className="min-h-[120px] rounded-2xl border border-border/70 bg-background/80 p-3 text-sm"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editing) return;
                if (caption.trim().length < 2) {
                  toast.error("Caption is too short.");
                  return;
                }
                setSaving(true);
                try {
                  const updates =
                    editing.status === "approved"
                      ? {
                          caption: caption.trim(),
                          status: "pending",
                          updatedAt: serverTimestamp(),
                          reviewedAt: deleteField(),
                          reviewedBy: deleteField(),
                          rejectedReason: deleteField(),
                        }
                      : {
                          caption: caption.trim(),
                          updatedAt: serverTimestamp(),
                        };

                  await updateDoc(doc(db, "posts", editing.id), updates);
                  setPosts((prev) =>
                    prev.map((post) =>
                      post.id === editing.id
                        ? {
                            ...post,
                            caption: caption.trim(),
                            status:
                              editing.status === "approved" ? "pending" : post.status,
                            rejectedReason:
                              editing.status === "approved"
                                ? undefined
                                : post.rejectedReason,
                          }
                        : post
                    )
                  );
                  toast.success("Caption updated.");
                  setEditing(null);
                } catch (error) {
                  console.error(error);
                  toast.error("Could not update caption.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
