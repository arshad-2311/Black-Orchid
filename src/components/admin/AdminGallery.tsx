"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminSelect, Modal } from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATS = ["Food", "Drinks", "Interior", "Events", "Banquet"];

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [modal, setModal] = useState<{ open: boolean; img: GalleryImage | null }>({ open: false, img: null });
  const [bulkUrl, setBulkUrl] = useState("");

  const load = () => apiGet<GalleryImage[]>("/api/gallery").then(setImages).catch(() => {});
  useEffect(() => { load(); }, []);

  const addBulk = async () => {
    const urls = bulkUrl.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!urls.length) return;
    for (const url of urls) await apiPost("/api/gallery", { title: "Gallery Image", url, category: "Interior" });
    setBulkUrl("");
    toast.success(`${urls.length} image(s) added`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Gallery</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{images.length} images</p>
        </div>
        <AdminButton onClick={() => setModal({ open: true, img: null })}><Plus className="h-3.5 w-3.5" /> Add Image</AdminButton>
      </div>

      <AdminCard>
        <p className="mb-2 font-sans text-xs uppercase tracking-wider text-gold/80">Bulk upload (one URL per line)</p>
        <textarea rows={3} value={bulkUrl} onChange={(e) => setBulkUrl(e.target.value)} placeholder="https://…&#10;https://…" className="w-full rounded-lg border border-gold/20 bg-background/60 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none" />
        <div className="mt-2 flex justify-end"><AdminButton variant="outline" onClick={addBulk} disabled={!bulkUrl.trim()}>Add All</AdminButton></div>
      </AdminCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-xl border border-gold/10">
            <img src={img.url} alt={img.title} className="aspect-square w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-background/90 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex justify-end gap-1">
                <button onClick={() => setModal({ open: true, img })} className="flex h-7 w-7 items-center justify-center rounded border border-gold/30 bg-background/60 text-gold"><Pencil className="h-3 w-3" /></button>
                <button onClick={async () => { if (confirm("Delete image?")) { await apiDelete(`/api/gallery/${img.id}`); toast.success("Deleted"); load(); } }} className="flex h-7 w-7 items-center justify-center rounded border border-red-500/30 bg-background/60 text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div>
                <p className="truncate font-[family-name:var(--font-playfair)] text-sm text-foreground">{img.title}</p>
                <span className="rounded bg-gold/20 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-wider text-gold">{img.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImageModal state={modal} onClose={() => setModal({ open: false, img: null })} onSaved={() => { setModal({ open: false, img: null }); load(); }} />
    </div>
  );
}

function ImageModal({ state, onClose, onSaved }: { state: { open: boolean; img: GalleryImage | null }; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", url: "", caption: "", category: "Interior" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.img) setForm({ title: state.img.title, url: state.img.url, caption: state.img.caption || "", category: state.img.category });
    else setForm({ title: "", url: "", caption: "", category: "Interior" });
  }, [state.img, state.open]);

  const save = async () => {
    setSaving(true);
    try {
      if (state.img) await apiPatch(`/api/gallery/${state.img.id}`, form);
      else await apiPost("/api/gallery", form);
      toast.success("Saved");
      onSaved();
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  return (
    <Modal open={state.open} onClose={onClose} title={state.img ? "Edit Image" : "Add Image"}>
      <div className="space-y-4">
        <AdminInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <AdminInput label="Image URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
        {form.url && <img src={form.url} alt="" className="h-32 w-full rounded-lg object-cover" />}
        <AdminInput label="Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        <AdminSelect label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </AdminSelect>
        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !form.url}>{saving ? "Saving…" : "Save"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
