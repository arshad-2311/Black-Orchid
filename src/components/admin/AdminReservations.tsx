"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Check, X, CheckCheck, Ban, Trash2, Download, Printer,
  ArrowUp, ArrowDown, ChevronsUpDown, QrCode, Sparkles,
} from "lucide-react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import type { Reservation } from "@/lib/types";
import {
  AdminCard, AdminButton, AdminInput, AdminSectionTitle,
  StatusBadge, Modal, Skeleton, EmptyState, Pagination,
} from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
type SortKey = "date" | "guests" | "status" | "createdAt";
type SortDir = "asc" | "desc" | null;
const PAGE_SIZE = 10;

export function AdminReservations() {
  const [list, setList] = useState<Reservation[] | null>(null);
  const [status, setStatus] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [hostCheckInOpen, setHostCheckInOpen] = useState(false);

  const fetchList = (s: string) => {
    apiGet<Reservation[]>(`/api/reservations${s !== "ALL" ? `?status=${s}` : ""}`)
      .then(setList)
      .catch(() => setList([]));
  };

  // Robust data fetching — cancelled flag guard, no synchronous setState in body.
  useEffect(() => {
    let cancelled = false;
    apiGet<Reservation[]>(`/api/reservations${status !== "ALL" ? `?status=${status}` : ""}`)
      .then((data) => { if (!cancelled) setList(data); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, [status]);

  const loading = list === null;
  const safeList = list ?? [];

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeList;
    return safeList.filter((r) =>
      `${r.name} ${r.email} ${r.phone} ${r.date}`.toLowerCase().includes(q)
    );
  }, [safeList, query]);

  // Sort (effective sort = sortKey/sortDir, falling back to createdAt desc when null)
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const key: SortKey = sortDir ? sortKey : "createdAt";
    const dir: "asc" | "desc" = sortDir ?? "desc";
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (key === "guests") { av = a.guests; bv = b.guests; }
      else if (key === "date") { av = `${a.date} ${a.time}`; bv = `${b.date} ${b.time}`; }
      else if (key === "status") { av = a.status; bv = b.status; }
      else { av = a.createdAt; bv = b.createdAt; }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Pagination (client-side, 10 per page)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, sorted.length);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Bulk selection
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const someOnPageSelected = pageRows.some((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    const next = new Set(selected);
    if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());

  // Mutations
  const update = async (id: string, s: Reservation["status"]) => {
    try {
      await apiPatch(`/api/reservations/${id}`, { status: s });
      toast.success(`Reservation marked ${s.toLowerCase()}`);
      fetchList(status);
      if (detail?.id === id) setDetail({ ...detail, status: s });
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiDelete(`/api/reservations/${id}`);
      toast.success("Reservation deleted");
      fetchList(status);
      setDetail(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const bulkUpdate = async (s: Reservation["status"]) => {
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try { await apiPatch(`/api/reservations/${id}`, { status: s }); ok++; } catch { /* skip */ }
    }
    toast.success(`${ok} reservation${ok !== 1 ? "s" : ""} marked ${s.toLowerCase()}`);
    setSelected(new Set());
    fetchList(status);
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try { await apiDelete(`/api/reservations/${id}`); ok++; } catch { /* skip */ }
    }
    toast.success(`${ok} reservation${ok !== 1 ? "s" : ""} deleted`);
    setSelected(new Set());
    fetchList(status);
  };

  // CSV export (unchanged logic)
  const exportCsv = () => {
    const rows = [["Name", "Phone", "Email", "Date", "Time", "Adult Guests", "Kids", "Status", "Special"]];
    sorted.forEach((r) => rows.push([r.name, r.phone, r.email, r.date, r.time, String(r.guests), String(r.kids || 0), r.status, r.special || ""]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort cycle: asc -> desc -> null (reset to createdAt desc)
  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey !== key || sortDir === null) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey("createdAt");
      setSortDir("desc");
    }
  };

  const onStatusChange = (s: string) => {
    setStatus(s);
    setList(null); // show skeleton while new fetch is in flight
    setPage(1);
    setSelected(new Set());
  };

  const onQueryChange = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Reservations"
        subtitle={`${safeList.length} record${safeList.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[320px] max-w-full">
              <AdminInput
                icon={Search}
                placeholder="Search name, email, phone, date…"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
            <AdminButton variant="outline" size="sm" onClick={exportCsv} disabled={safeList.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </AdminButton>
            <AdminButton variant="solid" size="sm" onClick={() => setHostCheckInOpen(true)}>
              <QrCode className="h-3.5 w-3.5" /> Host Stand Check-In
            </AdminButton>
          </div>
        }
      />

      <AdminCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead className="sticky top-0 z-10 border-b border-admin-border bg-admin-card/95 backdrop-blur">
              <tr className="font-sans text-[10px] uppercase tracking-wider text-admin-muted">
                <th className="w-12 px-4 py-3.5">
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={!allOnPageSelected && someOnPageSelected}
                    onChange={toggleSelectAll}
                    ariaLabel="Select all on page"
                  />
                </th>
                <th className="px-4 py-3.5">Guest</th>
                <SortHeader
                  label="Date / Time"
                  active={sortKey === "date" && sortDir !== null}
                  dir={sortKey === "date" ? sortDir : null}
                  onClick={() => toggleSort("date")}
                />
                <SortHeader
                  label="Adults"
                  center
                  active={sortKey === "guests" && sortDir !== null}
                  dir={sortKey === "guests" ? sortDir : null}
                  onClick={() => toggleSort("guests")}
                />
                <th className="px-4 py-3.5 text-center font-sans text-[10px] font-semibold uppercase tracking-wider text-admin-muted">
                  Kids
                </th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-admin-border/50">
                    <td className="px-4 py-4"><Skeleton className="h-5 w-5 rounded-md" /></td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="mt-2 h-3 w-24 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="mt-2 h-3 w-14 rounded" />
                    </td>
                    <td className="px-4 py-4"><Skeleton className="mx-auto h-5 w-8 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="ml-auto h-7 w-28 rounded-lg" /></td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      title="No reservations found"
                      message="Try adjusting your search query to find what you're looking for."
                    />
                  </td>
                </tr>
              ) : (
                pageRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    onClick={() => setDetail(r)}
                    className={cn(
                      "cursor-pointer border-b border-admin-border/50 transition-colors duration-200",
                      idx % 2 === 1 && "bg-white/[0.015]",
                      "hover:bg-admin-gold/5",
                      selected.has(r.id) && "bg-admin-gold/10 hover:bg-admin-gold/15"
                    )}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onChange={() => toggleRow(r.id)}
                        ariaLabel={`Select ${r.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-[family-name:var(--font-playfair)] text-base font-semibold text-admin-text">{r.name}</p>
                      <p className="mt-0.5 font-sans text-xs text-admin-muted">{r.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-sm font-medium text-admin-text">{r.date}</p>
                      <p className="mt-0.5 font-sans text-xs text-admin-muted">{r.time}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border border-admin-border bg-white/[0.03] px-2 font-sans text-xs font-medium text-admin-text">
                        {r.guests}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border px-2 font-sans text-xs font-medium",
                        r.kids && r.kids > 0
                          ? "border-gold/40 bg-gold/10 text-gold font-semibold"
                          : "border-admin-border bg-white/[0.02] text-admin-muted"
                      )}>
                        {r.kids || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <IconAction
                          title="View details"
                          onClick={() => setDetail(r)}
                          className="border-admin-gold/30 text-admin-gold hover:bg-admin-gold/10"
                        >
                          <Search className="h-4 w-4" />
                        </IconAction>
                        <IconAction
                          title="Delete"
                          onClick={() => {
                            if (window.confirm(`Delete reservation for ${r.name}?`)) remove(r.id);
                          }}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Count + pagination */}
      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="font-sans text-xs text-admin-muted">
            Showing <span className="font-medium text-admin-text">{startIdx}</span>–
            <span className="font-medium text-admin-text">{endIdx}</span> of{" "}
            <span className="font-medium text-admin-text">{sorted.length}</span>
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
        </div>
      )}

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            key="bulk-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 240, ease: [0.22, 1, 0.36, 1] }}
            className="sticky bottom-4 z-30"
          >
            <div className="admin-surface-elevated flex flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-soft-lg">
              <div className="flex items-center gap-3">
                <span className="admin-gold-bg flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 font-sans text-xs font-bold text-black">
                  {selected.size}
                </span>
                <span className="font-sans text-sm text-admin-text">
                  {selected.size === 1 ? "reservation" : "reservations"} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="font-sans text-xs text-admin-muted underline-offset-2 transition-colors hover:text-admin-text hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton
                  variant="danger"
                  size="sm"
                  confirm="Delete all selected reservations permanently? This cannot be undone."
                  onConfirm={bulkDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </AdminButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Reservation Details"
        subtitle={detail ? `Ref · ${detail.id.slice(0, 8).toUpperCase()}` : undefined}
        size="lg"
        footer={
          detail ? (
            <>
              <AdminButton variant="ghost" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </AdminButton>
              <div className="ml-auto flex flex-wrap gap-2">
                <AdminButton
                  variant="danger"
                  confirm="Delete this reservation permanently? This cannot be undone."
                  onConfirm={() => remove(detail.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </AdminButton>
              </div>
            </>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBox label="Guest" value={detail.name} />
              <DetailBox label="Status" value={<StatusBadge status={detail.status} />} />
              <DetailBox label="Phone" value={detail.phone} />
              <DetailBox label="Email" value={detail.email || "—"} />
              <DetailBox label="Date" value={detail.date} />
              <DetailBox label="Time" value={detail.time} />
              <DetailBox label="Adult Guests" value={`${detail.guests} ${detail.guests === 1 ? "adult" : "adults"}`} />
              <DetailBox label="Kids / Children" value={`${detail.kids || 0} ${detail.kids === 1 ? "child" : "children"}`} />
              <DetailBox label="Submitted" value={new Date(detail.createdAt).toLocaleString()} />
            </div>

            <div>
              <p className="admin-label mb-2">Special Requests</p>
              <div className="rounded-xl border border-admin-gold/20 bg-admin-gold/[0.04] p-4">
                {detail.special ? (
                  <p className="font-[family-name:var(--font-cormorant)] text-lg italic leading-relaxed text-admin-text">
                    &ldquo;{detail.special}&rdquo;
                  </p>
                ) : (
                  <p className="font-[family-name:var(--font-cormorant)] text-lg italic text-admin-muted">
                    No special requests.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Host Stand Check-In Modal */}
      {hostCheckInOpen && (
        <HostCheckInModal
          list={safeList}
          onClose={() => setHostCheckInOpen(false)}
          onUpdateStatus={update}
        />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function DetailBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-admin-border bg-white/[0.02] p-3.5">
      <p className="admin-label">{label}</p>
      <div className="mt-1.5 font-sans text-sm font-medium text-admin-text">{value}</div>
    </div>
  );
}

function SortHeader({
  label, active, dir, onClick, center,
}: {
  label: string; active: boolean; dir: SortDir; onClick: () => void; center?: boolean;
}) {
  return (
    <th className={cn("px-4 py-3.5", center && "text-center")}>
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-admin-gold" : "text-admin-muted hover:text-admin-text"
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function IconAction({
  title, onClick, className, children,
}: {
  title: string; onClick: () => void; className?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
        className
      )}
    >
      {children}
    </button>
  );
}

function Checkbox({
  checked, indeterminate, onChange, ariaLabel,
}: {
  checked: boolean; indeterminate?: boolean; onChange: () => void; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200",
        checked || indeterminate
          ? "admin-gold-bg border-transparent text-black"
          : "border-admin-border text-transparent hover:border-admin-gold/50"
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2.5 rounded-full bg-black" />
      ) : checked ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : null}
    </button>
  );
}

function HostCheckInModal({
  list, onClose, onUpdateStatus,
}: {
  list: Reservation[];
  onClose: () => void;
  onUpdateStatus: (id: string, s: Reservation["status"]) => void;
}) {
  const [ticketInput, setTicketInput] = useState("");

  const matched = useMemo(() => {
    const q = ticketInput.trim().toUpperCase().replace("BO-RES-", "");
    if (!q) return null;
    return list.find((r) => r.id.toUpperCase().includes(q) || r.id.slice(-8).toUpperCase() === q || r.name.toUpperCase().includes(q));
  }, [ticketInput, list]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Host Stand Check-In Scanner"
      subtitle="Scan or enter guest ticket reference code (BO-RES-XXXXX)"
      size="md"
      footer={
        <AdminButton variant="ghost" onClick={onClose}>Close</AdminButton>
      }
    >
      <div className="space-y-5">
        <AdminInput
          label="Ticket Code or Guest Name"
          icon={QrCode}
          value={ticketInput}
          onChange={(e) => setTicketInput(e.target.value)}
          placeholder="e.g. BO-RES-12345678 or Guest Name"
          autoFocus
        />

        {matched ? (
          <div className="rounded-xl border border-admin-gold/40 bg-admin-gold/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-admin-gold">
                BO-RES-{matched.id.slice(-8).toUpperCase()}
              </span>
              <StatusBadge status={matched.status} />
            </div>
            <div>
              <h4 className="font-serif text-lg font-semibold text-white">{matched.name}</h4>
              <p className="text-xs text-admin-muted">{matched.date} at {matched.time} · {matched.guests} Guests</p>
              <p className="text-xs text-admin-muted font-mono">{matched.email} · {matched.phone}</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-admin-border/50">
              <AdminButton
                variant="solid"
                size="sm"
                className="flex-1"
                onClick={() => { onUpdateStatus(matched.id, "CONFIRMED"); toast.success(`Guest ${matched.name} checked in!`); }}
              >
                <Check className="h-3.5 w-3.5" /> Check In & Seat Guest
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => { onUpdateStatus(matched.id, "COMPLETED"); toast.success(`Reservation for ${matched.name} completed!`); }}
              >
                Mark Completed
              </AdminButton>
            </div>
          </div>
        ) : ticketInput.trim() ? (
          <div className="rounded-xl border border-admin-border bg-admin-card/50 p-4 text-center text-xs text-admin-muted">
            No matching reservation found for "{ticketInput}"
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-admin-border p-6 text-center text-xs text-admin-muted">
            Ready to scan. Point host camera scanner at guest pass or type ticket code above.
          </div>
        )}
      </div>
    </Modal>
  );
}
