import type { Metadata } from "next";
import { Arya, Cormorant_Garamond, Open_Sans } from "next/font/google";

import "@/app/globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sansFont = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const hindiFont = Arya({
  subsets: ["devanagari", "latin"],
  variable: "--font-hindi",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Memorial",
  description: "A memorial space for family memories.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${sansFont.variable} ${hindiFont.variable} min-h-screen bg-background font-sans text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
