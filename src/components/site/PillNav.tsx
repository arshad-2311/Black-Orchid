"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const go = (v: ViewKey) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5"
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
            className="flex h-10 items-center px-3 font-[family-name:var(--font-playfair)] text-lg font-semibold tracking-luxe text-foreground transition-colors hover:text-gold"
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
                  "relative px-4 py-2 font-sans text-[12px] uppercase tracking-[0.18em] transition-colors duration-300",
                  view === item.view ? "text-black" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {view === item.view && (
                  <motion.span
                    layoutId="pillnav-active"
                    className="absolute inset-0 rounded-full bg-gold-gradient"
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

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-foreground transition-colors hover:border-gold/50 hover:text-gold lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile fullscreen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-background/97 backdrop-blur-2xl" onClick={() => setMobileOpen(false)} />
            <div className="ambient-orb" style={{ width: 320, height: 320, background: "rgba(212,175,55,0.12)", top: "20%", right: "10%" }} />
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="relative flex h-full flex-col items-center justify-center gap-2 px-6"
              aria-label="Mobile navigation"
            >
              {NAV.map((item) => (
                <motion.button
                  key={item.view}
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                  onClick={() => go(item.view)}
                  className={cn(
                    "font-[family-name:var(--font-playfair)] text-4xl font-medium transition-colors sm:text-5xl",
                    view === item.view ? "text-gold-gradient" : "text-foreground/80 hover:text-gold"
                  )}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.5 } } }}
                onClick={() => go("reservation")}
                className="mt-8 rounded-full bg-gold-gradient px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black"
              >
                Reserve a Table
              </motion.button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
