"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp, hydrateAdmin } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/Footer";
import { ScrollProgress, StickyReserve } from "@/components/site/Chrome";
import { Loader } from "@/components/site/Loader";
import { Home } from "@/components/site/Home";
import { MenuView } from "@/components/site/MenuView";
import { GalleryView } from "@/components/site/GalleryView";
import { AboutView } from "@/components/site/AboutView";
import { BanquetView } from "@/components/site/BanquetView";
import { CateringView } from "@/components/site/CateringView";
import { HoursView } from "@/components/site/HoursView";
import { ContactView } from "@/components/site/ContactView";
import { ReservationView } from "@/components/site/ReservationView";
import { LegalView } from "@/components/site/LegalView";
import { useLenis, usePageTransition, scrollToTop } from "@/components/site/premium-motion";

export default function Page() {
  const { view, setView } = useApp();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [displayedView, setDisplayedView] = useState(view);

  // Global smooth scrolling (Lenis)
  useLenis();

  // Page transition
  const { transition } = usePageTransition();

  // Disable browser scroll restoration globally for seamless custom view routing
  useEffect(() => {
    if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    hydrateAdmin();
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
  }, []);

  // Redirect #admin → /admin route
  useEffect(() => {
    if (view === "admin") router.replace("/admin");
  }, [view, router]);

  // Animate view changes with a luxury overlay transition
  useEffect(() => {
    if (view === displayedView) return;
    // Re-fetch latest site settings whenever active view changes
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
    transition(() => {
      setDisplayedView(view);
      scrollToTop();
    });
  }, [view, displayedView, transition]);

  // Always reset scroll to top whenever the active view component renders in the DOM
  useEffect(() => {
    scrollToTop();
  }, [displayedView]);

  return (
    <div className="flex min-h-screen flex-col">
      <Loader />
      <ScrollProgress />
      <PillNav settings={settings} />
      <div className="flex-1">
        {displayedView === "home" && <Home key="home" settings={settings} />}
        {displayedView === "about" && <AboutView key="about" settings={settings} />}
        {displayedView === "menu" && <MenuView key="menu" />}
        {displayedView === "banquet" && <BanquetView key="banquet" settings={settings} />}
        {displayedView === "gallery" && <GalleryView key="gallery" />}
        {displayedView === "catering" && <CateringView key="catering" settings={settings} />}
        {displayedView === "hours" && <HoursView key="hours" settings={settings} />}
        {displayedView === "contact" && <ContactView key="contact" settings={settings} />}
        {displayedView === "reservation" && <ReservationView key="reservation" />}
        {displayedView === "privacy" && <LegalView key="privacy" kind="privacy" />}
        {displayedView === "terms" && <LegalView key="terms" kind="terms" />}
      </div>
      <Footer settings={settings} />
      <StickyReserve />
    </div>
  );
}
