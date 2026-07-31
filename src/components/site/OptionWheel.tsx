"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * OptionWheel — an elegant scroll-wheel category selector for mobile.
 * Supports touch dragging, mouse wheel, and momentum scrolling.
 * The active item snaps to center with a subtle gold highlight.
 *
 * Accessibility: keyboard accessible (arrow keys, tab focus), ARIA roles.
 * Reduced-motion: disables momentum, snaps instantly.
 */
export function OptionWheel({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const velocity = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef<number | null>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useRef(false);

  const ITEM_H = 48;

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const scrollToIndex = (idx: number, smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth && !reducedMotion.current ? "smooth" : "auto" });
  };

  // Scroll to the active value on mount and when value changes externally
  useEffect(() => {
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    scrollToIndex(idx, false);
  }, [value, options]);

  const snapAndDetect = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(options.length - 1, idx));
    if (!reducedMotion.current) {
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    } else {
      el.scrollTop = clamped * ITEM_H;
    }
    const item = options[clamped];
    if (item && item.value !== value) {
      onChange(item.value);
    }
  };

  const onScroll = () => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(snapAndDetect, 120);
  };

  const startMomentum = () => {
    if (reducedMotion.current || Math.abs(velocity.current) < 0.5) {
      snapAndDetect();
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const animate = () => {
      el.scrollTop += velocity.current;
      velocity.current *= 0.92;
      if (Math.abs(velocity.current) > 0.5) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        snapAndDetect();
      }
    };
    animFrame.current = requestAnimationFrame(animate);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartScroll.current = containerRef.current?.scrollTop || 0;
    lastY.current = e.touches[0].clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const y = e.touches[0].clientY;
    const delta = dragStartY.current - y;
    if (containerRef.current) {
      containerRef.current.scrollTop = dragStartScroll.current - delta;
    }
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = ((lastY.current - y) / dt) * 16;
    }
    lastY.current = y;
    lastTime.current = now;
  };

  const onTouchEnd = () => {
    setDragging(false);
    startMomentum();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = options.findIndex((o) => o.value === value);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(options.length - 1, idx + 1);
      scrollToIndex(next);
      onChange(options[next].value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(0, idx - 1);
      scrollToIndex(prev);
      onChange(options[prev].value);
    }
  };

  const activeIdx = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      className={cn("relative select-none", className)}
      role="listbox"
      aria-label="Menu categories"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Selection highlight (center band) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-2xl border border-gold/20 bg-gold/[0.06]"
        style={{ height: ITEM_H }}
        aria-hidden
      />
      {/* Top & bottom fade masks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background to-transparent" aria-hidden />

      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="no-scrollbar overflow-y-scroll"
        style={{
          height: ITEM_H * 5,
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Spacer for centering */}
        <div style={{ height: ITEM_H * 2 }} aria-hidden />
        {options.map((opt, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={opt.value}
              role="option"
              aria-selected={isActive}
              onClick={() => { scrollToIndex(i); onChange(opt.value); }}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className={cn(
                "flex cursor-pointer items-center justify-center transition-all duration-200",
                isActive
                  ? "font-[family-name:var(--font-playfair)] text-xl font-semibold text-gold"
                  : "font-sans text-sm text-muted-foreground/60"
              )}
            >
              {opt.label}
            </div>
          );
        })}
        {/* Spacer for centering */}
        <div style={{ height: ITEM_H * 2 }} aria-hidden />
      </div>
    </div>
  );
}
