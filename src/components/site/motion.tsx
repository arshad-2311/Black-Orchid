"use client";

import { useRef, type ReactNode } from "react";
import {
  motion, useScroll, useTransform, useInView, useSpring, useMotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* Smooth spring-based scroll progress 0→1 for an element */
export function useElementScroll() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  return { ref, progress: smooth };
}

/* Reveal children with a stagger when scrolled into view */
export function RevealGroup({
  children, className, delay = 0, y = 30, once = true,
}: {
  children: ReactNode; className?: string; delay?: number; y?: number; once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

export function RevealItem({ children, className, y = 24 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } } }} className={className}>
      {children}
    </motion.div>
  );
}

/* Word-by-word text reveal with mask, triggered on scroll into view */
export function RevealText({
  text, className, as: Tag = "p", stagger = 0.06, delay = 0,
}: {
  text: string; className?: string; as?: "p" | "h1" | "h2" | "h3" | "span"; stagger?: number; delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="reveal-mask" aria-hidden>
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } } }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/* Parallax wrapper — moves child Y based on scroll */
export function Parallax({
  children, className, speed = 0.3,
}: {
  children: ReactNode; className?: string; speed?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* Image reveal with clip-path mask + subtle scale, on scroll into view */
export function ImageReveal({
  src, alt, className, imgClassName, rounded = "rounded-2xl",
}: {
  src: string; alt: string; className?: string; imgClassName?: string; rounded?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className={cn("relative overflow-hidden", rounded, className)}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        initial={{ clipPath: "inset(0 0 100% 0)", scale: 1.25 }}
        animate={inView ? { clipPath: "inset(0 0 0 0)", scale: 1.05 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}

/* Scroll-driven horizontal progress line */
export function ScrollLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });
  return (
    <div ref={ref} className={cn("h-px w-full bg-border overflow-hidden", className)}>
      <motion.div style={{ scaleX }} className="h-full origin-left bg-gold-gradient" />
    </div>
  );
}

/* Number that counts up when in view */
export function CountUp({ to, className, suffix = "" }: { to: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 60, damping: 20 });
  return (
    <motion.span
      ref={ref}
      className={className}
      onAnimationStart={() => {}}
    >
      <motion.span
        onViewportEnter={() => count.set(to)}
        style={{ display: "inline-block" }}
      >
        {inView && <Counter value={rounded} suffix={suffix} />}
      </motion.span>
    </motion.span>
  );
}

function Counter({ value, suffix }: { value: any; suffix: string }) {
  const display = useTransform(value, (v: number) => Math.round(v).toLocaleString() + suffix);
  return <motion.span>{display}</motion.span>;
}
