"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   LENIS — Global smooth scrolling
   Respects prefers-reduced-motion (disables smoothing)
   ========================================================= */
let lenisInstance: Lenis | null = null;

export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisInstance = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

export function getLenis() {
  return lenisInstance;
}

/* =========================================================
   SPLIT TEXT REVEAL — headline text reveal by words/lines
   Uses SplitType to split text, then animates each word/line
   with a mask reveal (translateY from 100% → 0)
   ========================================================= */
export function useSplitText<T extends HTMLElement = HTMLDivElement>(
  options: { splitBy?: "words" | "lines"; stagger?: number; duration?: number; delay?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { splitBy = "words", stagger = 0.06, duration = 0.8, delay = 0, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const split = new SplitType(el, { types: splitBy });
    const targets = splitBy === "lines" ? split.lines : split.words;
    if (!targets || targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(targets, { yPercent: 110, opacity: 0 });
      gsap.to(targets, {
        yPercent: 0,
        opacity: 1,
        duration,
        delay,
        stagger,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%", once },
      });
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [splitBy, stagger, duration, delay, once]);

  return ref;
}

/* =========================================================
   IMAGE MASK REVEAL — images slide from behind a clip mask
   Uses clip-path animation + subtle scale
   ========================================================= */
export function useImageReveal<T extends HTMLElement = HTMLDivElement>(
  options: { delay?: number; duration?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { delay = 0, duration = 1.1, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.2 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1.05,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, duration, once]);

  return ref;
}

/* =========================================================
   MAGNETIC BUTTON — element moves slightly toward cursor on hover
   Desktop only (pointer: fine)
   ========================================================= */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  options: { strength?: number } = {}
) {
  const ref = useRef<T | null>(null);
  const { strength = 0.3 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return; // desktop only
    if (prefersReducedMotion()) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}

/* =========================================================
   PAGE TRANSITION — elegant overlay transition between views
   Called by the page router on view change
   ========================================================= */
export function usePageTransition() {
  const isTransitioning = useRef(false);

  const transition = (callback: () => void) => {
    if (prefersReducedMotion() || typeof window === "undefined") {
      callback();
      return;
    }
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0a0a0a;pointer-events:none;transform:scaleY(0);transform-origin:bottom;";
    document.body.appendChild(overlay);

    const tl = gsap.timeline({
      onComplete: () => {
        overlay.remove();
        isTransitioning.current = false;
      },
    });

    tl.to(overlay, { scaleY: 1, duration: 0.3, ease: "power3.inOut" })
      .add(() => callback())
      .to(overlay, { scaleY: 0, transformOrigin: "top", duration: 0.35, ease: "power3.inOut", delay: 0.05 });
  };

  return { transition };
}

/* Re-export existing hooks for convenience */
export { useFadeUp, useFadeScale, useParallax } from "./gsap-utils";
