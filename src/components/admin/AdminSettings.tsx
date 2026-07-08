"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminTextarea } from "./ui";
import { toast } from "sonner";

export function AdminSettings() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { apiGet<SiteSettings>("/api/settings").then(setForm).catch(() => {}); }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiPut("/api/settings", form);
      toast.success("Settings saved");
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  if (!form) return <div className="h-40 rounded-xl shimmer" />;

  const set = (k: keyof SiteSettings, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Website Settings</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">Manage all public-facing content from one place.</p>
        </div>
        <AdminButton onClick={save} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save All"}</AdminButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Branding">
          <AdminInput label="Restaurant Name" value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} />
          <AdminInput label="Tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Section>

        <Section title="Hero Section">
          <AdminInput label="Hero Title" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
          <AdminTextarea label="Hero Subtitle" value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} />
        </Section>

        <Section title="About Section">
          <AdminInput label="About Title" value={form.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} />
          <AdminTextarea label="About Body" value={form.aboutBody} onChange={(e) => set("aboutBody", e.target.value)} rows={4} />
        </Section>

        <Section title="Banquet Section">
          <AdminInput label="Banquet Capacity" value={form.banquetCapacity} onChange={(e) => set("banquetCapacity", e.target.value)} />
          <AdminTextarea label="Banquet Description" value={form.banquetDesc} onChange={(e) => set("banquetDesc", e.target.value)} rows={3} />
        </Section>

        <Section title="Contact Information">
          <div className="grid grid-cols-2 gap-3">
            <AdminInput label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <AdminInput label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <AdminInput label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <AdminInput label="WhatsApp Number" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </Section>

        <Section title="Business Hours">
          <AdminInput label="Weekday Hours" value={form.hoursWeekday} onChange={(e) => set("hoursWeekday", e.target.value)} />
          <AdminInput label="Weekend Hours" value={form.hoursWeekend} onChange={(e) => set("hoursWeekend", e.target.value)} />
        </Section>

        <Section title="Social Media">
          <AdminInput label="Instagram" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          <AdminInput label="Facebook" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
          <AdminInput label="Twitter / X" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} />
        </Section>

        <Section title="SEO Settings">
          <AdminInput label="Meta Title" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
          <AdminTextarea label="Meta Description" value={form.metaDesc || ""} onChange={(e) => set("metaDesc", e.target.value)} rows={3} />
        </Section>
      </div>

      <div className="flex justify-end">
        <AdminButton onClick={save} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save All Changes"}</AdminButton>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminCard>
      <h3 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-gold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </AdminCard>
  );
}
