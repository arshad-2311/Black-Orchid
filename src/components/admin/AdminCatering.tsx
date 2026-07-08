"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { CateringPackage } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminTextarea, Modal } from "./ui";
import { toast } from "sonner";

export function AdminCatering() {
  const [list, setList] = useState<CateringPackage[]>([]);
  const [modal, setModal] = useState<{ open: boolean; p: CateringPackage | null }>({ open: false, p: null });

  const load = () => apiGet<CateringPackage[]>("/api/catering").then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Catering Packages</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{list.length} packages</p>
        </div>
        <AdminButton onClick={() => setModal({ open: true, p: null })}><Plus className="h-3.5 w-3.5" /> Add Package</AdminButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {list.map((p) => (
          <AdminCard key={p.id}>
            {p.image && <img src={p.image} alt="" className="mb-3 aspect-[16/10] w-full rounded-lg object-cover" />}
            <h3 className="font-[family-name:var(--font-playfair)] text-xl text-foreground">{p.name}</h3>
            <p className="font-sans text-xs text-gold">{p.guests}</p>
            <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-gold">${p.price}<span className="font-sans text-xs text-muted-foreground">/guest</span></p>
            <p className="mt-2 line-clamp-2 font-sans text-xs text-muted-foreground">{p.description}</p>
            <div className="mt-3 flex gap-1">
              <button onClick={() => setModal({ open: true, p })} className="flex h-8 items-center gap-1 rounded-lg border border-gold/20 px-3 text-gold hover:bg-gold/10"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button onClick={() => { if (confirm("Delete package?")) apiDelete(`/api/catering/${p.id}`).then(load).then(() => toast.success("Deleted")); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </AdminCard>
        ))}
      </div>

      <PModal state={modal} onClose={() => setModal({ open: false, p: null })} onSaved={() => { setModal({ open: false, p: null }); load(); }} />
    </div>
  );
}

function PModal({ state, onClose, onSaved }: { state: { open: boolean; p: CateringPackage | null }; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", price: "", guests: "", image: "", features: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.p) setForm({ name: state.p.name, description: state.p.description, price: String(state.p.price), guests: state.p.guests, image: state.p.image || "", features: state.p.features });
    else setForm({ name: "", description: "", price: "", guests: "", image: "", features: "" });
  }, [state.p, state.open]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (state.p) await apiPatch(`/api/catering/${state.p.id}`, payload);
      else await apiPost("/api/catering", payload);
      toast.success("Saved"); onSaved();
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  return (
    <Modal open={state.open} onClose={onClose} title={state.p ? "Edit Package" : "Add Package"} wide>
      <div className="space-y-4">
        <AdminInput label="Package Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <AdminTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput label="Price ($/guest)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <AdminInput label="Guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} placeholder="20–50 guests" />
        </div>
        <AdminInput label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <AdminTextarea label="Features (separate with |)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3} placeholder="5-course menu|Premium bar|Service staff" />
        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !form.name || !form.price}>{saving ? "Saving…" : "Save"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
