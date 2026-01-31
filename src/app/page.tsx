/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { listApprovedPosts, type PostWithId } from "@/lib/db/posts";
import { PostCard } from "@/components/posts/post-card";
import { useSiteSettings } from "@/lib/hooks/use-site-settings";
import { getImageObjectUrl } from "@/lib/storage/media";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function PublicHomePage() {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadHero = async () => {
      if (!settings?.heroImagePath) {
        setHeroUrl(null);
        return;
      }
      objectUrl = await getImageObjectUrl(settings.heroImagePath);
      if (mounted) setHeroUrl(objectUrl);
    };

    loadHero().catch((error) => console.error("Failed to load hero", error));

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [settings?.heroImagePath]);

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-[0_20px_50px_-40px_rgba(20,15,10,0.45)]">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt="Memorial hero"
            className="h-64 w-full object-cover"
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4 p-8">
          <div>
            <h2 className="font-serif text-3xl">{settings?.subjectName}</h2>
            {settings?.subjectDates ? (
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {settings.subjectDates}
              </p>
            ) : null}
            {settings?.heroQuote ? (
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                “{settings.heroQuote}”
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            {user ? (
              <Button asChild>
                <Link href="/submit">Share a memory</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Sign in to share</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6">
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
