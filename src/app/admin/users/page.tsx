"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { listPendingUsers } from "@/lib/db/users";
import type { UserProfile } from "@/lib/models/user";
import { approveUser, rejectUser } from "@/lib/firebase/functions";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    listPendingUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleApprove = async (uid: string) => {
    setActioning(uid);
    try {
      await approveUser(uid);
      toast.success("User approved.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not approve user.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (uid: string) => {
    const reason = window.prompt("Optional rejection reason:") ?? undefined;
    setActioning(uid);
    try {
      await rejectUser(uid, reason);
      toast.success("User rejected.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not reject user.");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending users right now.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <div
          key={user.uid}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/60 p-4"
        >
          <div>
            <p className="font-medium">
              {user.displayName || user.email || "Unknown user"}
            </p>
            <p className="text-xs text-muted-foreground">
              Joined {user.createdAt?.toDate ? format(user.createdAt.toDate(), "MMM d, yyyy") : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(user.uid)}
              disabled={actioning === user.uid}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(user.uid)}
              disabled={actioning === user.uid}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
