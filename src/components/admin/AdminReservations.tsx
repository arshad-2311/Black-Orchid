"use client";

import { useEffect, useState } from "react";
import { Search, Check, X, CheckCheck, Ban, Trash2, Download, Printer } from "lucide-react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import type { Reservation } from "@/lib/types";
import { AdminCard, AdminButton, StatusBadge, Modal } from "./ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export function AdminReservations() {
  const [list, setList] = useState<Reservation[] | null>(null);
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Reservation | null>(null);

  const fetchList = (s: string) => {
    apiGet<Reservation[]>(`/api/reservations${s !== "ALL" ? `?status=${s}` : ""}`)
      .then(setList)
      .catch(() => setList([]));
  };
  useEffect(() => {
    let cancelled = false;
    apiGet<Reservation[]>(`/api/reservations${status !== "ALL" ? `?status=${status}` : ""}`)
      .then((data) => { if (!cancelled) setList(data); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, [status]);

  const loading = list === null;
  const safeList = list ?? [];
  const filtered = safeList.filter((r) =>
    !query.trim() ? true : (r.name + r.email + r.phone + r.date).toLowerCase().includes(query.toLowerCase())
  );

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
    if (!confirm("Delete this reservation permanently?")) return;
    try {
      await apiDelete(`/api/reservations/${id}`);
      toast.success("Reservation deleted");
      fetchList(status);
      setDetail(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const exportCsv = () => {
    const rows = [["Name", "Phone", "Email", "Date", "Time", "Guests", "Status", "Special"]];
    filtered.forEach((r) => rows.push([r.name, r.phone, r.email, r.date, r.time, String(r.guests), r.status, r.special || ""]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Reservations</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{safeList.length} record{safeList.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Export CSV</AdminButton>
        </div>
      </div>

      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, date…" className="w-full rounded-lg border border-gold/20 bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none" />
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-3 py-1.5 font-sans text-[11px] font-medium uppercase tracking-wider transition-all", status === s ? "bg-gold-gradient text-black" : "border border-gold/20 text-muted-foreground hover:text-gold")}>{s}</button>
            ))}
          </div>
        </div>
      </AdminCard>

      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gold/10 font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Pax</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">Loading…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No reservations found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-gold/5 transition-colors hover:bg-gold/5">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(r)} className="text-left">
                      <p className="font-[family-name:var(--font-playfair)] text-base text-foreground hover:text-gold">{r.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{r.phone}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-muted-foreground">{r.date}<br />{r.time}</td>
                  <td className="px-4 py-3 font-sans text-sm text-foreground">{r.guests}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {r.status === "PENDING" && (
                        <button onClick={() => update(r.id, "CONFIRMED")} title="Confirm" className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10"><Check className="h-4 w-4" /></button>
                      )}
                      {r.status !== "CANCELLED" && r.status !== "COMPLETED" && (
                        <button onClick={() => update(r.id, "CANCELLED")} title="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"><Ban className="h-4 w-4" /></button>
                      )}
                      {r.status === "CONFIRMED" && (
                        <button onClick={() => update(r.id, "COMPLETED")} title="Mark completed" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/30 text-blue-300 hover:bg-blue-400/10"><CheckCheck className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => setDetail(r)} title="View" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 text-gold hover:bg-gold/10"><Search className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Reservation Details" wide>
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Guest" value={detail.name} />
              <Detail label="Status" value={<StatusBadge status={detail.status} />} />
              <Detail label="Phone" value={detail.phone} />
              <Detail label="Email" value={detail.email} />
              <Detail label="Date" value={detail.date} />
              <Detail label="Time" value={detail.time} />
              <Detail label="Guests" value={String(detail.guests)} />
              <Detail label="Submitted" value={new Date(detail.createdAt).toLocaleString()} />
            </div>
            {detail.special && (
              <div>
                <p className="mb-1 font-sans text-[10px] uppercase tracking-wider text-gold/80">Special Requests</p>
                <p className="rounded-lg border border-gold/10 bg-background/40 p-3 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">{detail.special}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-gold/10 pt-4">
              <AdminButton variant="solid" onClick={() => update(detail.id, "CONFIRMED")}><Check className="h-3.5 w-3.5" /> Confirm</AdminButton>
              <AdminButton variant="outline" onClick={() => update(detail.id, "COMPLETED")}><CheckCheck className="h-3.5 w-3.5" /> Complete</AdminButton>
              <AdminButton variant="outline" onClick={() => update(detail.id, "CANCELLED")}><X className="h-3.5 w-3.5" /> Cancel</AdminButton>
              <AdminButton variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</AdminButton>
              <AdminButton variant="danger" onClick={() => remove(detail.id)} className="ml-auto"><Trash2 className="h-3.5 w-3.5" /> Delete</AdminButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
      <p className="font-sans text-[10px] uppercase tracking-wider text-gold/80">{label}</p>
      <div className="mt-1 font-[family-name:var(--font-cormorant)] text-lg text-foreground">{value}</div>
    </div>
  );
}
