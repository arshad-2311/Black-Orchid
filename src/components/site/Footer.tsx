"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock, ArrowUpRight, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp, type ViewKey } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";
import { toast } from "sonner";

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");

  const links: { label: string; view: ViewKey }[] = [
    { label: "About", view: "about" },
    { label: "Menu", view: "menu" },
    { label: "Banquet", view: "banquet" },
    { label: "Gallery", view: "gallery" },
    { label: "Catering", view: "catering" },
    { label: "Hours", view: "hours" },
    { label: "Reserve", view: "reservation" },
    { label: "Contact", view: "contact" },
  ];

  const socials = [
    { Icon: Instagram, href: settings?.instagram },
    { Icon: Facebook, href: settings?.facebook },
    { Icon: Twitter, href: settings?.twitter },
  ];

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Newsletter band */}
        <div className="grid gap-10 border-b border-white/[0.06] py-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-gold/80">Inner Circle</p>
            <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              An invitation to the <span className="text-gold-gradient">extraordinary</span>
            </h3>
          </motion.div>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            onSubmit={(e) => { e.preventDefault(); if (email) { toast.success("Welcome to the inner circle ✦"); setEmail(""); } }}
            className="flex items-center gap-3"
          >
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-14 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none transition-colors"
            />
            <button type="submit" className="ripple-container relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-7 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-black glow-gold-hover">
              <Send className="relative z-10 h-4 w-4" /><span className="relative z-10 hidden sm:inline">Subscribe</span>
            </button>
          </motion.form>
        </div>

        {/* Main footer grid */}
        <div className="grid gap-12 py-16 md:grid-cols-4">
          {/* Brand + socials */}
          <div className="md:col-span-1">
            <h4 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">
              {settings?.restaurantName || "Black Orchid"}
            </h4>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
              {settings?.tagline || "Fine Dining & Banquet"}
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ Icon, href }, i) => (
                <motion.a
                  key={i} href={href || "#"} target="_blank" rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-foreground/70 transition-colors hover:border-gold/50 hover:text-gold"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/70">Explore</p>
            <ul className="mt-5 space-y-3">
              {links.map((l) => (
                <li key={l.label}>
                  <button onClick={() => setView(l.view)} className="group inline-flex items-center gap-1.5 font-[family-name:var(--font-cormorant)] text-lg text-muted-foreground transition-colors hover:text-gold">
                    {l.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/70">Visit</p>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" /><span>{settings?.address}</span></li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                <div className="flex flex-col">
                  <a href={`tel:${(settings?.phone || "+919585018502").replace(/\s+/g, "")}`} className="hover:text-gold transition-colors">{settings?.phone || "+91 95850 18502"}</a>
                  {settings?.phoneSecondary && (
                    <a href={`tel:${settings.phoneSecondary.replace(/\s+/g, "")}`} className="text-xs text-muted-foreground/70 hover:text-gold transition-colors">{settings.phoneSecondary}</a>
                  )}
                </div>
              </li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" /><a href={`mailto:${settings?.email || "boan.reservations@gmail.com"}`} className="hover:text-gold transition-colors">{settings?.email || "boan.reservations@gmail.com"}</a></li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/70">Hours</p>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" /><div><p className="text-foreground">Monday – Sunday</p><p>{settings?.hoursWeekday || "11:00 AM – 11:00 PM"}</p></div></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] py-7 sm:flex-row">
          <p className="font-sans text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings?.restaurantName || "Black Orchid"}. Crafted with intention.
          </p>
          <div className="flex gap-6">
            <button onClick={() => setView("privacy")} className="font-sans text-xs text-muted-foreground transition-colors hover:text-gold">Privacy</button>
            <button onClick={() => setView("terms")} className="font-sans text-xs text-muted-foreground transition-colors hover:text-gold">Terms</button>
            <button onClick={() => router.push("/admin")} className="font-sans text-xs text-muted-foreground/40 transition-colors hover:text-gold">Admin</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
