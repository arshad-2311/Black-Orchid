"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-gold-gradient"
    />
  );
}

export function StickyReserve() {
  const [show, setShow] = useState(false);
  const { view, setView } = useApp();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't show the sticky button on the reservation page itself
  const hidden = view === "reservation" || view === "admin";

  return (
    <>
      {/* Desktop floating button */}
      <motion.button
        initial={false}
        animate={{ scale: show && !hidden ? 1 : 0, opacity: show && !hidden ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onClick={() => setView("reservation")}
        className="ripple-container fixed bottom-7 right-7 z-40 hidden h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gold-gradient text-black glow-gold sm:flex"
        aria-label="Reserve a table"
        data-cursor="hover"
      >
        <span className="relative z-10 font-sans text-[10px] font-bold uppercase leading-tight tracking-wider">Book</span>
      </motion.button>

      {/* Mobile sticky bottom bar */}
      <AnimatePresence>
        {show && !hidden && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 sm:hidden"
          >
            <div className="glass-cinema border-t border-gold/20 px-4 pb-[env(safe-area-inset-bottom)] pt-3">
              <button
                onClick={() => setView("reservation")}
                className="ripple-container relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-gold-gradient font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black"
              >
                <span className="relative z-10">Reserve a Table</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
