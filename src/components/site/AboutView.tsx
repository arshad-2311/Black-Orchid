"use client";

import { motion } from "framer-motion";
import { Award, Clock, Leaf, Users } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { Eyebrow, LuxuryButton, OrnamentDivider, TextLink } from "./primitives";
import { ImageReveal, Parallax, RevealGroup, RevealItem, RevealText } from "./motion";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

const STATS = [
  { Icon: Award, value: "12+", label: "Culinary Awards" },
  { Icon: Users, value: "200K+", label: "Guests Served" },
  { Icon: Clock, value: "20+", label: "Years of Legacy" },
  { Icon: Leaf, value: "100%", label: "Fresh Ingredients" },
];

export function AboutView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[65vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.ambiance[1]} alt="" className="h-full w-full object-cover" />
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
            <Eyebrow className="mb-6 justify-center">Our Story</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="About" as="span" delay={0.2} className="inline-block" />
            <RevealText text="Black" as="span" delay={0.42} className="ml-3 inline-block sm:ml-5" />
            <RevealText text="Orchid" as="span" delay={0.62} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            Two decades of devotion, distilled into a single dining room.
          </motion.p>
        </div>
      </section>

      {/* ============== STORY — asymmetric 12-col ============== */}
      <section className="relative bg-background py-28 sm:py-36">
        <div className="ambient-orb pointer-events-none absolute top-32 right-[-8%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.05)" }} />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-24">
          {/* Image column — narrow */}
          <div className="lg:col-span-5 lg:col-start-1">
            <Parallax speed={0.15}>
              <ImageReveal src={IMAGES.interior[1]} alt="Black Orchid interior" rounded="rounded-[2rem]" className="aspect-[4/5]" />
            </Parallax>
            {/* Floating Est. card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="glass-gold-cinema relative z-10 -mt-16 ml-auto w-max rounded-2xl px-8 py-6 text-center lg:-mr-8"
            >
              <p className="font-[family-name:var(--font-playfair)] text-5xl font-semibold text-gold-gradient">Est. 2003</p>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">A Legacy Begins</p>
            </motion.div>
          </div>

          {/* Text column — wide */}
          <div className="lg:col-span-6 lg:col-start-7">
            <Eyebrow className="mb-7">Our Story</Eyebrow>
            <RevealText
              text={settings?.aboutTitle || "A Legacy of Culinary Excellence"}
              as="h2"
              className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
            />
            <OrnamentDivider className="my-8 !justify-start" />
            <RevealGroup className="space-y-5">
              <RevealItem>
                <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                  {settings?.aboutBody}
                </p>
              </RevealItem>
              <RevealItem>
                <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                  Every plate tells a story. Every visit, a chapter. We do not merely serve meals — we compose experiences, each a fleeting masterpiece designed to be remembered long after the last bite.
                </p>
              </RevealItem>
            </RevealGroup>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10"
            >
              <TextLink onClick={() => setView("menu")}>Discover the Menu</TextLink>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== STATS BAND ============== */}
      <section className="border-y border-white/[0.06] bg-[#080808] py-16 sm:py-20">
        <RevealGroup className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 sm:px-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                <s.Icon className="h-5 w-5" />
              </div>
              <p className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-gold-gradient sm:text-5xl">{s.value}</p>
              <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{s.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ============== PHILOSOPHY ============== */}
      <section className="relative bg-background py-28 sm:py-40">
        <div className="ambient-orb pointer-events-none absolute top-24 left-[-6%]" style={{ width: 380, height: 380, background: "rgba(212,175,55,0.05)" }} />
        <div className="ambient-orb pointer-events-none absolute bottom-24 right-[-6%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.04)", animationDelay: "-4s" }} />
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
          <Eyebrow className="mb-7 justify-center">Our Philosophy</Eyebrow>
          <RevealText
            text="Craft, sourced with devotion"
            as="h2"
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
          />
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mx-auto mt-10 max-w-3xl font-[family-name:var(--font-cormorant)] text-2xl italic leading-relaxed text-muted-foreground sm:text-3xl"
          >
            We believe dining is the oldest art form — a communion of craft, season, and company. Our chefs forage relationships with farmers, fishers, and artisans, translating their devotion onto every plate. Nothing leaves our kitchen that we would not proudly serve to our own family.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12"
          >
            <LuxuryButton variant="outline" onClick={() => setView("reservation")}>Reserve a Table</LuxuryButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
