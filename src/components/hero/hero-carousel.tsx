/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/data/hero-slides";

export function HeroCarousel({
  slides,
  fallbackName,
  fallbackDates,
}: {
  slides: HeroSlide[];
  fallbackName?: string;
  fallbackDates?: string;
}) {
  const activeSlides = useMemo(() => slides.filter((s) => s.src), [slides]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    if (paused) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % activeSlides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [activeSlides.length, paused]);

  if (activeSlides.length === 0) {
    return null;
  }

  const current = activeSlides[index];
  const name = current.name || fallbackName || "In Loving Memory";
  const dates = current.dates || fallbackDates || "";
  const caption = current.caption || "Rest in Peace";

  return (
    <section
      className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_70px_-45px_rgba(15,10,8,0.6)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative flex w-full items-center justify-center bg-white">
        <div
          className="relative"
          style={{
            width: "min(100vw, calc(70vh * 7 / 5))",
            height: "min(70vh, calc(100vw * 5 / 7))",
            aspectRatio: "7 / 5",
          }}
        >
          {activeSlides.map((slide, slideIndex) => (
            <div
              key={slide.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                slideIndex === index ? "opacity-100" : "opacity-0"
              )}
            >
              <img
                src={slide.src}
                alt={slide.name || "Memorial"}
                className="h-full w-full object-contain"
              />
            </div>
          ))}

          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 sm:px-8 sm:pb-5">
            <div className="flex flex-col gap-3 rounded-2xl bg-black/30 px-5 py-4 text-white/90 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl">
                {name}
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.45em] text-white/70">
                  {caption}
                </p>
                {dates ? (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.32em] text-white/70">
                    {dates}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeSlides.length > 1 ? (
        <div className="absolute left-6 top-6 z-20 flex items-center gap-2">
          {activeSlides.map((_, dotIndex) => (
            <button
              key={`dot-${dotIndex}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white/70",
                dotIndex === index ? "bg-white" : "bg-white/20"
              )}
              onClick={() => setIndex(dotIndex)}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
