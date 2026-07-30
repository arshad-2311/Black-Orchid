"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RevealText } from "./motion";
import { useMagnetic } from "./premium-motion";

/* =========================================================
   EYEBROW — small uppercase label with leading gold mark
   ========================================================= */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 font-sans text-[11px] font-medium uppercase tracking-[0.35em] text-gold", className)}>
      <span className="h-px w-8 bg-gold/60" />
      {children}
    </span>
  );
}

/* =========================================================
   DISPLAY HEADING — massive editorial, word-by-word reveal
   ========================================================= */
export function DisplayHeading({
  children, className, as = "h2", stagger = 0.08,
}: {
  children: string; className?: string; as?: "h1" | "h2" | "h3"; stagger?: number;
}) {
  return (
    <RevealText
      text={children}
      as={as}
      stagger={stagger}
      className={cn("font-[family-name:var(--font-playfair)] font-semibold leading-[1.02] tracking-luxe text-foreground", className)}
    />
  );
}

/* =========================================================
   SECTION HEADING — eyebrow + display + optional subtitle
   ========================================================= */
export function SectionHeading({
  eyebrow, title, subtitle, center = false, className,
}: {
  eyebrow?: string; title: string; subtitle?: string; center?: boolean; className?: string;
}) {
  return (
    <div className={cn(center ? "text-center mx-auto" : "text-left", "max-w-3xl", className)}>
      {eyebrow && <Eyebrow className={cn("mb-6", center && "justify-center")}>{eyebrow}</Eyebrow>}
      <DisplayHeading as="h2" className={cn("text-4xl sm:text-5xl lg:text-6xl", center && "mx-auto")}>
        {title}
      </DisplayHeading>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={cn("mt-6 font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-muted-foreground sm:text-2xl", center && "mx-auto")}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/* =========================================================
   LUXURY BUTTON — gold gradient, glow, ripple, micro-interaction
   ========================================================= */
export function LuxuryButton({
  children, className, variant = "solid", onClick, type = "button", disabled, magnetic = true,
}: {
  children: ReactNode; className?: string; variant?: "solid" | "outline" | "ghost";
  onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; magnetic?: boolean;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);
  const magRef = useMagnetic<HTMLButtonElement>({ strength: 0.25 });

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = idRef.current++;
    setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
    onClick?.();
  };

  const base = "ripple-container relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
  const variants = {
    solid: "bg-gold-gradient text-black glow-gold-hover hover:-translate-y-0.5",
    outline: "border border-gold/40 text-gold hover:bg-gold/8 hover:border-gold/70 backdrop-blur-sm",
    ghost: "text-gold hover:bg-gold/8",
  } as const;

  return (
    <button
      ref={magnetic ? magRef : undefined}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={cn(base, variants[variant], className)}
    >
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: 12, height: 12, marginLeft: -6, marginTop: -6 }} />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
    </button>
  );
}

/* =========================================================
   TEXT LINK — animated underline
   ========================================================= */
export function TextLink({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("group relative inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.25em] text-foreground transition-colors hover:text-gold", className)}
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-400 group-hover:w-full" />
      </span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
    </button>
  );
}

/* =========================================================
   ORNAMENT DIVIDER — minimal hairline with gold center
   ========================================================= */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
      <span className="text-gold/70 text-xs">✦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

/* =========================================================
   BADGES & INDICATORS
   ========================================================= */
export function SpiceLevel({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-400/90" title={`Spice level ${level}`}>
      {Array.from({ length: level }).map((_, i) => <span key={i}>●</span>)}
    </span>
  );
}

export function VegBadge({ veg }: { veg: boolean }) {
  return (
    <span title={veg ? "Vegetarian" : "Non-Vegetarian"} className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[3px] border", veg ? "border-emerald-500/70" : "border-red-500/70")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", veg ? "bg-emerald-500" : "bg-red-500")} />
    </span>
  );
}
