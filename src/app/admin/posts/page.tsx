"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { listAllPosts, type PostWithId } from "@/lib/db/posts";
import type { PostMedia } from "@/lib/models/post";
import { db } from "@/lib/firebase/client";
import { uploadThumbnailFile } from "@/lib/storage/upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaPreview } from "@/components/media/media-preview";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PostWithId | null>(null);
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [thumbFiles, setThumbFiles] = useState<Record<number, File | null>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    listAllPosts()
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

  const handleEdit = (post: PostWithId) => {
    setSelected(post);
    setCaption(post.caption);
    setMedia(post.media);
    setThumbFiles({});
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updatedMedia = [...media];
      const entries = Object.entries(thumbFiles).filter(([, file]) => file);
      for (const [indexStr, file] of entries) {
        const index = Number(indexStr);
        if (!file || !updatedMedia[index]) continue;
        const storagePath = await uploadThumbnailFile({
          postId: selected.id,
          file,
        });
        updatedMedia[index] = {
          ...updatedMedia[index],
          thumbnailPath: storagePath,
        };
      }

      await updateDoc(doc(db, "posts", selected.id), {
        caption,
        media: updatedMedia,
        updatedAt: serverTimestamp(),
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === selected.id
            ? { ...post, caption, media: updatedMedia }
            : post
        )
      );
      setSelected(null);
    } catch (error) {
      console.error("Failed to update post", error);
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        acc.total += 1;
        acc[post.status] += 1;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 }
    );
  }, [posts]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading posts...</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span>Total {statusCounts.total}</span>
        <span>Approved {statusCounts.approved}</span>
        <span>Pending {statusCounts.pending}</span>
        <span>Rejected {statusCounts.rejected}</span>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-3xl border border-border/60 bg-card/60 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[240px] flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {post.status}
                </p>
                <p className="mt-2 text-lg text-foreground">{post.caption}</p>
              </div>
              <Button variant="outline" onClick={() => handleEdit(post)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-[120px] rounded-2xl border border-border/70 bg-background/80 p-3 text-sm"
              />
            </div>

            {media.length > 0 ? (
              <div className="grid gap-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Thumbnails
                </p>
                {media.map((item, index) => (
                  <div
                    key={`${selected?.id}-${item.storagePath}`}
                    className="grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
                  >
                    <MediaPreview media={item} />
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Upload thumbnail (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setThumbFiles((prev) => ({
                            ...prev,
                            [index]: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      {item.thumbnailPath ? (
                        <p className="text-xs text-muted-foreground">
                          Current: {item.thumbnailPath}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This post has no media.
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
