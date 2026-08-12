"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useApp, type ViewKey } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: { label: string; view: ViewKey }[] = [
  { label: "Home", view: "home" },
  { label: "About", view: "about" },
  { label: "Menu", view: "menu" },
  { label: "Banquet", view: "banquet" },
  { label: "Gallery", view: "gallery" },
  { label: "Catering", view: "catering" },
  { label: "Hours", view: "hours" },
  { label: "Contact", view: "contact" },
];

/**
 * PillNav — floating glassmorphism pill navigation.
 * Transparent at top, glass blur after scroll. Active indicator slides.
 * Mobile: collapses into a compact pill that opens a fullscreen overlay.
 *
 * MOBILE PERFORMANCE:
 * - Drawer is permanently mounted (no AnimatePresence mount/unmount cost).
 * - Toggled via CSS transform: translateX(100%) / translateX(0) — GPU only.
 * - No backdrop-filter on mobile overlay (solid dark bg instead).
 * - No ambient-orb blur inside drawer.
 * - contain: content isolates drawer layout from page reflow.
 */
export function PillNav({ settings }: { settings: { restaurantName: string; tagline: string } | null }) {
  const { view, setView } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const go = useCallback((v: ViewKey) => {
    setView(v);
    setMobileOpen(false);
  }, [setView]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-2 py-2 transition-all duration-500",
            scrolled
              ? "glass-cinema border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
              : "border-transparent bg-transparent"
          )}
        >
          {/* Logo wordmark */}
          <button
            onClick={() => go("home")}
            className="flex h-11 items-center px-3 font-[family-name:var(--font-playfair)] text-lg font-semibold tracking-luxe text-foreground transition-colors hover:text-gold active:scale-95"
            aria-label="Home"
          >
            {settings?.restaurantName || "Black Orchid"}
          </button>

          {/* Desktop nav pills */}
          <nav className="hidden items-center lg:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className={cn(
                  "relative px-3.5 py-1.5 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors duration-300",
                  view === item.view ? "text-gold font-semibold" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {view === item.view && (
                  <motion.span
                    layoutId="pillnav-active"
                    className="absolute inset-0 rounded-full border border-gold/40 bg-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Reserve button */}
          <button
            onClick={() => go("reservation")}
            className="ripple-container relative hidden overflow-hidden rounded-full bg-gold-gradient px-6 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex"
          >
            <span className="relative z-10">Reserve</span>
          </button>

          {/* Mobile menu toggle — 44px minimum touch target */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-foreground transition-colors hover:border-gold/50 hover:text-gold active:scale-95 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/*
        Mobile fullscreen overlay — PERMANENTLY MOUNTED, CSS-only transition.
        No AnimatePresence, no Framer mount/unmount, no backdrop-filter blur.
        Slide in via transform: translateX for pure compositor animation.
      */}
      <div
        className={cn(
          "mobile-nav-drawer fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "mobile-nav-drawer--open" : ""
        )}
        style={{
          /* Layout containment: isolate from page reflow */
          contain: "content",
          /* Start offscreen; CSS transitions handle open/close */
          visibility: mobileOpen ? "visible" : "hidden",
          transitionProperty: "visibility",
          transitionDelay: mobileOpen ? "0ms" : "280ms",
        }}
      >
        {/* Scrim overlay — solid dark bg, no backdrop-filter */}
        <div
          className="absolute inset-0"
          onClick={() => setMobileOpen(false)}
          style={{
            background: "rgba(11, 11, 14, 0.97)",
            opacity: mobileOpen ? 1 : 0,
            transition: "opacity 200ms ease-out",
            willChange: "opacity",
          }}
        />
        {/* Nav panel — slides in from right via translateX */}
        <nav
          className="relative flex h-full flex-col items-center justify-center gap-3 px-6"
          style={{
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
            paddingTop: "max(2rem, env(safe-area-inset-top))",
            transform: mobileOpen ? "translateX(0)" : "translateX(8%)",
            opacity: mobileOpen ? 1 : 0,
            transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
            willChange: "transform, opacity",
          }}
          aria-label="Mobile navigation"
        >
          {NAV.map((item, i) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "font-[family-name:var(--font-playfair)] text-4xl font-medium active:scale-95 sm:text-5xl",
                view === item.view ? "text-gold-gradient font-semibold" : "text-foreground/80"
              )}
              style={{
                /* Staggered entrance via CSS transition-delay — no JS needed */
                transform: mobileOpen ? "translateY(0)" : "translateY(12px)",
                opacity: mobileOpen ? 1 : 0,
                transition: `transform 280ms cubic-bezier(0.22, 1, 0.36, 1) ${mobileOpen ? i * 30 : 0}ms, opacity 220ms ease-out ${mobileOpen ? i * 30 : 0}ms`,
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => go("reservation")}
            className="mt-8 rounded-full bg-gold-gradient px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black active:scale-95"
            style={{
              transform: mobileOpen ? "translateY(0)" : "translateY(12px)",
              opacity: mobileOpen ? 1 : 0,
              transition: `transform 280ms cubic-bezier(0.22, 1, 0.36, 1) ${mobileOpen ? NAV.length * 30 : 0}ms, opacity 220ms ease-out ${mobileOpen ? NAV.length * 30 : 0}ms`,
            }}
          >
            Reserve a Table
          </button>
        </nav>
      </div>
    </>
  );
}
