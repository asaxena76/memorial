"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const { user, claims, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (claims?.approved) {
        router.replace("/");
      } else {
        router.replace("/pending");
      }
    }
  }, [user, claims, loading, router]);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error(error);
      toast.error("Could not sign in with Google.");
    }
  };

  const handleApple = async () => {
    try {
      await signInWithPopup(auth, new OAuthProvider("apple.com"));
    } catch (error) {
      console.error(error);
      toast.error("Could not sign in with Apple.");
    }
  };

  return (
    <PublicShell
      title="Sign in to share"
      subtitle="Anyone can view memories, but only approved family members can submit new posts."
    >
      <div className="grid gap-4">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">
            Access to submit memories is limited to approved family members.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={handleApple}
          >
            Continue with Apple
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
