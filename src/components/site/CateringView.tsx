"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Phone } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { CateringPackage, SiteSettings } from "@/lib/types";
import { IMAGES } from "@/lib/images";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { ImageReveal, RevealGroup, RevealItem, RevealText } from "./motion";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", title: "Consultation", desc: "We meet to understand your occasion, your guests, your vision." },
  { n: "02", title: "Custom Menu", desc: "Our chef composes a bespoke menu tuned to your palate and theme." },
  { n: "03", title: "Tasting", desc: "A private tasting refines every dish before the day arrives." },
  { n: "04", title: "The Event", desc: "Our brigade arrives, sets, and orchestrates an effortless evening." },
];

export function CateringView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [packages, setPackages] = useState<CateringPackage[] | null>(null);

  useEffect(() => {
    apiGet<CateringPackage[]>("/api/catering").then(setPackages).catch(() => {});
  }, []);

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[65vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.food[5]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }}
        />

        <div className="ambient-orb" style={{ width: 440, height: 440, background: "rgba(212,175,55,0.14)", top: "16%", left: "6%" }} />
        <div className="ambient-orb" style={{ width: 540, height: 540, background: "rgba(212,175,55,0.08)", bottom: "4%", right: "4%", animationDelay: "-5s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Catering Services</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="Catering" as="span" delay={0.2} className="inline-block" />
            <RevealText text="Par" as="span" delay={0.4} className="ml-3 inline-block sm:ml-5" />
            <RevealText text="Excellence" as="span" delay={0.6} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            Bring the Black Orchid experience to your venue — bespoke menus, impeccable service, unforgettable flavour.
          </motion.p>
        </div>
      </section>

      {/* ============== PACKAGES ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="ambient-orb pointer-events-none absolute top-32 right-[-8%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.05)" }} />
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-6">Curated Packages</Eyebrow>
            <RevealText
              text="Choose your experience"
              as="h2"
              className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
            />
          </div>

          <RevealGroup className="mt-14 grid gap-6 lg:grid-cols-3">
            {(packages ?? []).map((p, i) => {
              const popular = i === 1;
              const features = p.features ? p.features.split("|").map((f) => f.trim()).filter(Boolean) : [];
              return (
                <RevealItem key={p.id} className="h-full">
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border bg-card",
                      popular ? "border-gold/50" : "border-white/[0.06]"
                    )}
                  >
                    {popular && (
                      <span className="absolute right-5 top-5 z-20 rounded-full bg-gold-gradient px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-black glow-gold">
                        Most Popular
                      </span>
                    )}
                    {p.image && (
                      <div className="relative">
                        <ImageReveal
                          src={p.image}
                          alt={p.name}
                          rounded="rounded-none"
                          className="aspect-[16/10]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-7">
                      <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{p.name}</h3>
                      <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.25em] text-gold">{p.guests}</p>
                      <p className="mt-4 font-[family-name:var(--font-cormorant)] text-lg italic leading-snug text-muted-foreground">{p.description}</p>
                      <div className="mt-6 flex items-baseline gap-1.5">
                        <span className="font-[family-name:var(--font-playfair)] text-5xl font-semibold text-gold-gradient">${p.price}</span>
                        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">/ guest</span>
                      </div>
                      <div className="my-6 h-px w-full bg-white/[0.06]" />
                      <ul className="flex-1 space-y-3">
                        {features.map((f, j) => (
                          <li key={j} className="flex items-start gap-3 font-sans text-sm text-foreground/80">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                              <Check className="h-3 w-3" />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8">
                        <LuxuryButton
                          variant={popular ? "solid" : "outline"}
                          onClick={() => setView("reservation")}
                          className="w-full"
                        >
                          Enquire <ArrowRight className="h-4 w-4" />
                        </LuxuryButton>
                      </div>
                    </div>
                  </motion.div>
                </RevealItem>
              );
            })}
          </RevealGroup>

          {packages && packages.length === 0 && (
            <p className="mt-16 text-center font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
              No catering packages are listed at the moment. Please call us for a bespoke quote.
            </p>
          )}
        </div>
      </section>

      {/* ============== PROCESS ============== */}
      <section className="relative border-t border-white/[0.06] bg-[#080808] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-6">How It Works</Eyebrow>
            <RevealText
              text="A seamless process"
              as="h2"
              className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
            />
          </div>
          <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <RevealItem key={s.n}>
                <div className="text-center sm:text-left">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-gold sm:mx-0">
                    {s.n}
                  </div>
                  <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic leading-snug text-muted-foreground">{s.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Phone CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="mt-16 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-12 text-center"
          >
            <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Speak with our events team</p>
            <a
              href={`tel:${(settings?.phone || "+919585018502").replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-3 font-[family-name:var(--font-cormorant)] text-3xl italic text-gold transition-colors hover:text-gold/80 sm:text-4xl"
            >
              <Phone className="h-6 w-6" />
              {settings?.phone || "+91 95850 18502"}
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
