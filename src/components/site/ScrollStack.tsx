"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * ScrollStack — pins cards and stacks them elegantly while scrolling.
 * Each card sticks at the top of the viewport, and the next card slides over it
 * with a subtle scale + opacity transition.
 *
 * Used only for storytelling sections (not everywhere).
 * Respects prefers-reduced-motion (renders as a simple stack).
 */
export function ScrollStack({
  cards,
  className,
}: {
  cards: {
    image: string;
    alt: string;
    eyebrow: string;
    title: string;
    description: string;
    cta?: { label: string; onClick: () => void };
  }[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Reduced motion: render as a simple vertical stack
  if (reducedMotion) {
    return (
      <div className={cn("space-y-8", className)}>
        {cards.map((card, i) => (
          <StackCard key={i} card={card} index={i} total={cards.length} progress={0} />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)} style={{ height: `${cards.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {cards.map((card, i) => (
          <StackCardWrapper key={i} card={card} index={i} total={cards.length} containerRef={containerRef} />
        ))}
      </div>
    </div>
  );
}

function StackCardWrapper({
  card, index, total, containerRef,
}: {
  card: any;
  index: number;
  total: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Each card becomes visible/hidden based on scroll progress
  // Card i is "active" between i/total and (i+1)/total
  const start = index / total;
  const end = (index + 1) / total;

  const opacity = useTransform(scrollYProgress, [start - 0.1, start, end, end + 0.05], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [start, end], [1, 0.92]);
  const y = useTransform(scrollYProgress, [start, end], [0, -40]);
  // Cards behind get slightly dimmed
  const filter = useTransform(scrollYProgress, [start, end], ["brightness(1)", "brightness(0.6)"]);

  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-10"
    >
      <StackCard card={card} index={index} total={total} progress={0} />
    </motion.div>
  );
}

function StackCard({ card, index, total }: { card: any; index: number; total: number; progress: number }) {
  return (
    <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/[0.06] bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
      <div className="grid lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[70vh]">
          <img
            src={card.image}
            alt={card.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          {/* Card number */}
          <span className="absolute left-6 top-6 font-[family-name:var(--font-playfair)] text-6xl font-bold text-white/[0.08]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        {/* Content */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-gold/80">
            {card.eyebrow}
          </span>
          <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
            {card.title}
          </h3>
          <p className="mt-5 max-w-md font-[family-name:var(--font-cormorant)] text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
            {card.description}
          </p>
          {card.cta && (
            <button
              onClick={card.cta.onClick}
              className="ripple-container relative mt-8 inline-flex w-max overflow-hidden rounded-full border border-gold/40 px-7 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold/10 hover:border-gold"
            >
              <span className="relative z-10">{card.cta.label} →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
