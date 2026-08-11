"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Premium context-aware cursor (desktop only).
 * States: default, hover (buttons/links), view (images/gallery), text (inputs),
 * drag (carousels), with optional label text for CTAs.
 */
type CursorState = "default" | "hover" | "view" | "drag" | "text";

const BASE_SIZE = 36;

export function Cursor() {
  const [state, setState] = useState<CursorState>("default");
  const [label, setLabel] = useState("");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 400, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 400, damping: 28, mass: 0.4 });
  const dotX = useSpring(x, { stiffness: 800, damping: 35 });
  const dotY = useSpring(y, { stiffness: 800, damping: 35 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("cursor-host");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      if (rafId.current !== null) return;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!el) return;

        const interactive = el.closest("a, button, [data-cursor='hover'], [role='button']");
        const imageView = el.closest("[data-cursor='view'], img[class*='object-cover'], .group img");
        const dragEl = el.closest("[data-cursor='drag'], .no-scrollbar");
        const textEl = el.closest("input, textarea, [contenteditable]");

        if (textEl) {
          setState("text");
          setLabel("");
        } else if (imageView) {
          setState("view");
          setLabel("");
        } else if (dragEl) {
          setState("drag");
          setLabel("");
        } else if (interactive) {
          setState("hover");
          const labeled = el.closest("[data-cursor-label]");
          setLabel(labeled?.getAttribute("data-cursor-label") || "");
        } else {
          setState("default");
          setLabel("");
        }
      });
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      document.documentElement.classList.remove("cursor-host");
    };
  }, [x, y]);

  const ringScale = {
    default: 1,
    hover: label ? 1.77 : 1.33,
    view: 1.55,
    drag: 1.44,
    text: 0.11,
  }[state];

  const ringBg = {
    default: "transparent",
    hover: label ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.08)",
    view: "rgba(212,175,55,0.06)",
    drag: "rgba(212,175,55,0.06)",
    text: "transparent",
  }[state];

  const ringBorder = {
    default: "rgba(212,175,55,0.4)",
    hover: "rgba(212,175,55,0.9)",
    view: "rgba(212,175,55,0.6)",
    drag: "rgba(212,175,55,0.5)",
    text: "transparent",
  }[state];

  return (
    <>
      {/* Gold dot — fast, precise */}
      <motion.div
        className="cursor-dot"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: state === "text" ? 0 : 1, scale: state === "hover" ? 0.5 : 1 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      />
      {/* Trailing ring — springy, context-aware, GPU-scaled */}
      <motion.div
        className="cursor-ring"
        style={{
          x: ringX, y: ringY, translateX: "-50%", translateY: "-50%",
          width: BASE_SIZE, height: BASE_SIZE,
          backgroundColor: ringBg,
          borderColor: ringBorder,
        }}
        animate={{ scale: ringScale }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Label text inside the ring (e.g. "View", "Reserve") */}
        {label && state === "hover" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 flex items-center justify-center font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-gold"
          >
            {label}
          </motion.span>
        )}
        {/* View icon */}
        {state === "view" && (
          <svg className="absolute inset-0 m-auto h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 5v2M12 17v2M5 12h2M17 12h2" strokeLinecap="round" />
          </svg>
        )}
        {/* Drag icon */}
        {state === "drag" && (
          <svg className="absolute inset-0 m-auto h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h8M8 12l3-3M8 12l3 3M16 12l-3-3M16 12l-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.div>
    </>
  );
}

