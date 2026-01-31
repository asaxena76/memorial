import { z } from "zod";

export const siteThemeSchema = z.object({
  accentHex: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  subjectName: z.string(),
  subjectDates: z.string(),
  heroQuote: z.string().optional(),
  heroImagePath: z.string().optional(),
  theme: siteThemeSchema.optional(),
});

export type SiteTheme = z.infer<typeof siteThemeSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
