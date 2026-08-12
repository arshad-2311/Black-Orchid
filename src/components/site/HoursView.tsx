"use client";

import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealGroup, RevealItem, RevealText } from "./motion";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export function HoursView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();

  const days = [
    { day: "Monday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Tuesday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Wednesday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Thursday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Friday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Saturday", hours: settings?.hoursWeekend || "10:00 AM – 12:30 AM" },
    { day: "Sunday", hours: settings?.hoursWeekend || "10:00 AM – 12:30 AM" },
  ];
  const today = new Date().toLocaleDateString("en", { weekday: "long" });

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.ambiance[2]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }}
        />

        <div className="ambient-orb" style={{ width: 420, height: 420, background: "rgba(212,175,55,0.14)", top: "16%", left: "6%" }} />
        <div className="ambient-orb" style={{ width: 520, height: 520, background: "rgba(212,175,55,0.08)", bottom: "4%", right: "4%", animationDelay: "-5s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Plan Your Visit</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="Visiting" as="span" delay={0.05} className="inline-block" />
            <RevealText text="Hours" as="span" delay={0.10} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            We welcome you throughout the week. Reservations are recommended for evenings and weekends.
          </motion.p>
        </div>
      </section>

      {/* ============== HOURS TABLE + NOTE ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="ambient-orb pointer-events-none absolute top-32 left-[-8%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.05)" }} />
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card">
            <RevealGroup>
              {days.map((d, i) => {
                const isToday = d.day === today;
                return (
                  <RevealItem key={d.day}>
                    <motion.div
                      initial={false}
                      className={cnRow(i, days.length, isToday)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 text-gold sm:h-10 sm:w-10">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                        <span className="font-[family-name:var(--font-playfair)] text-xl text-foreground sm:text-2xl">{d.day}</span>
                        {isToday && (
                          <span className="rounded-full bg-gold-gradient px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground sm:text-xl">
                        <Clock className="h-4 w-4 text-gold/60" />
                        {d.hours}
                      </span>
                    </motion.div>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>

          {/* Note card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="glass-gold-cinema relative mt-8 overflow-hidden rounded-[1.5rem] p-8 text-center sm:p-10"
          >
            <div className="ambient-orb" style={{ width: 240, height: 240, background: "rgba(212,175,55,0.12)", top: "-20%", right: "0%" }} />
            <p className="relative font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-foreground/90 sm:text-2xl">
              The kitchen takes its last orders 90 minutes before closing. Walk-ins are welcome, subject to availability.
            </p>
            <div className="relative mt-7">
              <LuxuryButton variant="solid" onClick={() => setView("reservation")}>Reserve a Table</LuxuryButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function cnRow(i: number, len: number, today: boolean) {
  const divider = i < len - 1 ? "border-b border-white/[0.06]" : "";
  const bg = today ? "bg-gold/[0.06]" : "";
  return `flex items-center justify-between px-6 py-5 transition-colors duration-300 sm:px-8 sm:py-6 ${divider} ${bg}`;
}
