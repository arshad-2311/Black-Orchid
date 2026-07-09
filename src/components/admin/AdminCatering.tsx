"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, Users, Package } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { CateringPackage } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea,
  Modal, AdminSectionTitle, ImageUploader, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";

function splitFeatures(features: string): string[] {
  return features
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AdminCatering() {
  const [list, setList] = useState<CateringPackage[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; p: CateringPackage | null }>({ open: false, p: null });

  useEffect(() => {
    let cancelled = false;
    apiGet<CateringPackage[]>("/api/catering")
      .then((d) => { if (!cancelled) setList(d); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  const load = () => apiGet<CateringPackage[]>("/api/catering").then(setList).catch(() => {});

  const remove = (p: CateringPackage) => {
    apiDelete(`/api/catering/${p.id}`)
      .then(() => { toast.success("Package deleted"); load(); })
      .catch(() => toast.error("Delete failed"));
  };

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Catering Packages"
        subtitle={list ? `${list.length} packages` : "Loading packages…"}
        action={
          <AdminButton variant="solid" size="sm" onClick={() => setModal({ open: true, p: null })}>
            <Plus className="h-3.5 w-3.5" /> Add Package
          </AdminButton>
        }
      />

      {list === null ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminCard key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-7 w-28 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
            </AdminCard>
          ))}
        </div>
      ) : list.length === 0 ? (
        <AdminCard>
          <EmptyState
            title="No catering packages yet"
            message="Create packages for private events, banquets, and corporate dinners."
            action={
              <AdminButton variant="solid" onClick={() => setModal({ open: true, p: null })}>
                <Plus className="h-3.5 w-3.5" /> Add Package
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {list.map((p) => {
            const features = splitFeatures(p.features);
            const visibleFeatures = features.slice(0, 4);
            const extraCount = features.length - visibleFeatures.length;
            return (
              <AdminCard key={p.id} className="flex flex-col overflow-hidden p-0">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-admin-bg">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-admin-muted/30">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">{p.name}</h3>

                  <div className="mt-1 flex items-center gap-1.5 font-sans text-xs text-admin-gold">
                    <Users className="h-3.5 w-3.5" />
                    <span>{p.guests || "—"}</span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-admin-gold">${p.price}</span>
                    <span className="font-sans text-xs text-admin-muted">/guest</span>
                  </div>

                  {p.description && (
                    <p className="mt-2 line-clamp-2 font-sans text-xs text-admin-muted">{p.description}</p>
                  )}

                  {features.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {visibleFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 font-sans text-xs text-admin-text/80">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                      {extraCount > 0 && (
                        <li className="pl-5 font-sans text-xs text-admin-muted">+{extraCount} more</li>
                      )}
                    </ul>
                  )}

                  <div className="mt-auto flex items-center gap-1.5 border-t border-admin-border pt-4">
                    <button
                      onClick={() => setModal({ open: true, p })}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-admin-gold/30 px-3 font-sans text-[11px] font-medium uppercase tracking-wider text-admin-gold transition-colors hover:bg-admin-gold/10"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete package "${p.name}"?`)) remove(p);
                      }}
                      aria-label={`Delete ${p.name}`}
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <PackageModal
          key={modal.p?.id ?? "new"}
          p={modal.p}
          onClose={() => setModal({ open: false, p: null })}
          onSaved={() => { setModal({ open: false, p: null }); load(); }}
        />
      )}
    </div>
  );
}

type PackageFormState = {
  name: string;
  description: string;
  price: string;
  guests: string;
  image: string;
  features: string;
};

function deriveForm(p: CateringPackage | null): PackageFormState {
  if (p) {
    return {
      name: p.name,
      description: p.description,
      price: String(p.price),
      guests: p.guests,
      image: p.image ?? "",
      features: p.features,
    };
  }
  return { name: "", description: "", price: "", guests: "", image: "", features: "" };
}

function PackageModal({ p, onClose, onSaved }: { p: CateringPackage | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PackageFormState>(() => deriveForm(p));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PackageFormState>(k: K, v: PackageFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: Number(form.price),
        guests: form.guests,
        image: form.image || null,
        features: form.features,
      };
      if (p) await apiPatch(`/api/catering/${p.id}`, payload);
      else await apiPost("/api/catering", payload);
      toast.success(p ? "Package updated" : "Package created");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={p ? "Edit Package" : "Add Package"}
      subtitle={p ? p.name : "Create a catering offering for private events"}
      size="lg"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={save} disabled={saving || !form.name.trim() || !form.price}>
            {saving ? "Saving…" : "Save Package"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <AdminInput
          label="Package Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Black Orchid Banquet"
        />
        <AdminTextarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="A short description of the package"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Price ($/guest)"
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
          />
          <AdminInput
            label="Guests"
            value={form.guests}
            onChange={(e) => set("guests", e.target.value)}
            placeholder="20–50 guests"
          />
        </div>
        <ImageUploader label="Package Image" aspect="16/10" value={form.image} onChange={(v) => set("image", v)} />
        <div>
          <AdminTextarea
            label="Features"
            value={form.features}
            onChange={(e) => set("features", e.target.value)}
            rows={3}
            placeholder="5-course menu|Premium bar|Service staff"
          />
          <p className="mt-1.5 font-sans text-xs text-admin-muted">
            Separate features with <span className="text-admin-gold">|</span> — each becomes a checkmark on the card.
          </p>
        </div>
      </div>
    </Modal>
  );
}
