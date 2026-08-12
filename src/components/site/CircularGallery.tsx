"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CircularGallery — High-performance horizontal gallery.
 * Optimizations:
 * - O(1) slide distance calculation without synchronous layout-thrashing DOM queries
 * - Targeted transition-[transform,opacity] (no box-shadow raster repaints across 48 cards)
 * - Native touch pan preservation on coarse pointer devices (no touch pointer-capture conflicts)
 * - Intelligent lazy loading for off-screen slides
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
  const [isPointerDragging, setIsPointerDragging] = useState(false);

  // Drag refs (zero React re-renders during pointer moves)
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const dragRafId = useRef<number | null>(null);
  const scrollRafId = useRef<number | null>(null);

  // O(1) centered slide calculation without DOM layout thrashing
  const onScroll = useCallback(() => {
    if (scrollRafId.current !== null) return;
    scrollRafId.current = requestAnimationFrame(() => {
      scrollRafId.current = null;
      const el = scrollRef.current;
      if (!el || images.length === 0) return;

      const firstChild = el.firstElementChild as HTMLElement | null;
      const cardWidth = firstChild ? firstChild.offsetWidth + 16 : 360;
      const scrollOffset = el.scrollLeft + el.clientWidth / 2 - cardWidth / 2 - el.clientWidth * 0.1;
      const rawIdx = Math.round(scrollOffset / cardWidth);
      const realIdx = ((rawIdx % images.length) + images.length) % images.length;

      setActiveIdx((prev) => (prev !== realIdx ? realIdx : prev));
    });
  }, [images.length]);

  // Pointer Events — Only capture for mouse drags, preserving native touch scroll
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || (e.button !== 0 && e.pointerType === "mouse")) return;
    const el = scrollRef.current;
    if (!el) return;

    isDragging.current = true;
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    setIsPointerDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current || e.pointerType === "touch") return;
    const currentX = e.clientX;
    const delta = currentX - startX.current;

    if (dragRafId.current !== null) return;
    dragRafId.current = requestAnimationFrame(() => {
      dragRafId.current = null;
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = startScrollLeft.current - delta;
      }
    });
  };

  const stopDragging = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsPointerDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* noop */
    }
  };

  // Smooth Navigation Helper (Non-queueing scroll targets)
  const navigateToCard = useCallback(
    (targetIndex: number) => {
      const el = scrollRef.current;
      if (!el || images.length === 0) return;
      const children = Array.from(el.children) as HTMLElement[];
      const targetChild = children[targetIndex];
      if (targetChild) {
        const targetLeft = targetChild.offsetLeft - (el.clientWidth - targetChild.offsetWidth) / 2;
        el.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    },
    [images.length]
  );

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.firstElementChild as HTMLElement | null;
    const cardStep = child ? child.offsetWidth + 24 : 360;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollBy({ left: cardStep, behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollBy({ left: -cardStep, behavior: "smooth" });
    }
  };

  // 3x dataset duplication for infinite loop feel
  const items = [...images, ...images, ...images];

  return (
    <div
      className={cn("relative w-full overflow-hidden select-none", className)}
      role="region"
      aria-label="Cinematic gallery carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Scroll Container with Lenis isolation */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className={cn(
          "no-scrollbar flex gap-4 sm:gap-6 overflow-x-auto px-[10%] sm:px-[15%] lg:px-[20%] py-8 touch-pan-x cursor-grab active:cursor-grabbing",
          isPointerDragging && "cursor-grabbing"
        )}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((img, i) => {
          const realIdx = ((i % images.length) + images.length) % images.length;
          const isActive = realIdx === activeIdx;
          const isNearActive = Math.abs(realIdx - activeIdx) <= 2;

          return (
            <div
              key={i}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-[1.5rem] border transition-[transform,opacity] duration-300 ease-out",
                isActive
                  ? "scale-100 opacity-100 border-gold/40 shadow-lg"
                  : "scale-90 opacity-45 hover:opacity-70 border-white/[0.08]"
              )}
              style={{
                scrollSnapAlign: "center",
                width: "min(80vw, 520px)",
                height: "min(60vh, 420px)",
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${realIdx + 1} of ${images.length}: ${img.title}`}
            >
              <img
                src={img.url}
                alt={img.title}
                loading={isNearActive ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground drop-shadow-md">
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

      {/* Desktop Floating Arrow Controls */}
      <div className="pointer-events-none absolute inset-y-0 left-4 right-4 hidden items-center justify-between sm:flex z-10">
        <button
          onClick={() => {
            const el = scrollRef.current;
            if (!el) return;
            const child = el.firstElementChild as HTMLElement | null;
            const step = child ? child.offsetWidth + 24 : 360;
            el.scrollBy({ left: -step, behavior: "smooth" });
          }}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold active:scale-95"
          aria-label="Previous gallery image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            const el = scrollRef.current;
            if (!el) return;
            const child = el.firstElementChild as HTMLElement | null;
            const step = child ? child.offsetWidth + 24 : 360;
            el.scrollBy({ left: step, behavior: "smooth" });
          }}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold active:scale-95"
          aria-label="Next gallery image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="mt-2 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => navigateToCard(i + images.length)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIdx ? "w-8 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/50"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
