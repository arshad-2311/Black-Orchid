"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Star, GripVertical, Flame, UtensilsCrossed,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea, SearchableSelect, Toggle,
  Modal, AdminSectionTitle, Badge, ImageUploader, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";

const SPICE_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "Mild" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hot" },
];

const SPICE_LABEL = ["", "Mild", "Medium", "Hot"];

function SpiceDots({ level }: { level: number }) {
  if (!level) return null;
  const label = SPICE_LABEL[level] ?? "";
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`Spice: ${label}`}
      aria-label={`Spice: ${label}`}
    >
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3 w-3 text-orange-400" />
      ))}
    </span>
  );
}

export function AdminMenu() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [itemModal, setItemModal] = useState<MenuItem | "new" | null>(null);
  const [catModal, setCatModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<MenuCategory[]>("/api/menu")
      .then((d) => { if (!cancelled) setCategories(d); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  const load = () =>
    apiGet<MenuCategory[]>("/api/menu")
      .then(setCategories)
      .catch(() => {});

  const editingItem = itemModal !== null && itemModal !== "new" ? itemModal : null;
  const totalItems = categories?.reduce((a, c) => a + c.items.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Menu Management"
        subtitle={categories ? `${categories.length} categories · ${totalItems} items` : "Loading menu…"}
        action={
          <div className="flex gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setCatModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Category
            </AdminButton>
            <AdminButton
              variant="solid"
              size="sm"
              onClick={() => setItemModal("new")}
              disabled={!categories || categories.length === 0}
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </AdminButton>
          </div>
        }
      />

      {categories === null ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <AdminCard key={i} className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-md" />
                    <Skeleton className="h-3 w-72 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              ))}
            </AdminCard>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <AdminCard>
          <EmptyState
            title="No categories yet"
            message="Create your first menu category to start adding dishes."
            action={
              <AdminButton variant="solid" onClick={() => setCatModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Category
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="space-y-5">
          {categories.map((cat) => (
            <AdminCard key={cat.id} className="overflow-hidden p-0">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-admin-border bg-white/[0.015] px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-admin-muted/40" aria-hidden />
                  <h3 className="truncate font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">{cat.name}</h3>
                  <Badge tone="gold">{cat.items.length} {cat.items.length === 1 ? "item" : "items"}</Badge>
                </div>
                <CategoryActions cat={cat} onChanged={load} />
              </div>
              {/* Items */}
              {cat.items.length === 0 ? (
                <p className="px-5 py-8 text-center font-sans text-sm text-admin-muted">No items in this category yet.</p>
              ) : (
                <div className="divide-y divide-admin-border/50">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-admin-gold/5"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-admin-muted/40">
                            <UtensilsCrossed className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-[family-name:var(--font-playfair)] text-base font-medium text-admin-text">{item.name}</p>
                          {item.featured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-admin-gold/30 bg-admin-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-admin-gold">
                              <Star className="h-2.5 w-2.5 fill-admin-gold text-admin-gold" /> Featured
                            </span>
                          )}
                          {item.veg ? <Badge tone="green">Veg</Badge> : <Badge tone="red">NV</Badge>}
                          <SpiceDots level={item.spice} />
                          {!item.available && <Badge tone="red">Sold Out</Badge>}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 truncate font-sans text-xs text-admin-muted">{item.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-[family-name:var(--font-playfair)] text-lg font-semibold text-admin-gold">${item.price}</span>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          onClick={() => setItemModal(item)}
                          aria-label={`Edit ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-gold/30 text-admin-gold transition-colors hover:bg-admin-gold/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            apiDelete(`/api/menu/${item.id}`)
                              .then(() => { toast.success("Item deleted"); load(); })
                              .catch(() => toast.error("Delete failed"));
                          }}
                          aria-label={`Delete ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      {/* Item modal — conditionally mounted so form state initialises cleanly per item */}
      {itemModal !== null && (
        <ItemModal
          key={editingItem?.id ?? "new"}
          item={editingItem}
          categories={categories ?? []}
          onClose={() => setItemModal(null)}
          onSaved={() => { setItemModal(null); load(); }}
        />
      )}

      {/* Category modal */}
      {catModal && (
        <CategoryModal
          onClose={() => setCatModal(false)}
          onSaved={() => { setCatModal(false); load(); }}
        />
      )}
    </div>
  );
}

function CategoryActions({ cat, onChanged }: { cat: MenuCategory; onChanged: () => void }) {
  const rename = () => {
    const name = window.prompt("Rename category", cat.name);
    if (name && name.trim()) {
      apiPatch(`/api/categories/${cat.id}`, { name: name.trim() })
        .then(onChanged)
        .then(() => toast.success("Category renamed"))
        .catch(() => toast.error("Rename failed"));
    }
  };
  const remove = () => {
    apiDelete(`/api/categories/${cat.id}`)
      .then(onChanged)
      .then(() => toast.success("Category deleted"))
      .catch(() => toast.error("Delete failed"));
  };
  return (
    <div className="flex shrink-0 gap-1">
      <button
        onClick={rename}
        aria-label={`Rename ${cat.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-gold/30 text-admin-gold transition-colors hover:bg-admin-gold/10"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          if (window.confirm(`Delete category "${cat.name}" and all its items? This cannot be undone.`)) remove();
        }}
        aria-label={`Delete ${cat.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type ItemFormState = {
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId: string;
  available: boolean;
  veg: boolean;
  spice: string;
  featured: boolean;
};

function deriveItemForm(item: MenuItem | null, categories: MenuCategory[]): ItemFormState {
  if (item) {
    return {
      name: item.name,
      description: item.description,
      price: String(item.price),
      image: item.image ?? "",
      categoryId: item.categoryId,
      available: item.available,
      veg: item.veg,
      spice: String(item.spice),
      featured: item.featured,
    };
  }
  return {
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: categories[0]?.id ?? "",
    available: true,
    veg: false,
    spice: "0",
    featured: false,
  };
}

function ItemModal({
  item, categories, onClose, onSaved,
}: {
  item: MenuItem | null;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ItemFormState>(() => deriveItemForm(item, categories));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: Number(form.price),
        image: form.image || null,
        categoryId: form.categoryId,
        available: form.available,
        veg: form.veg,
        spice: Number(form.spice),
        featured: form.featured,
      };
      if (item) await apiPatch(`/api/menu/${item.id}`, payload);
      else await apiPost("/api/menu", payload);
      toast.success(item ? "Item updated" : "Item created");
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
      title={item ? "Edit Menu Item" : "Add Menu Item"}
      subtitle={item ? item.name : "Create a new dish on the menu"}
      size="xl"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton
            variant="solid"
            onClick={save}
            disabled={saving || !form.name.trim() || !form.price || !form.categoryId}
          >
            {saving ? "Saving…" : "Save Item"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Wagyu Tenderloin"
          />
          <AdminInput
            label="Price"
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <AdminTextarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="A short, evocative description of the dish"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect
            label="Category"
            required
            value={form.categoryId}
            onChange={(v) => set("categoryId", v)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select a category"
          />
          <SearchableSelect
            label="Spice Level"
            value={form.spice}
            onChange={(v) => set("spice", v)}
            options={SPICE_OPTIONS}
            searchable={false}
          />
        </div>

        <ImageUploader
          label="Dish Image"
          aspect="4/3"
          value={form.image}
          onChange={(v) => set("image", v)}
        />

        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
          <Toggle label="Veg" color="gold" checked={form.veg} onChange={(v) => set("veg", v)} />
          <Toggle label="Featured" color="gold" checked={form.featured} onChange={(v) => set("featured", v)} />
          <Toggle label="Available" color="green" checked={form.available} onChange={(v) => set("available", v)} />
        </div>
      </div>
    </Modal>
  );
}

function CategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiPost("/api/menu", { _type: "category", name: name.trim() });
      toast.success("Category created");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Category"
      subtitle="Group related dishes together"
      size="sm"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create"}
          </AdminButton>
        </>
      }
    >
      <AdminInput
        label="Category Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Starters"
        autoFocus
      />
    </Modal>
  );
}
