"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UtensilsCrossed } from "lucide-react";
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

export function Navbar({ settings }: { settings: { restaurantName: string; tagline: string } | null }) {
  const { view, setView } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: ViewKey) => {
    setView(v);
    setOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "glass border-b border-gold/10 py-3" : "bg-transparent py-5"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="group flex items-center gap-3 focus-gold rounded"
            aria-label="Go to home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-gold transition-all duration-300 group-hover:rotate-12 group-hover:border-gold">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="text-left leading-none">
              <span className="block font-[family-name:var(--font-playfair)] text-xl font-semibold tracking-wide text-foreground">
                {settings?.restaurantName || "Black Orchid"}
              </span>
              <span className="block font-sans text-[10px] uppercase tracking-[0.3em] text-gold/80">
                {settings?.tagline || "Fine Dining & Banquet"}
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => go(item.view)}
                  className={cn(
                    "relative px-4 py-2 font-sans text-[13px] uppercase tracking-[0.18em] transition-colors duration-300",
                    view === item.view ? "text-gold" : "text-foreground/80 hover:text-gold"
                  )}
                >
                  {item.label}
                  {view === item.view && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-gold"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go("reservation")}
              className="hidden rounded-full bg-gold-gradient px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-[0_8px_24px_-8px_oklch(0.82_0.14_84/0.6)] transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex"
            >
              Reserve
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setOpen(false)} />
            <motion.nav
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="relative mx-auto mt-24 flex max-w-sm flex-col gap-1 px-6"
            >
              {NAV.map((item, i) => (
                <motion.button
                  key={item.view}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => go(item.view)}
                  className={cn(
                    "border-b border-gold/10 py-4 text-left font-[family-name:var(--font-playfair)] text-2xl",
                    view === item.view ? "text-gold" : "text-foreground"
                  )}
                >
                  {item.label}
                </motion.button>
              ))}
              <button
                onClick={() => go("reservation")}
                className="mt-6 rounded-full bg-gold-gradient px-6 py-3 text-center font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black"
              >
                Reserve a Table
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
