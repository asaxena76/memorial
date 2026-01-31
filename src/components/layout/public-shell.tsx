import type { ReactNode } from "react";

export function PublicShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,76,52,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(15,30,40,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-32 right-[-12rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(122,72,49,0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-[-10rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(65,102,90,0.25),transparent_70%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            private family memorial
          </p>
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </header>
        <section className="grid gap-6 rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-[0_30px_60px_-40px_rgba(20,15,10,0.5)] backdrop-blur">
          {children}
        </section>
      </div>
    </main>
  );
}
