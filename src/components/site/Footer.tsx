"use client";

import { useState } from "react";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock, Send, UtensilsCrossed } from "lucide-react";
import { useApp, type ViewKey } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";
import { OrnamentDivider } from "./primitives";

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const links: { label: string; view: ViewKey }[] = [
    { label: "About Us", view: "about" },
    { label: "Menu", view: "menu" },
    { label: "Banquet Facility", view: "banquet" },
    { label: "Gallery", view: "gallery" },
    { label: "Catering", view: "catering" },
    { label: "Visiting Hours", view: "hours" },
    { label: "Reserve a Table", view: "reservation" },
    { label: "Contact", view: "contact" },
  ];

  const legal: { label: string; view: ViewKey }[] = [
    { label: "Privacy Policy", view: "privacy" },
    { label: "Terms & Conditions", view: "terms" },
  ];

  return (
    <footer className="mt-auto border-t border-gold/10 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <div className="mb-14 text-center">
          <OrnamentDivider className="mb-6" />
          <h3 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">
            Join the Inner Circle
          </h3>
          <p className="mx-auto mt-3 max-w-md font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
            Exclusive invitations, chef's tasting menus, and private events — delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) {
                setSubscribed(true);
                setEmail("");
                setTimeout(() => setSubscribed(false), 4000);
              }
            }}
            className="mx-auto mt-6 flex max-w-md items-center gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-12 flex-1 rounded-full border border-gold/20 bg-background/60 px-5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold uppercase tracking-wider text-black transition-transform hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Subscribe</span>
            </button>
          </form>
          {subscribed && (
            <p className="mt-3 text-sm text-gold">Welcome to the inner circle. Check your inbox ✦</p>
          )}
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-gold">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <span className="font-[family-name:var(--font-playfair)] text-xl font-semibold">
                {settings?.restaurantName || "Black Orchid"}
              </span>
            </div>
            <p className="mt-4 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
              {settings?.tagline || "Fine Dining & Banquet"}
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: Instagram, href: settings?.instagram },
                { Icon: Facebook, href: settings?.facebook },
                { Icon: Twitter, href: settings?.twitter },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 text-gold/80 transition-all hover:border-gold hover:bg-gold/10 hover:text-gold"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">Explore</h4>
            <ul className="mt-5 space-y-2.5">
              {links.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => setView(l.view)}
                    className="font-[family-name:var(--font-cormorant)] text-lg text-muted-foreground transition-colors hover:text-gold"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">Contact</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <span>{settings?.address}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <a href={`tel:${settings?.phone}`} className="hover:text-gold">{settings?.phone}</a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <a href={`mailto:${settings?.email}`} className="hover:text-gold">{settings?.email}</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">Hours</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <div>
                  <p className="text-foreground">Monday – Friday</p>
                  <p>{settings?.hoursWeekday}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <div>
                  <p className="text-foreground">Saturday – Sunday</p>
                  <p>{settings?.hoursWeekend}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gold/10 pt-6 sm:flex-row">
          <p className="font-sans text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings?.restaurantName || "Black Orchid"}. All rights reserved.
          </p>
          <div className="flex gap-5">
            {legal.map((l) => (
              <button
                key={l.label}
                onClick={() => setView(l.view)}
                className="font-sans text-xs text-muted-foreground transition-colors hover:text-gold"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => setView("admin")}
              className="font-sans text-xs text-muted-foreground/50 transition-colors hover:text-gold"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
