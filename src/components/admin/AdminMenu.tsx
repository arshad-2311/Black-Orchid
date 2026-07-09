"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Star, GripVertical, Flame, UtensilsCrossed,
  Upload, X, ChevronLeft, ChevronRight, ChefHat, Link as LinkIcon,
  AlertTriangle,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea, SearchableSelect, Toggle,
  Modal, AdminSectionTitle, Badge, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";

const SPICE_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "Mild" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hot" },
];

const SPICE_LABEL = ["", "Mild", "Medium", "Hot"];

const COMMON_ALLERGENS = [
  "Gluten", "Dairy", "Eggs", "Peanuts", "Tree Nuts",
  "Shellfish", "Fish", "Soy", "Sesame", "Mustard",
];

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

/* Small uppercase section divider used inside the modal */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-gold">
        {children}
      </span>
      <span className="h-px flex-1 bg-admin-border" />
    </div>
  );
}

/* =========================================================
   MULTI-IMAGE UPLOADER
   - Grid of thumbnails with cover badge on index 0
   - Hover overlay: Replace / Delete + Left/Right reorder
   - "Add Image" tile (file picker → data URL)
   - Paste URL fallback
   - image/* only, 6MB max
   ========================================================= */
function MultiImageUploader({
  value, onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  // When set, the next file pick replaces this index instead of appending.
  const replaceIndexRef = useRef<number | null>(null);

  const validate = (file: File) => {
    const okType = /image\/(jpeg|jpg|png|webp|gif|avif)/.test(file.type);
    const okSize = file.size <= 6 * 1024 * 1024;
    if (!okType) { setError("Only JPG, PNG, WebP, GIF, AVIF allowed"); return false; }
    if (!okSize) { setError("Max file size is 6MB"); return false; }
    setError("");
    return true;
  };

  const onPick = async (file?: File) => {
    if (!file) return;
    if (!validate(file)) return;
    setUploading(true);
    setError("");
    try {
      // Upload to /api/upload — saves to public/uploads/, returns a URL.
      // NEVER store Base64 in the database.
      const url = await apiUpload(file);
      if (replaceIndexRef.current !== null) {
        const idx = replaceIndexRef.current;
        const next = [...value];
        next[idx] = url;
        onChange(next);
        replaceIndexRef.current = null;
      } else {
        onChange([...value, url]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerAdd = () => {
    replaceIndexRef.current = null;
    fileRef.current?.click();
  };

  const triggerReplace = (idx: number) => {
    replaceIndexRef.current = idx;
    fileRef.current?.click();
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    setError("");
    onChange([...value, u]);
    setUrlInput("");
  };

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="admin-label">Dish Images</span>
        <span className="font-sans text-[11px] text-admin-muted">
          {value.length} image{value.length !== 1 ? "s" : ""} · first is the cover
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((img, idx) => (
          <div
            key={`${idx}-${img.slice(0, 32)}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-admin-border bg-admin-bg"
          >
            <img src={img} alt={`Dish image ${idx + 1}`} className="h-full w-full object-cover" />
            {idx === 0 && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-admin-gold/40 bg-admin-gold/95 px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-black">
                <Star className="h-2 w-2 fill-black text-black" /> Cover
              </span>
            )}
            <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 font-sans text-[9px] font-medium text-white/80 backdrop-blur-sm">
              {idx + 1}
            </span>

            {/* Hover overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => triggerReplace(idx)}
                  aria-label={`Replace image ${idx + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors hover:border-admin-gold/50 hover:bg-admin-gold/20 hover:text-admin-gold"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label={`Delete image ${idx + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move image left"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors hover:border-admin-gold/50 hover:bg-admin-gold/20 hover:text-admin-gold disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === value.length - 1}
                  aria-label="Move image right"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors hover:border-admin-gold/50 hover:bg-admin-gold/20 hover:text-admin-gold disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add tile */}
        <button
          type="button"
          onClick={triggerAdd}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-admin-border bg-admin-bg/40 text-admin-muted transition-all duration-200 hover:border-admin-gold/40 hover:bg-admin-gold/5 hover:text-admin-gold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-admin-gold/30 border-t-admin-gold" />
              <span className="font-sans text-[10px] font-semibold uppercase tracking-wider">Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="font-sans text-[10px] font-semibold uppercase tracking-wider">Add Image</span>
            </>
          )}
        </button>
      </div>

      {/* URL fallback */}
      <div className="mt-3 flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="Or paste an image URL…"
          className="admin-input flex-1"
        />
        <AdminButton
          type="button"
          variant="subtle"
          onClick={addUrl}
          disabled={!urlInput.trim()}
        >
          <LinkIcon className="h-3.5 w-3.5" /> Add URL
        </AdminButton>
      </div>

      <p className="mt-1.5 font-sans text-xs text-admin-muted">
        JPG, PNG, WebP, GIF, AVIF · up to 6MB each
      </p>

      {/* Hidden file input shared by Add + Replace */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400">
          <AlertTriangle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   TAG INPUT — Linear/Notion-style chip editor
   Used for ingredients (gold) and allergens (red)
   ========================================================= */
function TagInput({
  label, values, onChange, placeholder, tone = "neutral", suggestions,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  tone?: "neutral" | "red";
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...values, v]);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const isRed = tone === "red";
  const chipClass = isRed
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : "border-admin-gold/30 bg-admin-gold/10 text-admin-gold";
  const xClass = isRed
    ? "text-red-400/60 hover:text-red-200"
    : "text-admin-gold/60 hover:text-admin-gold";
  const containerClass = isRed
    ? "border-red-500/20 focus-within:border-red-500/40"
    : "border-admin-border focus-within:border-admin-gold/40";
  const suggestionClass = isRed
    ? "border-red-500/20 text-red-400/80 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
    : "border-admin-border text-admin-muted hover:border-admin-gold/40 hover:bg-admin-gold/10 hover:text-admin-gold";

  const availableSuggestions =
    suggestions?.filter(
      (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())
    ) ?? [];

  return (
    <div className="block">
      <span className="mb-1.5 flex items-center gap-1 admin-label">{label}</span>
      <div
        className={`rounded-xl border bg-white/[0.02] p-2 transition-colors ${containerClass}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((v, idx) => (
            <span
              key={`${idx}-${v}`}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-sans text-xs ${chipClass}`}
            >
              {v}
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove ${v}`}
                className={`transition-colors ${xClass}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => input && add(input)}
            placeholder={values.length === 0 ? placeholder : "Add another…"}
            className="min-w-[120px] flex-1 bg-transparent px-1 py-1 font-sans text-sm text-admin-text outline-none placeholder:text-admin-muted/60"
          />
        </div>
      </div>
      {availableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-sans text-[10px] uppercase tracking-wider text-admin-muted">
            Quick add:
          </span>
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={`rounded-md border px-1.5 py-0.5 font-sans text-[11px] transition-colors ${suggestionClass}`}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
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
                  {cat.items.map((item) => {
                    const thumb = item.images?.[0] || item.image || "";
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-admin-gold/5"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
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
                            {item.chefRecommended && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-admin-gold/40 bg-admin-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-admin-gold">
                                <ChefHat className="h-2.5 w-2.5" /> Chef&apos;s Pick
                              </span>
                            )}
                            {item.veg ? <Badge tone="green">Veg</Badge> : <Badge tone="red">NV</Badge>}
                            <SpiceDots level={item.spice} />
                            {!item.available && <Badge tone="red">Sold Out</Badge>}
                          </div>
                          {item.tagline ? (
                            <p className="mt-0.5 truncate font-sans text-xs italic text-admin-gold/80">{item.tagline}</p>
                          ) : item.description ? (
                            <p className="mt-0.5 truncate font-sans text-xs text-admin-muted">{item.description}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-[family-name:var(--font-playfair)] text-lg font-semibold text-admin-gold">${item.price}</span>
                        <div className="flex shrink-0 gap-1 transition-opacity duration-200">
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
                    );
                  })}
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
  tagline: string;
  shortDescription: string;
  description: string;
  price: string;
  images: string[];
  categoryId: string;
  available: boolean;
  veg: boolean;
  spice: string;
  featured: boolean;
  chefRecommended: boolean;
  ingredients: string[];
  allergens: string[];
  servingSize: string;
};

function deriveItemForm(item: MenuItem | null, categories: MenuCategory[]): ItemFormState {
  if (item) {
    const imgs = item.images && item.images.length > 0
      ? item.images
      : item.image ? [item.image] : [];
    return {
      name: item.name,
      tagline: item.tagline ?? "",
      shortDescription: item.shortDescription ?? "",
      description: item.description,
      price: String(item.price),
      images: imgs,
      categoryId: item.categoryId,
      available: item.available,
      veg: item.veg,
      spice: String(item.spice),
      featured: item.featured,
      chefRecommended: item.chefRecommended ?? false,
      ingredients: item.ingredients ?? [],
      allergens: item.allergens ?? [],
      servingSize: item.servingSize ?? "",
    };
  }
  return {
    name: "",
    tagline: "",
    shortDescription: "",
    description: "",
    price: "",
    images: [],
    categoryId: categories[0]?.id ?? "",
    available: true,
    veg: false,
    spice: "0",
    featured: false,
    chefRecommended: false,
    ingredients: [],
    allergens: [],
    servingSize: "",
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
  // Lazy initialiser + conditional mount via `key` (in parent) keeps this lint-safe
  // (no setState-in-effect). Form resets cleanly per item.
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
        tagline: form.tagline.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description,
        price: Number(form.price),
        image: form.images[0] ?? null,
        images: form.images,
        categoryId: form.categoryId,
        available: form.available,
        veg: form.veg,
        spice: Number(form.spice),
        featured: form.featured,
        chefRecommended: form.chefRecommended,
        ingredients: form.ingredients,
        allergens: form.allergens,
        servingSize: form.servingSize.trim(),
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

  const canSave =
    !saving && form.name.trim().length > 0 && form.price !== "" && form.categoryId !== "";

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
            disabled={!canSave}
          >
            {saving ? "Saving…" : "Save Item"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-7">
        {/* ───────────── Essentials ───────────── */}
        <section className="space-y-4">
          <SectionLabel>Essentials</SectionLabel>
          <AdminInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Wagyu Tenderloin"
          />
          <AdminInput
            label="Tagline"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="A short evocative line — e.g. The crown jewel of the menu"
            hint="Shown beneath the dish name on the menu"
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
          <AdminInput
            label="Short Description"
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            placeholder="One-line summary for menu lists"
            hint="A single line used in compact menu layouts"
          />
          <AdminTextarea
            label="Full Description"
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="A rich, evocative description of the dish"
          />
        </section>

        {/* ───────────── Imagery ───────────── */}
        <section className="space-y-4">
          <SectionLabel>Imagery</SectionLabel>
          <MultiImageUploader
            value={form.images}
            onChange={(imgs) => set("images", imgs)}
          />
        </section>

        {/* ───────────── Dietary & Classification ───────────── */}
        <section className="space-y-4">
          <SectionLabel>Dietary & Classification</SectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              label="Spice Level"
              value={form.spice}
              onChange={(v) => set("spice", v)}
              options={SPICE_OPTIONS}
              searchable={false}
            />
            <AdminInput
              label="Serving Size"
              value={form.servingSize}
              onChange={(e) => set("servingSize", e.target.value)}
              placeholder="e.g. 200g, 4 pieces"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
            <Toggle label="Vegetarian" color="green" checked={form.veg} onChange={(v) => set("veg", v)} />
            <Toggle label="Featured" color="gold" checked={form.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Chef's Recommendation" color="gold" checked={form.chefRecommended} onChange={(v) => set("chefRecommended", v)} />
            <Toggle label="Available" color="green" checked={form.available} onChange={(v) => set("available", v)} />
          </div>
        </section>

        {/* ───────────── Ingredients & Allergens ───────────── */}
        <section className="space-y-4">
          <SectionLabel>Ingredients & Allergens</SectionLabel>
          <TagInput
            label="Ingredients"
            values={form.ingredients}
            onChange={(arr) => set("ingredients", arr)}
            placeholder="Type an ingredient and press Enter"
            tone="neutral"
          />
          <TagInput
            label="Allergens"
            values={form.allergens}
            onChange={(arr) => set("allergens", arr)}
            placeholder="Type an allergen and press Enter"
            tone="red"
            suggestions={COMMON_ALLERGENS}
          />
        </section>
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
