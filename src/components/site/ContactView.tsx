"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealGroup, RevealItem, RevealText } from "./motion";
import { IMAGES } from "@/lib/images";
import type { SiteSettings } from "@/lib/types";

const OFFICIAL_INSTAGRAM = "https://www.instagram.com/blackorchid_annanagar/?hl=en";

export function ContactView({ settings }: { settings: SiteSettings | null }) {
  const instagramUrl = (settings?.instagram && settings.instagram.includes("instagram.com"))
    ? settings.instagram
    : OFFICIAL_INSTAGRAM;

  const info = [
    {
      Icon: MapPin,
      label: "Address",
      content: (
        <p className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-foreground sm:text-3xl max-w-lg mx-auto leading-snug">
          {settings?.address || "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102"}
        </p>
      ),
    },
    {
      Icon: Phone,
      label: "Phone",
      content: (
        <a
          href={`tel:${(settings?.phone || "+919585018502").replace(/\s+/g, "")}`}
          className="mt-1 block font-[family-name:var(--font-cormorant)] text-2xl text-foreground transition-colors hover:text-gold sm:text-3xl"
        >
          {settings?.phone || "+91 95850 18502"}
        </a>
      ),
    },
    {
      Icon: Mail,
      label: "Email",
      content: (
        <a
          href={`mailto:${settings?.email || "boan.reservations@gmail.com"}`}
          className="mt-1 block font-[family-name:var(--font-cormorant)] text-2xl text-foreground transition-colors hover:text-gold sm:text-3xl"
        >
          {settings?.email || "boan.reservations@gmail.com"}
        </a>
      ),
    },
    {
      Icon: Clock,
      label: "Opening Hours",
      content: (
        <p className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-foreground sm:text-3xl">
          Monday – Sunday: {settings?.hoursWeekday || "11:00 AM – 11:00 PM"}
        </p>
      ),
    },
  ];

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.interior[3]} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
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
            <Eyebrow className="mb-6 justify-center">Get in Touch</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="Contact" as="span" delay={0.05} className="inline-block" />
            <RevealText text="Us" as="span" delay={0.10} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            We would be delighted to host you. Our team responds within hours.
          </motion.p>
        </div>
      </section>

      {/* ============== CENTERED CONTACT DETAILS ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="ambient-orb pointer-events-none absolute top-32 left-1/2 -translate-x-1/2" style={{ width: 460, height: 460, background: "rgba(212,175,55,0.06)" }} />

        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <Eyebrow className="mb-6 justify-center">Visit Black Orchid</Eyebrow>
          <RevealText
            text="We would be delighted to host you"
            as="h2"
            className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-5xl"
          />
          <p className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-muted-foreground sm:text-2xl">
            Reach us directly by phone, email, or visit our restobar in Anna Nagar East.
          </p>

          <RevealGroup className="mt-12 space-y-7">
            {info.map((it) => (
              <RevealItem key={it.label}>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors duration-300 hover:bg-gold/10">
                    <it.Icon className="h-5 w-5" />
                  </div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">{it.label}</p>
                  {it.content}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Luxury Instagram Showcase Pill Card */}
          <div className="mt-16 flex flex-col items-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-4">Follow Our Journey</p>
            <motion.a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="group relative flex items-center gap-4 rounded-full border border-gold/35 bg-gradient-to-r from-card via-card/90 to-gold/[0.1] px-7 py-3.5 shadow-2xl transition-all duration-300 hover:border-gold hover:shadow-[0_8px_30px_rgba(212,175,55,0.22)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-rose-600 to-purple-600 p-[1.5px] text-white shadow-md">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-black/80 transition-colors group-hover:bg-transparent">
                  <Instagram className="h-5 w-5 text-gold group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="text-left">
                <span className="block font-[family-name:var(--font-playfair)] text-base font-semibold tracking-wide text-foreground group-hover:text-gold transition-colors">
                  @blackorchid_annanagar
                </span>
                <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Instagram • Official Handle
                </span>
              </div>

              <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-gold transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-gold group-hover:bg-gold group-hover:text-black">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ============== MAP & DIRECTIONS ============== */}
      <section className="bg-background pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12 text-center">
            <Eyebrow className="mb-4 justify-center">Location & Navigation</Eyebrow>
            <h3 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">
              Anna Nagar East, Chennai
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {settings?.address || "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102"}
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href={settings?.mapEmbed || "https://maps.google.com/?q=Black+Orchid+Anna+Nagar+East+Chennai"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LuxuryButton variant="solid">
                  <MapPin className="h-4 w-4" /> Get Directions
                </LuxuryButton>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
