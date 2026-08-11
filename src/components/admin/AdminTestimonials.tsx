"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Testimonial } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea, SearchableSelect, Toggle,
  Modal, AdminSectionTitle, Badge, ImageUploader, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RATING_OPTIONS = [
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < count ? "fill-admin-gold text-admin-gold" : "fill-transparent text-admin-muted/40"
          )}
        />
      ))}
    </div>
  );
}

export function AdminTestimonials() {
  const [list, setList] = useState<Testimonial[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; t: Testimonial | null }>({ open: false, t: null });

  useEffect(() => {
    let cancelled = false;
    apiGet<Testimonial[]>("/api/testimonials")
      .then((d) => { if (!cancelled) setList(d); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  const load = () => apiGet<Testimonial[]>("/api/testimonials").then(setList).catch(() => {});

  const toggleFeatured = (t: Testimonial) => {
    apiPatch(`/api/testimonials/${t.id}`, { featured: !t.featured })
      .then(() => { toast.success(t.featured ? "Removed from featured" : "Marked as featured"); load(); })
      .catch(() => toast.error("Update failed"));
  };

  const remove = (t: Testimonial) => {
    apiDelete(`/api/testimonials/${t.id}`)
      .then(() => { toast.success("Testimonial deleted"); load(); })
      .catch(() => toast.error("Delete failed"));
  };

  const featuredCount = list?.filter((t) => t.featured).length ?? 0;

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Testimonials"
        subtitle={list ? `${list.length} testimonials · ${featuredCount} featured` : "Loading testimonials…"}
        action={
          <AdminButton variant="solid" size="sm" onClick={() => setModal({ open: true, t: null })}>
            <Plus className="h-3.5 w-3.5" /> Add
          </AdminButton>
        }
      />

      {list === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <AdminCard key={i} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
            </AdminCard>
          ))}
        </div>
      ) : list.length === 0 ? (
        <AdminCard>
          <EmptyState
            title="No testimonials yet"
            message="Collect guest feedback and showcase the best quotes here."
            action={
              <AdminButton variant="solid" onClick={() => setModal({ open: true, t: null })}>
                <Plus className="h-3.5 w-3.5" /> Add Testimonial
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((t) => (
            <AdminCard key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-admin-gold/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-admin-gold/10 font-[family-name:var(--font-playfair)] text-lg font-semibold text-admin-gold ring-2 ring-admin-gold/30">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-playfair)] text-lg font-medium text-admin-text">{t.name}</p>
                    {t.role && <p className="truncate font-sans text-xs text-admin-gold">{t.role}</p>}
                  </div>
                </div>
                {t.featured && <Badge tone="gold">Featured</Badge>}
              </div>

              <div className="mt-3">
                <Stars count={t.rating} />
              </div>

              <p className="mt-3 flex-1 font-[family-name:var(--font-cormorant)] text-base italic leading-relaxed text-admin-text/80">
                &ldquo;{t.message}&rdquo;
              </p>

              <div className="mt-4 flex items-center gap-1 border-t border-admin-border pt-3">
                <button
                  onClick={() => toggleFeatured(t)}
                  aria-label={t.featured ? `Unfeature ${t.name}` : `Feature ${t.name}`}
                  title={t.featured ? "Featured — click to unfeature" : "Click to feature"}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    t.featured
                      ? "border-admin-gold/40 bg-admin-gold/10 text-admin-gold"
                      : "border-admin-border text-admin-muted hover:border-admin-gold/30 hover:text-admin-gold"
                  )}
                >
                  <Star className={cn("h-4 w-4", t.featured && "fill-admin-gold")} />
                </button>
                <button
                  onClick={() => setModal({ open: true, t })}
                  aria-label={`Edit ${t.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-gold/30 text-admin-gold transition-colors hover:bg-admin-gold/10"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete testimonial from ${t.name}?`)) remove(t);
                  }}
                  aria-label={`Delete ${t.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <TestimonialModal
          key={modal.t?.id ?? "new"}
          t={modal.t}
          onClose={() => setModal({ open: false, t: null })}
          onSaved={() => { setModal({ open: false, t: null }); load(); }}
        />
      )}
    </div>
  );
}

type TestimonialFormState = {
  name: string;
  role: string;
  photo: string;
  rating: string;
  message: string;
  featured: boolean;
};

function deriveForm(t: Testimonial | null): TestimonialFormState {
  if (t) {
    return {
      name: t.name,
      role: t.role ?? "",
      photo: t.photo ?? "",
      rating: String(t.rating),
      message: t.message,
      featured: t.featured,
    };
  }
  return { name: "", role: "", photo: "", rating: "5", message: "", featured: false };
}

function TestimonialModal({ t, onClose, onSaved }: { t: Testimonial | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<TestimonialFormState>(() => deriveForm(t));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TestimonialFormState>(k: K, v: TestimonialFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role || null,
        photo: form.photo || null,
        rating: Number(form.rating),
        message: form.message.trim(),
        featured: form.featured,
      };
      if (t) await apiPatch(`/api/testimonials/${t.id}`, payload);
      else await apiPost("/api/testimonials", payload);
      toast.success(t ? "Testimonial updated" : "Testimonial added");
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
      title={t ? "Edit Testimonial" : "Add Testimonial"}
      subtitle={t ? t.name : "Share a guest's words about their experience"}
      size="lg"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={save} disabled={saving || !form.name.trim() || !form.message.trim()}>
            {saving ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Guest name"
          />
          <AdminInput
            label="Role"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Food Critic, Regular Diner…"
          />
        </div>

        <ImageUploader label="Photo" aspect="1/1" value={form.photo} onChange={(v) => set("photo", v)} />

        <AdminTextarea
          label="Message"
          required
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={3}
          placeholder="The guest's quote"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <SearchableSelect
            label="Rating"
            value={form.rating}
            onChange={(v) => set("rating", v)}
            options={RATING_OPTIONS}
            searchable={false}
          />
          <div className="flex items-center justify-start gap-3 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
            <Toggle label="Featured" color="gold" checked={form.featured} onChange={(v) => set("featured", v)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
