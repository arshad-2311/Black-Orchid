"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* Ornamental divider with a central diamond */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-gold", className)}>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70" />
      <span className="text-gold/90">✦</span>
      <span className="h-px w-24 bg-gold/40" />
      <span className="text-gold/90">✦</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  );
}

/* Section eyebrow label */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block font-sans text-xs font-medium uppercase tracking-[0.35em] text-gold/90",
        className
      )}
    >
      {children}
    </span>
  );
}

/* Animated section heading */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(center ? "text-center mx-auto" : "text-left", "max-w-2xl", className)}
    >
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {center && <OrnamentDivider className="mt-6" />}
      {subtitle && (
        <p className="mt-5 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground sm:text-xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* Gold pill button */
export function GoldButton({
  children,
  className,
  variant = "solid",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    solid:
      "bg-gold-gradient text-black shadow-[0_8px_30px_-8px_oklch(0.82_0.14_84/0.5)] hover:shadow-[0_12px_40px_-8px_oklch(0.82_0.14_84/0.7)] hover:-translate-y-0.5",
    outline:
      "border border-gold/50 text-gold hover:bg-gold/10 hover:border-gold",
    ghost: "text-gold hover:bg-gold/10",
  } as const;
  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* Spice level indicator (chili dots) */
export function SpiceLevel({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400/90" title={`Spice level ${level}`}>
      {Array.from({ length: level }).map((_, i) => (
        <span key={i}>●</span>
      ))}
    </span>
  );
}

/* Veg / Non-veg badge */
export function VegBadge({ veg }: { veg: boolean }) {
  return (
    <span
      title={veg ? "Vegetarian" : "Non-Vegetarian"}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-[3px] border",
        veg ? "border-green-500/70" : "border-red-500/70"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", veg ? "bg-green-500" : "bg-red-500")} />
    </span>
  );
}
