"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

export function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative flex h-20 w-20 items-center justify-center"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-gold/30 border-t-gold"
            />
            <UtensilsCrossed className="h-7 w-7 text-gold" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-wide text-foreground">
              Black Orchid
            </p>
            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.4em] text-gold/80">
              Fine Dining & Banquet
            </p>
          </motion.div>
          <div className="mt-6 h-px w-40 overflow-hidden bg-gold/15">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="h-full w-full bg-gold-gradient"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
