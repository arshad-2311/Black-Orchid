"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, SearchableSelect,
  Modal, AdminSectionTitle, Badge, ImageUploader, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";

const CATS = ["Food", "Drinks", "Interior", "Events", "Banquet"];
const CAT_OPTIONS = CATS.map((c) => ({ value: c, label: c }));

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; img: GalleryImage | null }>({ open: false, img: null });
  const [bulkUrl, setBulkUrl] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<GalleryImage[]>("/api/gallery")
      .then((d) => { if (!cancelled) setImages(d); })
      .catch(() => { if (!cancelled) setImages([]); });
    return () => { cancelled = true; };
  }, []);

  const load = () => apiGet<GalleryImage[]>("/api/gallery").then(setImages).catch(() => {});

  const addBulk = async () => {
    const urls = bulkUrl.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!urls.length) return;
    setBulkBusy(true);
    let ok = 0;
    for (const url of urls) {
      try {
        await apiPost("/api/gallery", { title: "Gallery Image", url, category: "Interior" });
        ok++;
      } catch { /* skip failures */ }
    }
    setBulkUrl("");
    setBulkBusy(false);
    toast.success(`${ok} image${ok === 1 ? "" : "s"} added`);
    load();
  };

  const remove = (img: GalleryImage) => {
    apiDelete(`/api/gallery/${img.id}`)
      .then(() => { toast.success("Image deleted"); load(); })
      .catch(() => toast.error("Delete failed"));
  };

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Gallery"
        subtitle={images ? `${images.length} images` : "Loading gallery…"}
        action={
          <AdminButton variant="solid" size="sm" onClick={() => setModal({ open: true, img: null })}>
            <Plus className="h-3.5 w-3.5" /> Add Image
          </AdminButton>
        }
      />

      {/* Bulk upload */}
      <AdminCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-admin-gold/30 bg-admin-gold/10 text-admin-gold">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-base font-medium text-admin-text">Bulk Upload</p>
            <p className="font-sans text-xs text-admin-muted">Paste image URLs — one per line — to add multiple at once.</p>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            value={bulkUrl}
            onChange={(e) => setBulkUrl(e.target.value)}
            rows={4}
            placeholder={"https://…\nhttps://…"}
            className="admin-input h-auto resize-none py-3"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <AdminButton variant="outline" onClick={addBulk} disabled={!bulkUrl.trim() || bulkBusy}>
            {bulkBusy ? "Adding…" : "Add All"}
          </AdminButton>
        </div>
      </AdminCard>

      {/* Grid */}
      {images === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <AdminCard>
          <EmptyState
            title="No images yet"
            message="Add images one by one or bulk-paste URLs above."
            action={
              <AdminButton variant="solid" onClick={() => setModal({ open: true, img: null })}>
                <Plus className="h-3.5 w-3.5" /> Add Image
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-admin-border bg-admin-bg"
            >
              <img src={img.url} alt={img.title} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setModal({ open: true, img })}
                    aria-label={`Edit ${img.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-admin-gold/40 bg-black/50 text-admin-gold backdrop-blur-sm transition-colors hover:bg-admin-gold/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(img)}
                    aria-label={`Delete ${img.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/40 bg-black/50 text-red-400 backdrop-blur-sm transition-colors hover:bg-red-500/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <p className="truncate font-[family-name:var(--font-playfair)] text-sm font-medium text-white">{img.title}</p>
                  <Badge tone="gold">{img.category}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image modal */}
      {modal.open && (
        <ImageModal
          key={modal.img?.id ?? "new"}
          img={modal.img}
          onClose={() => setModal({ open: false, img: null })}
          onSaved={() => { setModal({ open: false, img: null }); load(); }}
        />
      )}
    </div>
  );
}

type ImageFormState = {
  title: string;
  url: string;
  caption: string;
  category: string;
};

function deriveImageForm(img: GalleryImage | null): ImageFormState {
  if (img) {
    return { title: img.title, url: img.url, caption: img.caption ?? "", category: img.category };
  }
  return { title: "", url: "", caption: "", category: "Interior" };
}

function ImageModal({ img, onClose, onSaved }: { img: GalleryImage | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ImageFormState>(() => deriveImageForm(img));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ImageFormState>(k: K, v: ImageFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!form.url) return;
    setSaving(true);
    try {
      if (img) await apiPatch(`/api/gallery/${img.id}`, form);
      else await apiPost("/api/gallery", form);
      toast.success(img ? "Image updated" : "Image added");
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
      title={img ? "Edit Image" : "Add Image"}
      subtitle={img ? img.title : "Upload or paste a URL"}
      size="md"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={save} disabled={saving || !form.url}>
            {saving ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <ImageUploader label="Image" aspect="1/1" value={form.url} onChange={(v) => set("url", v)} />
        <AdminInput
          label="Title"
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Image title"
        />
        <AdminInput
          label="Caption"
          value={form.caption}
          onChange={(e) => set("caption", e.target.value)}
          placeholder="Optional caption"
        />
        <SearchableSelect
          label="Category"
          value={form.category}
          onChange={(v) => set("category", v)}
          options={CAT_OPTIONS}
          searchable={false}
        />
      </div>
    </Modal>
  );
}
