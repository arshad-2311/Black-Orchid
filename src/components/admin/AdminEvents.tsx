"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminTextarea, Modal } from "./ui";
import { toast } from "sonner";

export function AdminEvents() {
  const [list, setList] = useState<EventItem[]>([]);
  const [modal, setModal] = useState<{ open: boolean; e: EventItem | null }>({ open: false, e: null });

  const load = () => apiGet<EventItem[]>("/api/events").then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Events</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{list.length} events · {list.filter((e) => e.published).length} published</p>
        </div>
        <AdminButton onClick={() => setModal({ open: true, e: null })}><Plus className="h-3.5 w-3.5" /> Add Event</AdminButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <AdminCard key={e.id} className="overflow-hidden p-0">
            {e.image && <img src={e.image} alt="" className="aspect-[16/10] w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-gold/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-gold">{new Date(e.date).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                <button onClick={() => apiPatch(`/api/events/${e.id}`, { published: !e.published }).then(load)} className="flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-muted-foreground hover:text-gold">
                  {e.published ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
                </button>
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl text-foreground">{e.title}</h3>
              <p className="mt-1 line-clamp-2 font-sans text-xs text-muted-foreground">{e.description}</p>
              <div className="mt-3 flex gap-1">
                <button onClick={() => setModal({ open: true, e })} className="flex h-8 items-center gap-1 rounded-lg border border-gold/20 px-3 text-gold hover:bg-gold/10"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => { if (confirm("Delete event?")) apiDelete(`/api/events/${e.id}`).then(load).then(() => toast.success("Deleted")); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <EModal state={modal} onClose={() => setModal({ open: false, e: null })} onSaved={() => { setModal({ open: false, e: null }); load(); }} />
    </div>
  );
}

function EModal({ state, onClose, onSaved }: { state: { open: boolean; e: EventItem | null }; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", date: "", image: "", published: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.e) setForm({ title: state.e.title, description: state.e.description, date: state.e.date, image: state.e.image || "", published: state.e.published });
    else setForm({ title: "", description: "", date: "", image: "", published: true });
  }, [state.e, state.open]);

  const save = async () => {
    setSaving(true);
    try {
      if (state.e) await apiPatch(`/api/events/${state.e.id}`, form);
      else await apiPost("/api/events", form);
      toast.success("Saved"); onSaved();
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  return (
    <Modal open={state.open} onClose={onClose} title={state.e ? "Edit Event" : "Add Event"} wide>
      <div className="space-y-4">
        <AdminInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <AdminTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-[oklch(0.82_0.14_84)]" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-gold/80">Published</span>
          </label>
        </div>
        <AdminInput label="Poster Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !form.title || !form.date}>{saving ? "Saving…" : "Save"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
