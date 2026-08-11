"use client";

import { useEffect, useRef, useCallback } from "react";
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
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
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
   SPLIT TEXT REVEAL
   ========================================================= */
export function useSplitText<T extends HTMLElement = HTMLDivElement>(
  options: { splitBy?: "words" | "lines"; stagger?: number; duration?: number; delay?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { splitBy = "words", stagger = 0.06, duration = 0.8, delay = 0, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const split = new SplitType(el, { types: splitBy });
    const targets = splitBy === "lines" ? split.lines : split.words;
    if (!targets || targets.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.set(targets, { yPercent: 110, opacity: 0 });
      gsap.to(targets, {
        yPercent: 0, opacity: 1, duration, delay, stagger, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%", once },
      });
    }, el);
    return () => { ctx.revert(); split.revert(); };
  }, [splitBy, stagger, duration, delay, once]);

  return ref;
}

/* =========================================================
   IMAGE MASK REVEAL
   ========================================================= */
export function useImageReveal<T extends HTMLElement = HTMLDivElement>(
  options: { delay?: number; duration?: number; once?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const { delay = 0, duration = 1.1, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { gsap.set(el, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 }); return; }
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.2 },
        {
          clipPath: "inset(0% 0% 0% 0%)", scale: 1.05, duration, delay, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once }
        });
    }, el);
    return () => ctx.revert();
  }, [delay, duration, once]);

  return ref;
}

/* =========================================================
   MAGNETIC BUTTON
   ========================================================= */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(options: { strength?: number } = {}) {
  const ref = useRef<T | null>(null);
  const { strength = 0.3 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [strength]);

  return ref;
}

/* =========================================================
   SIGNATURE LIQUID GLASS BLOOM TRANSITION
   =========================================================

   A multi-layered transition that:
   1. Captures click origin (x, y)
   2. Darkens the current page
   3. Expands a liquid glass circle from the click point
   4. Shows a brief Black Orchid logo moment
   5. Swaps the content behind the overlay
   6. Retracts the glass to reveal the new page

   Layers:
   - Base: smoked black glass (#0B0B0F with glass tint)
   - Gold radial bloom from origin
   - Moving gold reflection streak
   - Film grain overlay
   - Black Orchid wordmark (logo moment)
*/

type TransitionVariant = "home" | "menu" | "gallery" | "banquet" | "catering" | "reservation" | "contact" | "default";

const VARIANT_TINTS: Record<TransitionVariant, string> = {
  home: "rgba(15,15,18,0.85)",
  menu: "rgba(20,15,12,0.85)",
  gallery: "rgba(12,12,15,0.82)",
  banquet: "rgba(18,14,10,0.85)",
  catering: "rgba(12,14,18,0.85)",
  reservation: "rgba(18,16,10,0.88)",
  contact: "rgba(10,10,12,0.82)",
  default: "rgba(15,15,18,0.85)",
};

const VARIANT_BLOOM: Record<TransitionVariant, string> = {
  home: "rgba(212,175,55,0.15)",
  menu: "rgba(212,175,55,0.12)",
  gallery: "rgba(212,175,55,0.10)",
  banquet: "rgba(212,175,55,0.18)",
  catering: "rgba(212,175,55,0.14)",
  reservation: "rgba(212,175,55,0.22)",
  contact: "rgba(212,175,55,0.10)",
  default: "rgba(212,175,55,0.15)",
};

// Singleton transition state — prevents overlapping transitions
let isTransitioning = false;

export function usePageTransition() {
  // Store the last click coordinates so the transition can originate from there
  const originRef = useRef<{ x: number; y: number; variant: TransitionVariant }>({ x: 0, y: 0, variant: "default" });

  // Capture click origins globally — listens for clicks on nav/CTA elements
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element (or ancestor) is a navigation trigger
      const navEl = target.closest("button, a");
      if (!navEl) return;
      // Check if this is a view-change trigger (has setView in its onClick or is a nav button)
      const text = navEl.textContent.trim().toLowerCase();
      const isNavTrigger = [
        "home", "about", "menu", "banquet", "gallery", "catering", "hours", "contact",
        "reserve", "reserve a table", "explore menu", "view menu", "book the banquet",
        "view full menu", "view full gallery", "read our story", "book", "privacy", "terms",
      ].some(k => text.includes(k));

      if (!isNavTrigger) return;

      const rect = navEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Determine variant from the destination
      let variant: TransitionVariant = "default";
      if (text.includes("menu")) variant = "menu";
      else if (text.includes("gallery")) variant = "gallery";
      else if (text.includes("banquet")) variant = "banquet";
      else if (text.includes("cater")) variant = "catering";
      else if (text.includes("reserve") || text.includes("book")) variant = "reservation";
      else if (text.includes("contact")) variant = "contact";
      else if (text.includes("home")) variant = "home";

      originRef.current = { x, y, variant };
    };

    document.addEventListener("click", onClick, true); // capture phase
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const transition = useCallback((callback: () => void) => {
    if (prefersReducedMotion() || typeof window === "undefined") {
      callback();
      return;
    }
    if (isTransitioning) { callback(); return; }
    isTransitioning = true;

    const { variant } = originRef.current;
    const tint = VARIANT_TINTS[variant] || "rgba(10,10,12,0.95)";
    const bloom = VARIANT_BLOOM[variant] || "rgba(212,175,55,0.15)";

    // --- Build the vertical curtain wipe-up container (sample1.mp4 physics) ---
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;z-index:9998;pointer-events:none;overflow:hidden;";

    // Main curtain panel — full viewport, wipes vertically (y: 100% -> 0% -> -100%)
    const curtain = document.createElement("div");
    curtain.style.cssText = `position:absolute;inset:0;width:100vw;height:100vh;background:${tint};backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(212,175,55,0.4);border-bottom:1px solid rgba(212,175,55,0.4);transform:translateY(100%);will-change:transform;overflow:hidden;box-shadow:0 -20px 60px rgba(0,0,0,0.7);`;

    // Ambient radial gold bloom inside curtain
    const bloomLayer = document.createElement("div");
    bloomLayer.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, ${bloom} 0%, transparent 65%);pointer-events:none;`;

    // Film grain overlay inside curtain
    const grain = document.createElement("div");
    grain.style.cssText = "position:absolute;inset:0;opacity:0.03;mix-blend-overlay;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");";

    // Centered luxury wordmark reveal
    const wordmark = document.createElement("div");
    wordmark.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.96);will-change:transform,opacity;";
    wordmark.innerHTML = `
      <div style="text-align:center;padding:0 1rem;">
        <span style="display:inline-block;font-size:0.7rem;letter-spacing:0.35em;text-transform:uppercase;color:#d4af37;margin-bottom:0.75rem;opacity:0.85;">✦ EST. 2003 ✦</span>
        <h2 style="font-family:var(--font-playfair),serif;font-size:clamp(2.2rem,5.5vw,4.5rem);font-weight:600;line-height:1.05;letter-spacing:0.04em;background:linear-gradient(135deg,#f0d878 0%,#d4af37 50%,#b8902a 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;">Black Orchid</h2>
        <p style="margin-top:0.75rem;font-family:var(--font-cormorant),serif;font-size:clamp(1.1rem,2vw,1.6rem);font-style:italic;color:rgba(245,240,232,0.7);">Fine Dining & Banquet</p>
      </div>
    `;

    curtain.appendChild(bloomLayer);
    curtain.appendChild(grain);
    curtain.appendChild(wordmark);
    container.appendChild(curtain);
    document.body.appendChild(container);

    // --- GSAP Timeline: Vertical Curtain Wipe-Up (y: 100% -> 0% -> -100%) ---
    const tl = gsap.timeline({
      onComplete: () => {
        container.remove();
        isTransitioning = false;
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
      },
    });

    // Phase 1: Wipe curtain UP from bottom to full screen (y: 100% -> 0%)
    tl.to(curtain, {
      y: "0%",
      duration: 0.45,
      ease: "power3.inOut",
    }, 0);

    // Phase 2: Fade & scale wordmark in mid-swipe
    tl.to(wordmark, {
      opacity: 1,
      scale: 1,
      duration: 0.22,
      ease: "power2.out",
    }, 0.2);

    // Phase 3: Swap React view at full screen cover (time = 0.42s)
    tl.add(() => callback(), 0.42);

    // Phase 4: Fade wordmark out
    tl.to(wordmark, {
      opacity: 0,
      scale: 0.96,
      duration: 0.18,
      ease: "power2.in",
    }, 0.44);

    // Phase 5: Wipe curtain UP off the top of the screen (y: 0% -> -100%)
    tl.to(curtain, {
      y: "-100%",
      duration: 0.45,
      ease: "power3.inOut",
    }, 0.45);
  }, []);

  return { transition };
}

/* Re-export existing hooks */
export { useFadeUp, useFadeScale, useParallax } from "./gsap-utils";
