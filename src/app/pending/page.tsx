"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/providers/auth-provider";

export default function PendingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/submit");
    }
  }, [user, loading, router]);

  return (
    <RequireAuth>
      <PublicShell
        title="You're signed in"
        subtitle="You can now share memories. They'll appear after review."
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
            <p className="text-sm text-muted-foreground">
              Head back to the memorial or go straight to the submission form.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.push("/submit")}
          >
            Share a memory
          </Button>
        </div>
      </PublicShell>
    </RequireAuth>
  );
}
