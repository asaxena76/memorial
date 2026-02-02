"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { MemoryQuote } from "@/lib/data/memories";
import { cn } from "@/lib/utils";

export function MemoriesRotator({ quotes }: { quotes: MemoryQuote[] }) {
  const items = useMemo(() => quotes.filter((quote) => quote.text), [quotes]);
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const current = items[index];
  const goTo = (nextIndex: number) => {
    const total = items.length;
    const normalized = ((nextIndex % total) + total) % total;
    setIndex(normalized);
  };

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl px-8 sm:px-12">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Memories
        </p>
        <div className="mt-5 border-t border-border/70 pt-6">
          <blockquote
            className={cn(
              "text-2xl leading-relaxed text-foreground sm:text-3xl",
              "font-sans"
            )}
          >
            “{current.text}”
          </blockquote>
          {current.author ? (
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-muted-foreground">
              {current.author}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition hover:text-foreground"
              aria-label="Previous memory"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition hover:text-foreground"
              aria-label="Next memory"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
    </section>
  );
}
