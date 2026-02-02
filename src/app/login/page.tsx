"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/submit");
    }
  }, [user, loading, router]);

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

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error(error);
      toast.error("Could not sign in with email/password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell
      title="Sign in to share"
      subtitle="Anyone can view memories, but you'll need to sign in to share new posts."
    >
      <div className="grid gap-4">
        <form
          onSubmit={handleEmail}
          className="grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-5"
        >
          <p className="text-sm text-muted-foreground">
            Use your email and password if you do not have a Google account.
          </p>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border border-border/70 bg-background/80 px-3 text-sm"
              placeholder="name@ajaimemory.local"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-xl border border-border/70 bg-background/80 px-3 text-sm"
              placeholder="••••••••••••"
              required
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Signing in..." : "Continue with email"}
          </Button>
        </form>

        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">
            Sign in to submit memories for review.
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
