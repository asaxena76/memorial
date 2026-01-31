"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { format } from "date-fns";

import { db } from "@/lib/firebase/client";

type AuditLog = {
  action: string;
  actorUid: string;
  targetUid?: string;
  targetPostId?: string;
  createdAt?: { toDate?: () => Date };
  meta?: Record<string, unknown>;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const q = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const entries = snap.docs.map((docSnap) => docSnap.data() as AuditLog);
      if (mounted) setLogs(entries);
    };

    load().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading audit logs...</p>;
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No audit entries yet.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {logs.map((log, index) => (
        <div
          key={`${log.action}-${index}`}
          className="rounded-2xl border border-border/60 bg-card/60 p-4"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {log.action}
          </div>
          <p className="mt-2 text-sm">
            Actor: {log.actorUid}
            {log.targetUid ? ` · User: ${log.targetUid}` : ""}
            {log.targetPostId ? ` · Post: ${log.targetPostId}` : ""}
          </p>
          {typeof log.meta?.reason === "string" ? (
            <p className="text-sm text-destructive">Reason: {log.meta.reason}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {log.createdAt?.toDate
              ? format(log.createdAt.toDate(), "MMM d, yyyy h:mm a")
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
