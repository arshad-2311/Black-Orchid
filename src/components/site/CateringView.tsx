"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { CateringPackage, SiteSettings } from "@/lib/types";
import { Eyebrow, GoldButton, OrnamentDivider, SectionHeading } from "./primitives";
import { useApp } from "@/lib/store";

export function CateringView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [packages, setPackages] = useState<CateringPackage[]>([]);

  useEffect(() => {
    apiGet<CateringPackage[]>("/api/catering").then(setPackages).catch(() => {});
  }, []);

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src="https://sfile.chatglm.cn/images-ppt/ba5e7246e599.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Catering Services</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            Catering <span className="text-gold-gradient">Par Excellence</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            Bring the Black Orchid experience to your venue — bespoke menus, impeccable service, unforgettable flavour.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Curated Packages" title={<>Choose Your <span className="text-gold-gradient">Experience</span></>} />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {packages.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border p-7 ${i === 1 ? "border-gold/50 bg-card/60" : "border-gold/10 bg-card/30"}`}
              >
                {i === 1 && (
                  <span className="absolute right-5 top-5 rounded-full bg-gold-gradient px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-black">
                    Most Popular
                  </span>
                )}
                {p.image && (
                  <div className="mb-5 overflow-hidden rounded-xl">
                    <img src={p.image} alt={p.name} className="aspect-[16/10] w-full object-cover" />
                  </div>
                )}
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{p.name}</h3>
                <p className="mt-1 font-sans text-xs uppercase tracking-wider text-gold">{p.guests}</p>
                <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">{p.description}</p>
                <div className="my-5 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-gold-gradient">${p.price}</span>
                  <span className="font-sans text-xs text-muted-foreground">/ guest</span>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {p.features.split("|").map((f, j) => (
                    <li key={j} className="flex gap-2 font-sans text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <GoldButton variant={i === 1 ? "solid" : "outline"} className="w-full" onClick={() => setView("reservation")}>
                    Enquire <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-gold/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How It Works" title={<>A Seamless <span className="text-gold-gradient">Process</span></>} />
          <div className="mt-14 grid gap-8 sm:grid-cols-4">
            {["Consultation", "Custom Menu", "Tasting", "The Event"].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-gold">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">{step}</h3>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a href={`tel:${settings?.phone}`} className="font-[family-name:var(--font-cormorant)] text-2xl italic text-gold hover:underline">
              {settings?.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
