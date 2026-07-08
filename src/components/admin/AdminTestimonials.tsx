"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Testimonial } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminTextarea, Modal } from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminTestimonials() {
  const [list, setList] = useState<Testimonial[]>([]);
  const [modal, setModal] = useState<{ open: boolean; t: Testimonial | null }>({ open: false, t: null });

  const load = () => apiGet<Testimonial[]>("/api/testimonials").then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Testimonials</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{list.length} testimonials · {list.filter((t) => t.featured).length} featured</p>
        </div>
        <AdminButton onClick={() => setModal({ open: true, t: null })}><Plus className="h-3.5 w-3.5" /> Add</AdminButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((t) => (
          <AdminCard key={t.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {t.photo ? <img src={t.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/30" /> : <div className="h-12 w-12 rounded-full bg-secondary" />}
                <div>
                  <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{t.name}</p>
                  <p className="font-sans text-xs text-gold/80">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => apiPatch(`/api/testimonials/${t.id}`, { featured: !t.featured }).then(load)} className={cn("flex h-7 w-7 items-center justify-center rounded border", t.featured ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-muted-foreground")}><Star className="h-3 w-3" /></button>
                <button onClick={() => setModal({ open: true, t })} className="flex h-7 w-7 items-center justify-center rounded border border-gold/20 text-gold hover:bg-gold/10"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => { if (confirm("Delete?")) apiDelete(`/api/testimonials/${t.id}`).then(load).then(() => toast.success("Deleted")); }} className="flex h-7 w-7 items-center justify-center rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="mt-3 flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />)}</div>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-base italic text-muted-foreground">“{t.message}”</p>
          </AdminCard>
        ))}
      </div>

      <TModal state={modal} onClose={() => setModal({ open: false, t: null })} onSaved={() => { setModal({ open: false, t: null }); load(); }} />
    </div>
  );
}

function TModal({ state, onClose, onSaved }: { state: { open: boolean; t: Testimonial | null }; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", role: "", photo: "", rating: 5, message: "", featured: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.t) setForm({ name: state.t.name, role: state.t.role || "", photo: state.t.photo || "", rating: state.t.rating, message: state.t.message, featured: state.t.featured });
    else setForm({ name: "", role: "", photo: "", rating: 5, message: "", featured: false });
  }, [state.t, state.open]);

  const save = async () => {
    setSaving(true);
    try {
      if (state.t) await apiPatch(`/api/testimonials/${state.t.id}`, form);
      else await apiPost("/api/testimonials", form);
      toast.success("Saved"); onSaved();
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  return (
    <Modal open={state.open} onClose={onClose} title={state.t ? "Edit Testimonial" : "Add Testimonial"} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AdminInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <AdminInput label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Food Critic" />
        </div>
        <AdminInput label="Photo URL" value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} />
        <AdminTextarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <span className="font-sans text-[10px] uppercase tracking-wider text-gold/80">Rating</span>
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="rounded-lg border border-gold/20 bg-background/60 px-2 py-1.5 text-sm text-foreground">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-[oklch(0.82_0.14_84)]" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-gold/80">Featured</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !form.name || !form.message}>{saving ? "Saving…" : "Save"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
