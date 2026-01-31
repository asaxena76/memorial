"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !claims?.admin)) {
      router.replace("/login");
    }
  }, [loading, user, claims, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user || !claims?.admin) return null;

  return <>{children}</>;
}
