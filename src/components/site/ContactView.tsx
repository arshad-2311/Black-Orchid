"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Send, Twitter } from "lucide-react";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealGroup, RevealItem, RevealText } from "./motion";
import { IMAGES } from "@/lib/images";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/types";

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15 sm:h-14 sm:text-base";

export function ContactView({ settings }: { settings: SiteSettings | null }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Message sent. We'll be in touch shortly. ✦");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const info = [
    { Icon: MapPin, label: "Address", value: settings?.address, href: undefined as string | undefined },
    { Icon: Phone, label: "Phone", value: settings?.phone, href: settings?.phone ? `tel:${settings.phone}` : undefined },
    { Icon: Mail, label: "Email", value: settings?.email, href: settings?.email ? `mailto:${settings.email}` : undefined },
    { Icon: Clock, label: "Weekday Hours", value: settings?.hoursWeekday, href: undefined },
  ];

  const socials = [
    { Icon: Instagram, href: settings?.instagram },
    { Icon: Facebook, href: settings?.facebook },
    { Icon: Twitter, href: settings?.twitter },
  ];

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.interior[3]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
            <RevealText text="Contact" as="span" delay={0.2} className="inline-block" />
            <RevealText text="Us" as="span" delay={0.45} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
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

      {/* ============== INFO + FORM ============== */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="ambient-orb pointer-events-none absolute top-32 left-[-8%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.05)" }} />
        <div className="ambient-orb pointer-events-none absolute bottom-32 right-[-8%]" style={{ width: 380, height: 380, background: "rgba(212,175,55,0.04)", animationDelay: "-4s" }} />

        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
          {/* Info */}
          <div>
            <Eyebrow className="mb-6">Visit Black Orchid</Eyebrow>
            <RevealText
              text="We would be delighted to host you"
              as="h2"
              className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-5xl"
            />
            <p className="mt-6 max-w-md font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-muted-foreground sm:text-2xl">
              Reach us by phone, email, or the form — our team responds within hours.
            </p>

            <RevealGroup className="mt-10 space-y-6">
              {info.map((it) => (
                <RevealItem key={it.label}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors duration-300 hover:bg-gold/10 sm:h-12 sm:w-12">
                      <it.Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">{it.label}</p>
                      {it.href ? (
                        <a href={it.href} className="block font-[family-name:var(--font-cormorant)] text-xl text-foreground transition-colors hover:text-gold sm:text-2xl">
                          {it.value}
                        </a>
                      ) : (
                        <p className="font-[family-name:var(--font-cormorant)] text-xl text-foreground sm:text-2xl">{it.value}</p>
                      )}
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <div className="mt-10">
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">Follow Us</p>
              <div className="mt-4 flex gap-3">
                {socials.map((s, i) => (
                  <motion.a
                    key={i}
                    href={s.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.25 }}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold/80 transition-colors duration-300 hover:border-gold hover:bg-gold/10 hover:text-gold sm:h-12 sm:w-12"
                  >
                    <s.Icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="glass-cinema rounded-[1.5rem] p-7 sm:p-9"
          >
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground sm:text-3xl">Send a Message</h3>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
              Share the occasion; we will compose the rest.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <Field label="Your Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="jane@email.com"
                />
              </Field>
              <Field label="Message">
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputClass} h-auto resize-none py-3`}
                  placeholder="How may we assist you?"
                />
              </Field>
              <LuxuryButton type="submit" variant="solid" disabled={loading} className="w-full min-h-[52px]">
                {loading ? "Sending…" : <>Send Message <Send className="h-4 w-4" /></>}
              </LuxuryButton>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ============== MAP ============== */}
      <section className="bg-background pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.06]">
            <iframe
              title="Black Orchid location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.70%2C-73.98%2C40.72&layer=mapnik&marker=40.71%2C-74.00"
              className="h-[400px] w-full grayscale contrast-110"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">{label}</span>
      {children}
    </label>
  );
}
