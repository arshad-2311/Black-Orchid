"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useApp, type ViewKey } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LuxuryButton } from "./primitives";

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
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: ViewKey) => { setView(v); setOpen(false); };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "glass-cinema border-b border-white/[0.06] py-4" : "bg-transparent py-7"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Logo — minimal wordmark */}
          <button onClick={() => go("home")} className="group flex items-center gap-2.5 focus-gold rounded" aria-label="Home">
            <span className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-luxe text-foreground transition-colors group-hover:text-gold">
              {settings?.restaurantName || "Black Orchid"}
            </span>
          </button>

          {/* Desktop nav with animated underline */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => go(item.view)}
                  className={cn(
                    "group relative px-4 py-2 font-sans text-[12px] uppercase tracking-[0.2em] transition-colors duration-300",
                    view === item.view ? "text-gold" : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {item.label}
                  <span className={cn("absolute inset-x-4 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-400", view === item.view ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </button>
              </li>
            ))}
          </ul>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go("reservation")}
              className="ripple-container relative hidden overflow-hidden rounded-full bg-gold-gradient px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-black glow-gold-hover hover:-translate-y-0.5 sm:inline-flex"
            >
              <span className="relative z-10">Reserve</span>
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-foreground transition-colors hover:border-gold/50 hover:text-gold lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Luxury mobile menu — fullscreen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-background/97 backdrop-blur-2xl" onClick={() => setOpen(false)} />
            {/* ambient orb */}
            <div className="ambient-orb" style={{ width: 320, height: 320, background: "rgba(212,175,55,0.12)", top: "20%", right: "10%" }} />
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="relative flex h-full flex-col items-center justify-center gap-2 px-6"
            >
              {NAV.map((item, i) => (
                <motion.button
                  key={item.view}
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
                  onClick={() => go(item.view)}
                  className={cn(
                    "font-[family-name:var(--font-playfair)] text-4xl font-medium transition-colors sm:text-5xl",
                    view === item.view ? "text-gold-gradient" : "text-foreground/80 hover:text-gold"
                  )}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.5 } } }} className="mt-10">
                <LuxuryButton onClick={() => go("reservation")}>Reserve a Table</LuxuryButton>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
