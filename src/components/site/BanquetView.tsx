"use client";

import { motion } from "framer-motion";
import { Car, Check, Music, PartyPopper, Sparkles, Users } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { ImageReveal, RevealGroup, RevealItem, RevealText } from "./motion";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export function BanquetView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();

  const amenities = [
    { Icon: Users, title: "Grand Capacity", desc: settings?.banquetCapacity || "Up to 300 guests" },
    { Icon: Music, title: "Stage & Sound", desc: "Professional stage, lighting, and acoustics engineered for the room." },
    { Icon: Car, title: "Valet Parking", desc: "Complimentary valet service for every guest, from arrival to encore." },
    { Icon: Sparkles, title: "Bespoke Décor", desc: "Full décor coordination by our in-house events atelier." },
    { Icon: PartyPopper, title: "Dedicated Planner", desc: "An event manager at your side from first idea to final toast." },
    { Icon: Check, title: "In-house Catering", desc: "Customisable multi-cuisine menus composed by our master chefs." },
  ];

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[65vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.banquet[1]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }}
        />

        <div className="ambient-orb" style={{ width: 440, height: 440, background: "rgba(212,175,55,0.14)", top: "14%", left: "6%" }} />
        <div className="ambient-orb" style={{ width: 540, height: 540, background: "rgba(212,175,55,0.08)", bottom: "2%", right: "4%", animationDelay: "-5s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Banquet Facility</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="Celebrations" as="span" delay={0.2} className="inline-block" />
            <RevealText text="of" as="span" delay={0.4} className="ml-3 inline-block sm:ml-5" />
            <RevealText text="Distinction" as="span" delay={0.6} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            {settings?.banquetDesc || "Weddings, galas, and milestone moments — composed with quiet theatre."}
          </motion.p>
        </div>
      </section>

      {/* ============== SHOWCASE — staggered parallax grid ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <RevealGroup className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {IMAGES.banquet.slice(0, 3).map((url, i) => (
              <RevealItem key={i} className={i === 1 ? "lg:-mt-10 lg:mb-10" : ""}>
                <ImageReveal
                  src={url}
                  alt={`Banquet space ${i + 1}`}
                  rounded="rounded-[1.5rem]"
                  className="aspect-[4/5]"
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============== AMENITIES ============== */}
      <section className="relative bg-background pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-6">World-Class Amenities</Eyebrow>
            <RevealText
              text="Everything, anticipated"
              as="h2"
              className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
            />
          </div>
          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((a) => (
              <RevealItem key={a.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="group h-full rounded-[1.25rem] border border-white/[0.06] bg-card p-8 transition-colors duration-300 hover:bg-[#181818]"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors duration-300 group-hover:bg-gold/10">
                    <a.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic leading-snug text-muted-foreground">{a.desc}</p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============== CTA — glass gold ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="glass-gold-cinema relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-16 sm:py-20">
            <div className="ambient-orb" style={{ width: 320, height: 320, background: "rgba(212,175,55,0.14)", top: "-8%", left: "4%" }} />
            <div className="ambient-orb" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.08)", bottom: "-10%", right: "2%", animationDelay: "-4s" }} />
            <div className="relative z-10">
              <Eyebrow className="mb-6 justify-center">Enquire</Eyebrow>
              <RevealText
                text="Host your milestone with us"
                as="h2"
                className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-5xl"
              />
              <p className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-muted-foreground sm:text-2xl">
                Weddings, galas, corporate dinners — let our team craft an occasion worthy of the occasion.
              </p>
              <div className="mt-10">
                <LuxuryButton variant="solid" onClick={() => setView("reservation")}>Enquire Now</LuxuryButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
