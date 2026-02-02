"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/submit", label: "Submit" },
  { href: "/my", label: "My Submissions" },
];

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { claims } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                memorial
              </p>
              <h1 className="font-serif text-2xl">Family Memories</h1>
            </div>
            {claims?.admin && (
              <Link
                href="/admin/users"
                className="rounded-full border border-border/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                Admin Panel
              </Link>
            )}
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-12 pt-2 text-xs text-muted-foreground">
        This memorial is open for viewing. Sign in to share a memory.
      </footer>
    </div>
  );
}
