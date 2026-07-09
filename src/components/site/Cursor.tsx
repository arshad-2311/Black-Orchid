"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/* Custom desktop cursor: gold dot + trailing ring that grows on interactive hover.
   Always renders the (off-screen) divs so server and client markup match — avoids
   hydration mismatch. The cursor-host class (which hides the native cursor) and the
   mousemove listener are only attached on fine-pointer devices, inside the effect.
   On touch devices, the CSS @media (pointer: coarse) rule hides these divs. */
export function Cursor() {
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.5 });

  useEffect(() => {
    // Only activate on fine-pointer (desktop) devices
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("cursor-host");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement;
      setHovering(!!el.closest("a, button, [data-cursor='hover'], input, textarea, select, [role='button']"));
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.classList.remove("cursor-host");
    };
  }, [x, y]);

  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y, translateX: "-50%", translateY: "-50%" }} />
      <motion.div
        className="cursor-ring"
        style={{
          x: ringX, y: ringY, translateX: "-50%", translateY: "-50%",
          width: hovering ? 56 : 36, height: hovering ? 56 : 36,
          backgroundColor: hovering ? "rgba(212,175,55,0.12)" : "transparent",
          borderColor: hovering ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.6)",
        }}
      />
    </>
  );
}
