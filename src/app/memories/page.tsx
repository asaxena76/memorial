"use client";

import { useEffect, useState } from "react";

import { listApprovedPosts, type PostWithId } from "@/lib/db/posts";
import { PostCard } from "@/components/posts/post-card";

export default function MemoriesPage() {
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

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Memory Wall
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl">Memories</h1>
        <p className="text-sm text-muted-foreground">
          Shared stories and tributes from family.
        </p>
      </header>

      <section className="mt-8 grid gap-6">
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
    </main>
  );
}
