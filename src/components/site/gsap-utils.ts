"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reusable GSAP animation hooks.
 * All hooks:
 * - Register ScrollTrigger
 * - Respect prefers-reduced-motion (elements are visible immediately)
 * - Clean up on unmount (kill ScrollTriggers + tweens)
 * - Use GPU-friendly transforms (y, scale, opacity) — no layout thrashing
 */

/* Fade up: opacity 0→1, y 30→0. Stagger children if `stagger` is set. */
export function useFadeUp<T extends HTMLElement = HTMLDivElement>(
  options: { stagger?: number; delay?: number; y?: number; duration?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { stagger = 0, delay = 0, y = 30, duration = 0.8, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const targets = stagger > 0 ? Array.from(el.children) as HTMLElement[] : el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y, scale: 1 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%", once },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, y, duration, once]);

  return ref;
}

/* Fade in with scale: opacity 0→1, scale 0.95→1. Stagger children if set. */
export function useFadeScale<T extends HTMLElement = HTMLDivElement>(
  options: { stagger?: number; delay?: number; duration?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { stagger = 0, delay = 0, duration = 0.8, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    const targets = stagger > 0 ? Array.from(el.children) as HTMLElement[] : el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, duration, once]);

  return ref;
}

/* Parallax: subtle Y movement based on scroll position. */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: { speed?: number; start?: string; end?: string } = {}
) {
  const ref = useRef<T | null>(null);
  const { speed = 0.15, start = "top bottom", end = "bottom top" } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: "none",
          scrollTrigger: { trigger: el, start, end, scrub: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [speed, start, end]);

  return ref;
}

/* Generic reveal: animate an element from a from-state to a to-state on scroll. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  triggerOptions: ScrollTrigger.Vars = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(el, from, {
        ...to,
        scrollTrigger: { trigger: el, start: "top 80%", once: true, ...triggerOptions },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return ref;
}
