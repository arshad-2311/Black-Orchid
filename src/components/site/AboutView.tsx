"use client";

import { motion } from "framer-motion";
import { Award, Clock, Leaf, Users } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { Eyebrow, GoldButton, OrnamentDivider, SectionHeading } from "./primitives";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export function AboutView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const stats = [
    { Icon: Award, value: "12+", label: "Culinary Awards" },
    { Icon: Users, value: "200K+", label: "Guests Served" },
    { Icon: Clock, value: "20+", label: "Years of Legacy" },
    { Icon: Leaf, value: "100%", label: "Fresh Ingredients" },
  ];

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src={IMAGES.ambiance[1]} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Our Story</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            About <span className="text-gold-gradient">Black Orchid</span>
          </h1>
          <OrnamentDivider className="mt-6" />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <img src={IMAGES.interior[1]} alt="Interior" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            <div className="glass-gold absolute -bottom-6 -left-6 rounded-2xl px-6 py-4">
              <p className="font-[family-name:var(--font-playfair)] text-3xl text-gold">Est. 2003</p>
              <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">A Legacy Begins</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight sm:text-5xl">
              {settings?.aboutTitle || "A Legacy of Culinary Excellence"}
            </h2>
            <OrnamentDivider className="mt-6 !justify-start" />
            <p className="mt-6 font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground">
              {settings?.aboutBody}
            </p>
            <p className="mt-4 font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground">
              Every plate tells a story. Every visit, a chapter. At Black Orchid, we do not merely serve meals — we compose experiences, each one a fleeting masterpiece designed to be remembered long after the last bite.
            </p>
            <div className="mt-8">
              <GoldButton onClick={() => setView("menu")}>Discover the Menu</GoldButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gold/10 bg-card/30 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center">
              <s.Icon className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-gold-gradient">{s.value}</p>
              <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Philosophy"
            title={<>Craft, Sourced with <span className="text-gold-gradient">Devotion</span></>}
          />
          <p className="mt-8 font-[family-name:var(--font-cormorant)] text-2xl italic leading-relaxed text-muted-foreground">
            We believe dining is the oldest art form — a communion of craft, season, and company. Our chefs forage relationships with farmers, fishers, and artisans, translating their devotion onto every plate. Nothing leaves our kitchen that we would not proudly serve to our own family.
          </p>
        </div>
      </section>
    </div>
  );
}
