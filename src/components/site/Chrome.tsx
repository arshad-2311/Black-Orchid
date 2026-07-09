"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
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
  const { setView } = useApp();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.button
      initial={false}
      animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={() => setView("reservation")}
      className="ripple-container fixed bottom-7 right-7 z-40 hidden h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gold-gradient text-black glow-gold sm:flex"
      aria-label="Reserve a table"
      data-cursor="hover"
    >
      <span className="relative z-10 font-sans text-[10px] font-bold uppercase leading-tight tracking-wider">Book</span>
    </motion.button>
  );
}
