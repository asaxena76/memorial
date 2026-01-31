"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function RequireApproved({ children }: { children: React.ReactNode }) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!loading && user && !claims?.approved && pathname !== "/pending") {
      router.replace("/pending");
    }
  }, [loading, user, claims, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user || !claims?.approved) return null;

  return <>{children}</>;
}
