"use client";

import { useEffect, useState } from "react";
import { useApp, hydrateAdmin } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/Footer";
import { ScrollProgress, StickyReserve } from "@/components/site/Chrome";
import { Cursor } from "@/components/site/Cursor";
import { Loader } from "@/components/site/Loader";
import { MenuView } from "@/components/site/MenuView";
import { useLenis } from "@/components/site/premium-motion";

export default function MenuPage() {
  const { setView } = useApp();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useLenis();

  useEffect(() => {
    setView("menu");
    hydrateAdmin();
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
  }, [setView]);

  return (
    <div className="flex min-h-screen flex-col">
      <Cursor />
      <Loader />
      <ScrollProgress />
      <PillNav settings={settings} />
      <div className="flex-1 pt-24">
        <MenuView />
      </div>
      <Footer settings={settings} />
      <StickyReserve />
    </div>
  );
}
