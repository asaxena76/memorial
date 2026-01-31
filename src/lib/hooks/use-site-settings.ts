"use client";

import { useEffect, useState } from "react";

import { getSiteSettings } from "@/lib/db/settings";
import type { SiteSettings } from "@/lib/models/settings";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSiteSettings()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
}
