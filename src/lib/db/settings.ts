import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { siteSettingsSchema, type SiteSettings } from "@/lib/models/settings";

const fallbackSettings: SiteSettings = {
  subjectName: "In Loving Memory",
  subjectDates: "",
  heroQuote: "A life that touched so many will never be forgotten.",
  theme: {
    accentHex: "#7b4a2f",
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDoc(doc(db, "settings", "site"));
  if (!snap.exists()) return fallbackSettings;
  const parsed = siteSettingsSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : fallbackSettings;
}
