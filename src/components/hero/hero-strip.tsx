/* eslint-disable @next/next/no-img-element */
"use client";

import { cn } from "@/lib/utils";

export function HeroStrip({
  images,
  leftLabel,
  name,
  dates,
}: {
  images: string[];
  leftLabel?: string;
  name?: string;
  dates?: string;
}) {
  const activeImages = images.filter(Boolean);
  if (activeImages.length === 0) return null;

  return (
    <section className="w-full py-8 sm:py-12 lg:py-16">
      <div className="hidden md:grid md:grid-cols-3 md:gap-0">
        {activeImages.slice(0, 3).map((src) => (
          <div
            key={src}
            className="relative w-full"
            style={{ aspectRatio: "1 / 1" }}
          >
            <img
              src={src}
              alt="Memorial hero"
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                "brightness-[1.06] contrast-[0.92]"
              )}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto">
          {activeImages.slice(0, 3).map((src) => (
            <div
              key={src}
              className="snap-start shrink-0"
              style={{ width: "100vw" }}
            >
              <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
                <img
                  src={src}
                  alt="Memorial hero"
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    "brightness-[1.06] contrast-[0.92]"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 sm:mt-7">
        <div className="pl-16 pr-6 sm:pl-24 sm:pr-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          {leftLabel ? (
            <div
              className={cn(
                "text-5xl font-semibold tracking-wide text-foreground/90 sm:text-6xl",
                "font-[var(--font-hindi)]"
              )}
            >
              {leftLabel}
            </div>
          ) : null}
          <div className="text-left md:text-right">
            {name ? (
              <p className="text-2xl text-foreground sm:text-3xl">{name}</p>
            ) : null}
            {dates ? (
              <p className="mt-2 text-sm uppercase tracking-[0.32em] text-muted-foreground">
                {dates}
              </p>
            ) : null}
          </div>
          </div>
        </div>
        <div className="mt-4 pl-16 pr-6 sm:pl-24 sm:pr-10">
          <div className="border-t-2 border-border/80" />
        </div>
      </div>
    </section>
  );
}
