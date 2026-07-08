"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star, GripVertical } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, Modal } from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemModal, setItemModal] = useState<MenuItem | "new" | null>(null);
  const [catModal, setCatModal] = useState(false);

  const load = () => apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
  useEffect(() => { load(); }, []);

  const editingCat = itemModal !== null && itemModal !== "new" ? itemModal : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Menu Management</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{categories.length} categories · {categories.reduce((a, c) => a + c.items.length, 0)} items</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" onClick={() => setCatModal(true)}><Plus className="h-3.5 w-3.5" /> Category</AdminButton>
          <AdminButton onClick={() => setItemModal("new")}><Plus className="h-3.5 w-3.5" /> Add Item</AdminButton>
        </div>
      </div>

      {categories.map((cat) => (
        <AdminCard key={cat.id} className="p-0">
          <div className="flex items-center justify-between border-b border-gold/10 px-5 py-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">{cat.name}</h3>
              <span className="rounded-full bg-gold/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-gold">{cat.items.length} items</span>
            </div>
            <CategoryActions cat={cat} onChanged={load} />
          </div>
          <div className="divide-y divide-gold/5">
            {cat.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gold/5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : <div className="h-full w-full bg-secondary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-playfair)] text-base text-foreground">{item.name}</p>
                    {item.featured && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                    {item.veg ? <span className="rounded border border-green-500/50 px-1 text-[9px] text-green-400">VEG</span> : <span className="rounded border border-red-500/50 px-1 text-[9px] text-red-400">NV</span>}
                    {!item.available && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">SOLD OUT</span>}
                  </div>
                  <p className="truncate font-sans text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="font-[family-name:var(--font-playfair)] text-lg text-gold">${item.price}</span>
                <div className="flex gap-1">
                  <button onClick={() => setItemModal(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 text-gold hover:bg-gold/10"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { if (confirm("Delete this item?")) { await apiDelete(`/api/menu/${item.id}`); toast.success("Item deleted"); load(); } }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {!cat.items.length && <p className="px-5 py-6 text-center font-sans text-sm text-muted-foreground">No items in this category.</p>}
          </div>
        </AdminCard>
      ))}

      <ItemModal
        open={itemModal !== null}
        item={editingCat}
        categories={categories}
        onClose={() => setItemModal(null)}
        onSaved={() => { setItemModal(null); load(); }}
      />
      <CategoryModal open={catModal} onClose={() => setCatModal(false)} onSaved={() => { setCatModal(false); load(); }} />
    </div>
  );
}

function CategoryActions({ cat, onChanged }: { cat: MenuCategory; onChanged: () => void }) {
  return (
    <div className="flex gap-1">
      <button onClick={() => { const name = prompt("Rename category", cat.name); if (name) apiPatch(`/api/categories/${cat.id}`, { name }).then(onChanged).then(() => toast.success("Renamed")); }} className="flex h-7 w-7 items-center justify-center rounded border border-gold/20 text-gold hover:bg-gold/10"><Pencil className="h-3 w-3" /></button>
      <button onClick={() => { if (confirm(`Delete category "${cat.name}" and all its items?`)) apiDelete(`/api/categories/${cat.id}`).then(onChanged).then(() => toast.success("Category deleted")); }} className="flex h-7 w-7 items-center justify-center rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3 w-3" /></button>
    </div>
  );
}

function ItemModal({ open, item, categories, onClose, onSaved }: { open: boolean; item: MenuItem | null; categories: MenuCategory[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", price: "", image: "", categoryId: "", available: true, veg: false, spice: 0, featured: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setForm({ name: item.name, description: item.description, price: String(item.price), image: item.image || "", categoryId: item.categoryId, available: item.available, veg: item.veg, spice: item.spice, featured: item.featured });
    else setForm({ name: "", description: "", price: "", image: "", categoryId: categories[0]?.id || "", available: true, veg: false, spice: 0, featured: false });
  }, [item, categories, open]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), spice: Number(form.spice) };
      if (item) await apiPatch(`/api/menu/${item.id}`, payload);
      else await apiPost("/api/menu", payload);
      toast.success(item ? "Item updated" : "Item created");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit Menu Item" : "Add Menu Item"} wide>
      <div className="space-y-4">
        <AdminInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dish name" />
        <AdminTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput label="Price ($)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <AdminSelect label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </AdminSelect>
        </div>
        <AdminInput label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
        <div className="grid grid-cols-2 gap-3">
          <AdminSelect label="Spice Level" value={form.spice} onChange={(e) => setForm({ ...form, spice: Number(e.target.value) })}>
            <option value={0}>None</option><option value={1}>Mild</option><option value={2}>Medium</option><option value={3}>Hot</option>
          </AdminSelect>
          <div className="flex items-end gap-4">
            <Toggle label="Veg" checked={form.veg} onChange={(v) => setForm({ ...form, veg: v })} />
            <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
            <Toggle label="Available" checked={form.available} onChange={(v) => setForm({ ...form, available: v })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !form.name || !form.price || !form.categoryId}>{saving ? "Saving…" : "Save Item"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

function CategoryModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await apiPost("/api/menu", { _type: "category", name });
      toast.success("Category created");
      setName("");
      onSaved();
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Category">
      <div className="space-y-4">
        <AdminInput label="Category Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starters" />
        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving || !name}>{saving ? "Saving…" : "Create"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-1.5">
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-gold" : "bg-secondary")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </span>
      <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </button>
  );
}
