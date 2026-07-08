"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function AdminCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gold/10 bg-card/40 p-5", className)}>{children}</div>
  );
}

export function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent?: boolean }) {
  return (
    <AdminCard className={cn(accent && "border-gold/40 bg-gold/5")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-full border", accent ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-gold/70")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </AdminCard>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn("relative my-auto w-full rounded-2xl border border-gold/20 bg-card p-6 shadow-2xl", wide ? "max-w-2xl" : "max-w-md")}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{title}</h3>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-gold">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AdminInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{label}</span>
      <input {...props} className="w-full rounded-lg border border-gold/20 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none" />
    </label>
  );
}

export function AdminTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{label}</span>
      <textarea {...props} className="w-full rounded-lg border border-gold/20 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none" />
    </label>
  );
}

export function AdminSelect({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{label}</span>
      <select {...props} className="w-full rounded-lg border border-gold/20 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none">
        {children}
      </select>
    </label>
  );
}

export function AdminButton({ children, variant = "solid", className, ...props }: { variant?: "solid" | "outline" | "danger" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    solid: "bg-gold-gradient text-black hover:-translate-y-0.5",
    outline: "border border-gold/40 text-gold hover:bg-gold/10",
    danger: "border border-red-500/40 text-red-400 hover:bg-red-500/10",
    ghost: "text-muted-foreground hover:text-gold hover:bg-gold/5",
  } as const;
  return (
    <button {...props} className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-50", styles[variant], className)}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    CONFIRMED: "border-green-500/40 bg-green-500/10 text-green-400",
    CANCELLED: "border-red-500/40 bg-red-500/10 text-red-400",
    COMPLETED: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider", map[status] || "border-gold/30 text-gold")}>
      {status}
    </span>
  );
}
