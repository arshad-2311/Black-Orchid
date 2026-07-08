"use client";

import { motion } from "framer-motion";
import { Check, Users, Sparkles, Music, Car, PartyPopper } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { Eyebrow, GoldButton, OrnamentDivider, SectionHeading } from "./primitives";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export function BanquetView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const amenities = [
    { Icon: Users, title: "Grand Capacity", desc: settings?.banquetCapacity || "Up to 300 guests" },
    { Icon: Music, title: "Stage & Sound", desc: "Professional stage, lighting, and acoustics" },
    { Icon: Car, title: "Valet Parking", desc: "Complimentary valet for all your guests" },
    { Icon: Sparkles, title: "Bespoke Décor", desc: "Full décor coordination by our events team" },
    { Icon: PartyPopper, title: "Dedicated Planner", desc: "An event manager at your side from start to finish" },
    { Icon: Check, title: "In-house Catering", desc: "Customisable multi-cuisine menus by our chefs" },
  ];

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-30">
          <img src={IMAGES.banquet[1]} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Banquet Facility</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            Celebrations of <span className="text-gold-gradient">Distinction</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            {settings?.banquetDesc}
          </p>
        </div>
      </section>

      {/* Showcase */}
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {IMAGES.banquet.slice(0, 3).map((url, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} className="overflow-hidden rounded-2xl">
              <img src={url} alt="Banquet" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="World-Class Amenities" title={<>Everything, <span className="text-gold-gradient">Anticipated</span></>} />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((a, i) => (
              <motion.div key={a.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="rounded-2xl border border-gold/10 bg-card/40 p-7">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <a.Icon className="h-5 w-5" />
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">{a.title}</h3>
                <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-gold relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold sm:text-5xl">
              Host Your <span className="text-gold-gradient">Milestone</span> With Us
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
              Weddings, galas, corporate dinners — let our team craft an occasion worthy of the occasion.
            </p>
            <div className="mt-8">
              <GoldButton onClick={() => setView("reservation")}>Enquire Now</GoldButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
