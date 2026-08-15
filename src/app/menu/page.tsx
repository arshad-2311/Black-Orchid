"use client";

import { useEffect, useState } from "react";
import { useApp, hydrateAdmin } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/Footer";
import { ScrollProgress, StickyReserve } from "@/components/site/Chrome";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Loader } from "@/components/site/Loader";
import { MenuView } from "@/components/site/MenuView";
import { useLenis, scrollToTop } from "@/components/site/premium-motion";

export default function MenuPage() {
  const { setView } = useApp();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useLenis();

  useEffect(() => {
    setView("menu");
    scrollToTop();
    hydrateAdmin();
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
  }, [setView]);

  return (
    <div className="flex min-h-screen flex-col">
      <Loader />
      <ScrollProgress />
      <PillNav settings={settings} />
      <div className="flex-1 pt-24">
        <MenuView />
      </div>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings?.whatsapp || "+91 95850 18502"} />
      <StickyReserve />
    </div>
  );
}
