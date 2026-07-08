"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/* Cinematic intro loader — black screen, gold mark draws in, then curtain lifts */
export function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* ambient glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="ambient-orb"
            style={{ width: 300, height: 300, background: "rgba(212,175,55,0.15)", top: "30%", left: "40%" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/80"
            >
              Est. 2003
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.04em" }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 font-[family-name:var(--font-playfair)] text-5xl font-semibold text-foreground sm:text-7xl"
            >
              Black <span className="text-gold-gradient">Orchid</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.9 }}
              className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground"
            >
              Fine Dining & Banquet
            </motion.p>
          </motion.div>

          {/* progress line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="h-full origin-left bg-gold-gradient"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
