"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gold-gradient"
    />
  );
}

export function StickyReserve() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.button
      initial={false}
      animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={() => {
        import("@/lib/store").then(({ useApp }) => useApp.getState().setView("reservation"));
      }}
      className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-black shadow-[0_10px_30px_-6px_oklch(0.82_0.14_84/0.6)] sm:flex"
      aria-label="Reserve a table"
    >
      <span className="font-sans text-[10px] font-bold uppercase leading-tight tracking-wider">
        Book
      </span>
    </motion.button>
  );
}
