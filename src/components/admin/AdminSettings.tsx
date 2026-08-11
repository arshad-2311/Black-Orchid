"use client";

import { useEffect, useState } from "react";
import {
  Save, Sparkles, Image as ImageIcon, BookOpen, GlassWater, Phone, Clock,
  Share2, Search, Bell,
} from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea,
  AdminSectionTitle, Skeleton,
} from "./ui";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

export function AdminSettings() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<SiteSettings>("/api/settings")
      .then((d) => { if (!cancelled) setForm(d); })
      .catch(() => { if (!cancelled) setForm(null); });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiPut("/api/settings", form);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof SiteSettings, v: string) =>
    setForm((s) => (s ? { ...s, [k]: v } : s));

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Website Settings"
        subtitle="Manage all public-facing content from one place."
        action={
          <AdminButton variant="solid" size="sm" onClick={save} disabled={!form || saving}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save All"}
          </AdminButton>
        }
      />

      {!form ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <AdminCard key={i} className="p-6">
              <Skeleton className="h-6 w-40 rounded-md" />
              <div className="mt-5 space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </AdminCard>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Branding" icon={Sparkles}>
            <AdminInput label="Restaurant Name" value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} />
            <AdminInput label="Tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Section>

          <Section title="Hero Section" icon={ImageIcon}>
            <AdminInput label="Hero Title" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
            <AdminTextarea label="Hero Subtitle" value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} />
          </Section>

          <Section title="About Section" icon={BookOpen}>
            <AdminInput label="About Title" value={form.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} />
            <AdminTextarea label="About Body" value={form.aboutBody} onChange={(e) => set("aboutBody", e.target.value)} rows={4} />
          </Section>

          <Section title="Banquet Section" icon={GlassWater}>
            <AdminInput label="Banquet Capacity" value={form.banquetCapacity} onChange={(e) => set("banquetCapacity", e.target.value)} />
            <AdminTextarea label="Banquet Description" value={form.banquetDesc} onChange={(e) => set("banquetDesc", e.target.value)} rows={3} />
          </Section>

          <Section title="Notification Settings" icon={Bell}>
            <AdminInput
              label="Restaurant Manager Email"
              value={form.managerEmail || form.email || ""}
              onChange={(e) => set("managerEmail", e.target.value)}
              placeholder="manager@blackorchid.com"
            />
            <AdminInput
              label="SMS Sender / Business Name"
              value={form.smsSenderName || "Black Orchid Anna Nagar"}
              onChange={(e) => set("smsSenderName", e.target.value)}
              placeholder="Black Orchid Anna Nagar"
            />
            <div className="flex items-center gap-3 pt-1">
              <input
                id="notificationsEnabled"
                type="checkbox"
                checked={form.notificationsEnabled ?? true}
                onChange={(e) => setForm((s) => (s ? { ...s, notificationsEnabled: e.target.checked } : s))}
                className="h-4 w-4 rounded border-admin-gold/40 bg-admin-bg text-admin-gold focus:ring-admin-gold"
              />
              <label htmlFor="notificationsEnabled" className="font-sans text-xs font-medium text-admin-text">
                Enable Automatic Reservation Alerts (Manager Email & Customer SMS)
              </label>
            </div>
          </Section>

          <Section title="Contact Information" icon={Phone}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AdminInput label="Primary Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              <AdminInput label="Secondary Phone (Optional)" value={form.phoneSecondary || ""} onChange={(e) => set("phoneSecondary", e.target.value)} />
            </div>
            <AdminInput label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <AdminInput label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            <AdminInput label="WhatsApp Number" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            <AdminInput label="Google Maps Location URL" value={form.mapEmbed || ""} onChange={(e) => set("mapEmbed", e.target.value)} />
          </Section>

          <Section title="Business Hours" icon={Clock}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AdminInput label="Weekday Hours" value={form.hoursWeekday} onChange={(e) => set("hoursWeekday", e.target.value)} />
              <AdminInput label="Weekend Hours" value={form.hoursWeekend} onChange={(e) => set("hoursWeekend", e.target.value)} />
            </div>
          </Section>

          <Section title="Social Media" icon={Share2}>
            <AdminInput label="Instagram" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
            <AdminInput label="Facebook" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
            <AdminInput label="Twitter / X" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} />
          </Section>

          <Section title="SEO Settings" icon={Search}>
            <AdminInput label="Meta Title" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
            <AdminTextarea label="Meta Description" value={form.metaDesc ?? ""} onChange={(e) => set("metaDesc", e.target.value)} rows={3} />
          </Section>
        </div>
      )}

      {/* Sticky bottom save bar */}
      {form && (
        <div className="sticky bottom-4 z-30 mt-2">
          <div className="admin-surface-elevated flex flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-soft-lg">
            <p className="font-sans text-xs text-admin-muted">
              Changes are not live until you save.
            </p>
            <AdminButton variant="solid" onClick={save} disabled={saving}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save All Changes"}
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title, icon: Icon, children,
}: {
  title: string; icon: LucideIcon; children: React.ReactNode;
}) {
  return (
    <AdminCard className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-gold/30 bg-admin-gold/10 text-admin-gold">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-gold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </AdminCard>
  );
}
