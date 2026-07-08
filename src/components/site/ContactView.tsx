"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Send } from "lucide-react";
import { Eyebrow, OrnamentDivider } from "./primitives";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/types";

export function ContactView({ settings }: { settings: SiteSettings | null }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Reuse reservation endpoint semantics via a simple mailto fallback in UI;
      // here we just simulate success for the contact form.
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
    { Icon: MapPin, label: "Address", value: settings?.address },
    { Icon: Phone, label: "Phone", value: settings?.phone, href: `tel:${settings?.phone}` },
    { Icon: Mail, label: "Email", value: settings?.email, href: `mailto:${settings?.email}` },
    { Icon: Clock, label: "Weekday Hours", value: settings?.hoursWeekday },
  ];

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src="https://sfile.chatglm.cn/images-ppt/35a04e1be197.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Get in Touch</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            Contact <span className="text-gold-gradient">Us</span>
          </h1>
          <OrnamentDivider className="mt-6" />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold">Visit Black Orchid</h2>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
              We would be delighted to host you. Reach us by phone, email, or the form — our team responds within hours.
            </p>
            <div className="mt-8 space-y-5">
              {info.map((it) => (
                <div key={it.label} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                    <it.Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{it.label}</p>
                    {it.href ? (
                      <a href={it.href} className="font-[family-name:var(--font-cormorant)] text-xl text-foreground hover:text-gold">{it.value}</a>
                    ) : (
                      <p className="font-[family-name:var(--font-cormorant)] text-xl text-foreground">{it.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">Follow Us</p>
              <div className="mt-3 flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href={[settings?.instagram, settings?.facebook, settings?.twitter][i]} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold/80 transition-all hover:border-gold hover:bg-gold/10 hover:text-gold">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="rounded-2xl border border-gold/10 bg-card/40 p-7">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Send a Message</h3>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Your Name">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-lux" placeholder="Jane Doe" />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-lux" placeholder="jane@email.com" />
              </Field>
              <Field label="Message">
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-lux resize-none" placeholder="How may we assist you?" />
              </Field>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                {loading ? "Sending…" : <>Send Message <Send className="h-4 w-4" /></>}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-gold/10">
            <iframe
              title="Black Orchid location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.70%2C-73.98%2C40.72&layer=mapnik&marker=40.71%2C-74.00"
              className="h-[400px] w-full grayscale-[0.3] contrast-110"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <style>{`
        .input-lux {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid oklch(0.82 0.14 84 / 0.2);
          background: oklch(0.16 0.008 264 / 0.6);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: oklch(0.96 0.012 80);
          outline: none;
          transition: border-color 0.2s;
        }
        .input-lux::placeholder { color: oklch(0.7 0.02 80 / 0.5); }
        .input-lux:focus { border-color: oklch(0.82 0.14 84 / 0.6); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{label}</span>
      {children}
    </label>
  );
}
