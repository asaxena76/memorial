"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/providers/auth-provider";

export default function PendingPage() {
  const { claims, refreshClaims } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (claims?.approved) {
      router.replace("/home");
    }
  }, [claims, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClaims();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not refresh access yet.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RequireAuth>
      <PublicShell
        title="Thank you for signing in"
        subtitle="Your access request is pending. A family admin will review it shortly."
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
            <p className="text-sm text-muted-foreground">
              If you believe you were approved already, click refresh access to
              update your status.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh access"}
          </Button>
        </div>
      </PublicShell>
    </RequireAuth>
  );
}
