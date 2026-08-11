"use client";

import { useState } from "react";
import { Check, CheckCheck, X, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Reservation } from "@/lib/types";

export default function VerifyActions({ reservation }: { reservation: Reservation }) {
  const [status, setStatus] = useState<Reservation["status"]>(reservation.status);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: Reservation["status"]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Admin authentication required to perform host actions");
          return;
        }
        throw new Error("Update failed");
      }

      setStatus(newStatus);
      toast.success(`Reservation marked ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update reservation status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gold/20 pt-6 print:hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">
          Host Stand Quick Actions
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
          <Lock className="h-3 w-3 text-gold" /> Admin Protected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => updateStatus("CONFIRMED")}
          disabled={loading || status === "CONFIRMED"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 font-sans text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Seat Guest
        </button>

        <button
          onClick={() => updateStatus("COMPLETED")}
          disabled={loading || status === "COMPLETED"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2.5 font-sans text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" /> Complete
        </button>

        <button
          onClick={() => updateStatus("CANCELLED")}
          disabled={loading || status === "CANCELLED"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 font-sans text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
