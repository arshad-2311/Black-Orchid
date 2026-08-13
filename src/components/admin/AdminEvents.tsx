"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarDays } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminTextarea, Toggle,
  Modal, AdminSectionTitle, Badge, ImageUploader, Skeleton, EmptyState,
} from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminEvents() {
  const [list, setList] = useState<EventItem[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; e: EventItem | null }>({ open: false, e: null });

  useEffect(() => {
    let cancelled = false;
    apiGet<EventItem[]>("/api/events")
      .then((d) => { if (!cancelled) setList(d); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  const load = () => apiGet<EventItem[]>("/api/events").then(setList).catch(() => {});

  const togglePublish = (e: EventItem) => {
    apiPatch(`/api/events/${e.id}`, { published: !e.published })
      .then(() => { toast.success(e.published ? "Event hidden" : "Event published"); load(); })
      .catch(() => toast.error("Update failed"));
  };

  const remove = (e: EventItem) => {
    setList((prev) => (prev ? prev.filter((item) => item.id !== e.id) : null));
    apiDelete(`/api/events/${e.id}`)
      .then(() => {
        toast.success("Event deleted");
        load();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Delete failed");
        load();
      });
  };

  const publishedCount = list?.filter((e) => e.published).length ?? 0;

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Events"
        subtitle={list ? `${list.length} events · ${publishedCount} published` : "Loading events…"}
        action={
          <AdminButton variant="solid" size="sm" onClick={() => setModal({ open: true, e: null })}>
            <Plus className="h-3.5 w-3.5" /> Add Event
          </AdminButton>
        }
      />

      {list === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminCard key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </div>
            </AdminCard>
          ))}
        </div>
      ) : list.length === 0 ? (
        <AdminCard>
          <EmptyState
            title="No events yet"
            message="Promote upcoming dinners, tastings, and banquets."
            action={
              <AdminButton variant="solid" onClick={() => setModal({ open: true, e: null })}>
                <Plus className="h-3.5 w-3.5" /> Add Event
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <AdminCard key={e.id} className="flex flex-col overflow-hidden p-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-admin-bg">
                {e.image ? (
                  <img src={e.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-admin-muted/30">
                    <CalendarDays className="h-10 w-10" />
                  </div>
                )}
                {!e.published && (
                  <div className="absolute right-3 top-3">
                    <Badge tone="neutral">Hidden</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <Badge tone="gold" >
                  <CalendarDays className="h-3 w-3" /> {formatDate(e.date)}
                </Badge>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">{e.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 font-sans text-xs text-admin-muted">{e.description}</p>

                <div className="mt-4 flex items-center gap-1.5 border-t border-admin-border pt-3">
                  <button
                    onClick={() => togglePublish(e)}
                    aria-label={e.published ? `Hide ${e.title}` : `Publish ${e.title}`}
                    title={e.published ? "Published — click to hide" : "Hidden — click to publish"}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-lg border px-3 font-sans text-[11px] font-medium uppercase tracking-wider transition-colors",
                      e.published
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-admin-border text-admin-muted hover:bg-white/5 hover:text-admin-text"
                    )}
                  >
                    {e.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {e.published ? "Published" : "Hidden"}
                  </button>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => setModal({ open: true, e })}
                      aria-label={`Edit ${e.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-gold/30 text-admin-gold transition-colors hover:bg-admin-gold/10"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete event "${e.title}"?`)) remove(e);
                      }}
                      aria-label={`Delete ${e.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <EventModal
          key={modal.e?.id ?? "new"}
          e={modal.e}
          onClose={() => setModal({ open: false, e: null })}
          onSaved={() => { setModal({ open: false, e: null }); load(); }}
        />
      )}
    </div>
  );
}

type EventFormState = {
  title: string;
  description: string;
  date: string;
  image: string;
  published: boolean;
};

function deriveForm(e: EventItem | null): EventFormState {
  if (e) {
    return {
      title: e.title,
      description: e.description,
      date: e.date,
      image: e.image ?? "",
      published: e.published,
    };
  }
  return { title: "", description: "", date: "", image: "", published: true };
}

function EventModal({ e, onClose, onSaved }: { e: EventItem | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<EventFormState>(() => deriveForm(e));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EventFormState>(k: K, v: EventFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        date: form.date,
        image: form.image || null,
        published: form.published,
      };
      if (e) await apiPatch(`/api/events/${e.id}`, payload);
      else await apiPost("/api/events", payload);
      toast.success(e ? "Event updated" : "Event created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={e ? "Edit Event" : "Add Event"}
      subtitle={e ? e.title : "Promote an upcoming dinner, tasting, or banquet"}
      size="lg"
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={save} disabled={saving || !form.title.trim() || !form.date}>
            {saving ? "Saving…" : "Save Event"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <AdminInput
          label="Title"
          required
          value={form.title}
          onChange={(ev) => set("title", ev.target.value)}
          placeholder="Event title"
        />
        <AdminTextarea
          label="Description"
          value={form.description}
          onChange={(ev) => set("description", ev.target.value)}
          rows={3}
          placeholder="What makes this event special?"
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <AdminInput
            label="Date"
            required
            type="date"
            value={form.date}
            onChange={(ev) => set("date", ev.target.value)}
          />
          <div className="flex items-center justify-start gap-3 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
            <Toggle label="Published" color="green" checked={form.published} onChange={(v) => set("published", v)} />
          </div>
        </div>
        <ImageUploader label="Poster Image" aspect="16/10" value={form.image} onChange={(v) => set("image", v)} />
      </div>
    </Modal>
  );
}
