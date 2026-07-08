"use client";

import { useEffect, useState } from "react";
import { useApp, hydrateAdmin } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { Navbar } from "@/components/site/Navbar";
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
import { AdminApp } from "@/components/admin/AdminApp";

export default function Page() {
  const { view } = useApp();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    hydrateAdmin();
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
  }, []);

  // Admin has its own full-screen layout (no public navbar/footer)
  if (view === "admin") {
    return (
      <>
        <Loader />
        <ScrollProgress />
        <AdminApp />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Loader />
      <ScrollProgress />
      <Navbar settings={settings} />
      <div className="flex-1">
        {view === "home" && <Home settings={settings} />}
        {view === "about" && <AboutView settings={settings} />}
        {view === "menu" && <MenuView />}
        {view === "banquet" && <BanquetView settings={settings} />}
        {view === "gallery" && <GalleryView />}
        {view === "catering" && <CateringView settings={settings} />}
        {view === "hours" && <HoursView settings={settings} />}
        {view === "contact" && <ContactView settings={settings} />}
        {view === "reservation" && <ReservationView />}
        {view === "privacy" && <LegalView kind="privacy" />}
        {view === "terms" && <LegalView kind="terms" />}
      </div>
      <Footer settings={settings} />
      <StickyReserve />
    </div>
  );
}
