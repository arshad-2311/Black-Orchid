"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp, hydrateAdmin } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/Footer";
import { ScrollProgress, StickyReserve } from "@/components/site/Chrome";
import { Cursor } from "@/components/site/Cursor";
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
import { useLenis, usePageTransition } from "@/components/site/premium-motion";

export default function Page() {
  const { view, setView } = useApp();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [displayedView, setDisplayedView] = useState(view);

  // Global smooth scrolling (Lenis)
  useLenis();

  // Page transition
  const { transition } = usePageTransition();

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
    transition(() => {
      setDisplayedView(view);
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [view, displayedView, transition]);

  return (
    <div className="flex min-h-screen flex-col">
      <Cursor />
      <Loader />
      <ScrollProgress />
      <PillNav settings={settings} />
      <div className="flex-1">
        {displayedView === "home" && <Home settings={settings} />}
        {displayedView === "about" && <AboutView settings={settings} />}
        {displayedView === "menu" && <MenuView />}
        {displayedView === "banquet" && <BanquetView settings={settings} />}
        {displayedView === "gallery" && <GalleryView />}
        {displayedView === "catering" && <CateringView settings={settings} />}
        {displayedView === "hours" && <HoursView settings={settings} />}
        {displayedView === "contact" && <ContactView settings={settings} />}
        {displayedView === "reservation" && <ReservationView />}
        {displayedView === "privacy" && <LegalView kind="privacy" />}
        {displayedView === "terms" && <LegalView kind="terms" />}
      </div>
      <Footer settings={settings} />
      <StickyReserve />
    </div>
  );
}
