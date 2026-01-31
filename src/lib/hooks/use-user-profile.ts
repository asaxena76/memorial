"use client";

import { useEffect, useState } from "react";

import { getUserProfile } from "@/lib/db/users";
import type { UserProfile } from "@/lib/models/user";

export function useUserProfile(uid?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!uid) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const data = await getUserProfile(uid);
      if (!mounted) return;
      setProfile(data);
      setLoading(false);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [uid]);

  return { profile, loading };
}
