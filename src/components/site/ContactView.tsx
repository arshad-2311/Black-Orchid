"use client";

import { motion } from "framer-motion";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealGroup, RevealItem, RevealText } from "./motion";
import { IMAGES } from "@/lib/images";
import type { SiteSettings } from "@/lib/types";

export function ContactView({ settings }: { settings: SiteSettings | null }) {
  const info = [
    { Icon: MapPin, label: "Address", value: settings?.address || "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102", href: undefined as string | undefined },
    { Icon: Phone, label: "Primary Contact", value: settings?.phone || "+91 95850 18502", href: `tel:${(settings?.phone || "+919585018502").replace(/\s+/g, "")}` },
    ...(settings?.phoneSecondary ? [{ Icon: Phone, label: "Secondary Contact", value: settings.phoneSecondary, href: `tel:${settings.phoneSecondary.replace(/\s+/g, "")}` }] : []),
    { Icon: Mail, label: "Email", value: settings?.email || "boan.reservations@gmail.com", href: `mailto:${settings?.email || "boan.reservations@gmail.com"}` },
    { Icon: Clock, label: "Opening Hours", value: `Monday – Sunday: ${settings?.hoursWeekday || "11:00 AM – 11:00 PM"}`, href: undefined },
  ];

  const socials = [
    ...(settings?.facebook ? [{ Icon: Facebook, href: settings.facebook }] : [{ Icon: Facebook, href: "https://www.facebook.com/blackorchidchennai/" }]),
    ...(settings?.instagram ? [{ Icon: Instagram, href: settings.instagram }] : []),
    ...(settings?.twitter ? [{ Icon: Twitter, href: settings.twitter }] : []),
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

          <RevealGroup className="mt-12 space-y-8">
            {info.map((it) => (
              <RevealItem key={it.label}>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors duration-300 hover:bg-gold/10">
                    <it.Icon className="h-5 w-5" />
                  </div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">{it.label}</p>
                  {it.href ? (
                    <a href={it.href} className="mt-1 block font-[family-name:var(--font-cormorant)] text-2xl text-foreground transition-colors hover:text-gold sm:text-3xl">
                      {it.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-foreground sm:text-3xl">{it.value}</p>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-14 flex flex-col items-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">Follow Us</p>
            <div className="mt-4 flex justify-center gap-4">
              {socials.map((s, i) => (
                <motion.a
                  key={i}
                  href={s.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 text-gold/80 transition-colors duration-300 hover:border-gold hover:bg-gold/10 hover:text-gold"
                >
                  <s.Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
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
