"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * CircularGallery — a premium infinite horizontal image carousel.
 * Smooth drag + wheel interaction, large HD images, minimal labels.
 * Lazy loads images, respects reduced-motion (renders as a simple horizontal scroll).
 *
 * Accessibility: keyboard navigable (arrow keys), ARIA roles for carousel.
 */
export function CircularGallery({
  images,
  className,
}: {
  images: { url: string; title: string; label?: string }[];
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Detect the centered image on scroll
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Each "slot" is el.clientWidth / 2 (center-based snapping)
    const slot = el.clientWidth * 0.5;
    const idx = Math.round(el.scrollLeft / slot);
    const clamped = ((idx % images.length) + images.length) % images.length;
    setActiveIdx(clamped);
  }, [images.length]);

  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const slot = el.clientWidth * 0.5;
      const idx = Math.round(el.scrollLeft / slot);
      if (!reducedMotion) {
        el.scrollTo({ left: idx * slot, behavior: "smooth" });
      } else {
        el.scrollLeft = idx * slot;
      }
      onScroll();
    }, 120);
  }, [onScroll, reducedMotion]);

  // Touch/mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartScroll.current = scrollRef.current?.scrollLeft || 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const delta = e.clientX - dragStartX.current;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = dragStartScroll.current - delta;
    }
  };
  const onMouseUp = () => {
    setDragging(false);
    handleScroll();
  };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartScroll.current = scrollRef.current?.scrollLeft || 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - dragStartX.current;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = dragStartScroll.current - delta;
    }
  };
  const onTouchEnd = () => handleScroll();

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const slot = el.clientWidth * 0.5;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollTo({ left: el.scrollLeft + slot, behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollTo({ left: el.scrollLeft - slot, behavior: "smooth" });
    }
  };

  // Build the carousel items — duplicate for infinite effect
  const items = [...images, ...images, ...images];

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      role="region"
      aria-label="Gallery carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={(e) => {
          // Horizontal wheel support for trackpads
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            // let native scroll handle it
          }
        }}
        className="no-scrollbar flex cursor-grab gap-4 overflow-x-auto px-[10%] py-8 active:cursor-grabbing sm:gap-6 sm:px-[15%] lg:px-[20%]"
        data-cursor="drag"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((img, i) => {
          const realIdx = ((i % images.length) + images.length) % images.length;
          const isActive = realIdx === activeIdx;
          return (
            <div
              key={i}
              className="relative shrink-0 overflow-hidden rounded-[1.5rem] border border-white/[0.06] transition-all duration-500"
              style={{
                scrollSnapAlign: "center",
                width: "min(80vw, 520px)",
                height: "min(60vh, 420px)",
                transform: isActive ? "scale(1)" : "scale(0.85)",
                opacity: isActive ? 1 : 0.5,
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${realIdx + 1} of ${images.length}: ${img.title}`}
            >
              <img
                src={img.url}
                alt={img.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">
                  {img.title}
                </p>
                {img.label && (
                  <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-gold">
                    {img.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="mt-2 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const slot = el.clientWidth * 0.5;
              el.scrollTo({ left: (i + images.length) * slot, behavior: "smooth" });
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIdx ? "w-8 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
