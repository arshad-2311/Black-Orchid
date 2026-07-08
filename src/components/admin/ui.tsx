"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ChevronDown, Search, Upload, Image as ImageIcon, Trash2, AlertTriangle,
  ChevronLeft, ChevronRight, Inbox,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/* =========================================================
   SURFACES
   ========================================================= */
export function AdminCard({
  children, className, hover = false, elevated = false, onClick,
}: {
  children: React.ReactNode; className?: string; hover?: boolean; elevated?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        elevated ? "admin-surface-elevated" : "admin-surface",
        "transition-all duration-300",
        hover && "hover:-translate-y-0.5 hover:shadow-soft-lg cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

/* =========================================================
   STAT CARD with mini sparkline
   ========================================================= */
export function StatCard({
  label, value, icon: Icon, delta, deltaPositive = true, spark,
}: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>;
  delta?: string; deltaPositive?: boolean; spark?: number[];
}) {
  return (
    <AdminCard hover className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="admin-label">{label}</p>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-admin-text">{value}</p>
          {delta && (
            <p className={cn("mt-1.5 flex items-center gap-1 font-sans text-xs", deltaPositive ? "text-emerald-400" : "text-red-400")}>
              <span>{deltaPositive ? "▲" : "▼"}</span> {delta}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-admin-border bg-admin-gold/10 text-admin-gold">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-4 h-10">
          <Sparkline data={spark} />
        </div>
      )}
    </AdminCard>
  );
}

export function Sparkline({ data, color = "#d4af37" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts} 100,100`} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* =========================================================
   SECTION HEADING (admin)
   ========================================================= */
export function AdminSectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-admin-text">{title}</h1>
        {subtitle && <p className="mt-1 font-sans text-sm text-admin-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* =========================================================
   MODAL — wider, scale+fade, sticky footer
   ========================================================= */
export function Modal({
  open, onClose, title, subtitle, children, footer, wide = false, size = "md",
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const maxW = wide ? "max-w-2xl" : size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 200 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 240, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn("admin-surface-elevated my-auto w-full overflow-hidden", maxW)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-admin-border px-8 py-6">
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-admin-text">{title}</h3>
                {subtitle && <p className="mt-1 font-sans text-sm text-admin-muted">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-admin-border text-admin-muted transition-all hover:border-admin-gold/50 hover:bg-admin-gold/10 hover:text-admin-gold"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-8 py-6">{children}</div>
            {/* Sticky footer */}
            {footer && (
              <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-admin-border bg-admin-card/80 px-8 py-4 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   FORM FIELDS
   ========================================================= */
export function AdminInput({
  label, required, error, hint, icon: Icon, ...props
}: { label?: string; required?: boolean; error?: string; hint?: string; icon?: React.ComponentType<{ className?: string }> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1 admin-label">
          {label}{required && <span className="text-admin-gold">*</span>}
        </span>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />}
        <input
          {...props}
          className={cn("admin-input", Icon && "pl-11", error && "border-red-500/60 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.16)]", props.className)}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400"><AlertTriangle className="h-3 w-3" />{error}</p>
      ) : hint ? (
        <p className="mt-1.5 font-sans text-xs text-admin-muted">{hint}</p>
      ) : null}
    </label>
  );
}

export function AdminTextarea({
  label, required, error, ...props
}: { label?: string; required?: boolean; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1 admin-label">
          {label}{required && <span className="text-admin-gold">*</span>}
        </span>
      )}
      <textarea
        {...props}
        className={cn("admin-input h-auto resize-none py-3", error && "border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.16)]", props.className)}
      />
      {error && <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400"><AlertTriangle className="h-3 w-3" />{error}</p>}
    </label>
  );
}

/* =========================================================
   SEARCHABLE SELECT — premium dropdown with keyboard nav
   ========================================================= */
type Option = { value: string; label: string };

export function SearchableSelect({
  label, required, options, value, onChange, placeholder = "Select…", error, searchable = true,
}: {
  label?: string; required?: boolean; options: Option[]; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (v: string) => { onChange(v); setOpen(false); setQuery(""); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && open) { e.preventDefault(); if (filtered[active]) choose(filtered[active].value); }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="block">
      {label && <span className="mb-1.5 flex items-center gap-1 admin-label">{label}{required && <span className="text-admin-gold">*</span>}</span>}
      <div ref={ref} className="relative" onKeyDown={onKey}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn("admin-input flex items-center justify-between text-left", !selected && "text-admin-muted", error && "border-red-500/60")}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-admin-muted transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 160, ease: [0.22, 1, 0.36, 1] }}
              className="admin-surface-elevated absolute z-50 mt-2 w-full overflow-hidden p-1.5"
            >
              {searchable && (
                <div className="relative mb-1.5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    placeholder="Search…"
                    className="h-9 w-full rounded-lg border border-admin-border bg-admin-bg/60 pl-9 pr-3 text-sm text-admin-text outline-none focus:border-admin-gold/50"
                  />
                </div>
              )}
              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center font-sans text-sm text-admin-muted">No results</p>
                ) : filtered.map((o, i) => (
                  <button
                    key={o.value}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-sans text-sm transition-colors",
                      i === active ? "bg-admin-gold/15 text-admin-gold" : "text-admin-text hover:bg-white/5"
                    )}
                  >
                    {o.label}
                    {o.value === value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400"><AlertTriangle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

/* =========================================================
   TOGGLE — modern animated
   ========================================================= */
export function Toggle({
  checked, onChange, label, color = "gold",
}: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; color?: "gold" | "green" | "blue";
}) {
  const colors = {
    gold: "bg-gradient-to-r from-[#e6c659] to-[#d4af37]",
    green: "bg-emerald-500",
    blue: "bg-sky-500",
  } as const;
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5">
      <span className={cn("relative h-6 w-11 rounded-full transition-colors duration-300", checked ? colors[color] : "bg-white/10")}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md", checked ? "left-[22px]" : "left-0.5")}
        />
      </span>
      {label && <span className="admin-label">{label}</span>}
    </button>
  );
}

/* =========================================================
   BUTTONS
   ========================================================= */
export function AdminButton({
  children, variant = "solid", className, size = "md", confirm, onConfirm, ...props
}: {
  variant?: "solid" | "outline" | "danger" | "ghost" | "subtle"; size?: "sm" | "md" | "lg";
  confirm?: string; onConfirm?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-10 px-4 text-xs",
    lg: "h-12 px-6 text-sm",
  } as const;
  const styles = {
    solid: "admin-gold-bg text-black font-semibold shadow-gold-glow hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-8px_rgba(212,175,55,0.6)] active:translate-y-0",
    outline: "border border-admin-border bg-white/[0.02] text-admin-text hover:border-admin-gold/40 hover:bg-admin-gold/5",
    danger: "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50",
    ghost: "text-admin-muted hover:bg-white/5 hover:text-admin-text",
    subtle: "bg-white/[0.06] text-admin-text hover:bg-white/10",
  } as const;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirm) {
      if (window.confirm(confirm)) { onConfirm?.(); props.onClick?.(e); }
      return;
    }
    props.onClick?.(e);
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-sans uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        sizes[size], styles[variant], className
      )}
    >
      {children}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    CONFIRMED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-400",
    COMPLETED: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider", map[status] || "border-admin-border text-admin-muted")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "green" | "red" | "blue" | "neutral" }) {
  const tones = {
    gold: "border-admin-gold/30 bg-admin-gold/10 text-admin-gold",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    blue: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    neutral: "border-admin-border bg-white/5 text-admin-muted",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider", tones[tone])}>
      {children}
    </span>
  );
}

/* =========================================================
   IMAGE UPLOADER — drag & drop, preview, progress, remove/replace
   ========================================================= */
export function ImageUploader({
  value, onChange, label = "Image", aspect = "16/10",
}: {
  value: string; onChange: (v: string) => void; label?: string; aspect?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validate = (file: File) => {
    const okType = /image\/(jpeg|jpg|png|webp|gif|avif)/.test(file.type);
    const okSize = file.size <= 6 * 1024 * 1024;
    if (!okType) { setError("Only JPG, PNG, WebP, GIF, AVIF allowed"); return false; }
    if (!okSize) { setError("Max file size is 6MB"); return false; }
    setError(""); return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validate(file)) return;
    const reader = new FileReader();
    reader.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    reader.onload = () => {
      setProgress(100);
      setTimeout(() => {
        setProgress(null);
        onChange(reader.result as string);
      }, 300);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const hasImage = !!value;

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="admin-label">{label}</span>
        <button type="button" onClick={() => setUrlMode((m) => !m)} className="font-sans text-[11px] text-admin-gold hover:underline">
          {urlMode ? "Upload file" : "Paste URL"}
        </button>
      </div>

      {urlMode ? (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="admin-input flex-1"
          />
          <AdminButton type="button" variant="subtle" onClick={() => { if (urlInput) { onChange(urlInput); setUrlInput(""); } }}>Set</AdminButton>
        </div>
      ) : !hasImage ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all",
            dragging ? "border-admin-gold bg-admin-gold/10" : "border-admin-border bg-admin-bg/40 hover:border-admin-gold/40 hover:bg-admin-gold/5"
          )}
          style={{ aspectRatio: aspect }}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-admin-border bg-admin-gold/10 text-admin-gold">
            <Upload className="h-5 w-5" />
          </div>
          <p className="mt-3 font-sans text-sm font-medium text-admin-text">Drop image here, or <span className="text-admin-gold">browse</span></p>
          <p className="mt-1 font-sans text-xs text-admin-muted">JPG, PNG, WebP, GIF · up to 6MB</p>
        </div>
      ) : (
        <div className="group relative overflow-hidden rounded-xl border border-admin-border" style={{ aspectRatio: aspect }}>
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <AdminButton type="button" size="sm" variant="subtle" onClick={() => inputRef.current?.click()}><ImageIcon className="h-3.5 w-3.5" /> Replace</AdminButton>
            <AdminButton type="button" size="sm" variant="danger" onClick={() => onChange("")}><Trash2 className="h-3.5 w-3.5" /> Remove</AdminButton>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div className="admin-gold-bg h-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
          </div>
          <p className="mt-1 text-center font-sans text-[11px] text-admin-muted">Uploading… {progress}%</p>
        </div>
      )}
      {error && <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400"><AlertTriangle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

/* =========================================================
   SKELETON
   ========================================================= */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("admin-skeleton", className)} />;
}

/* =========================================================
   EMPTY STATE
   ========================================================= */
export function EmptyState({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-admin-border bg-white/5 text-admin-muted">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm font-sans text-sm text-admin-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* =========================================================
   PAGINATION
   ========================================================= */
export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3">
      <p className="font-sans text-xs text-admin-muted">Page {page} of {totalPages}</p>
      <div className="flex gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPage(i + 1)}
            className={cn("h-8 w-8 rounded-lg border font-sans text-xs transition-colors", page === i + 1 ? "admin-gold-bg border-transparent font-semibold text-black" : "border-admin-border text-admin-muted hover:bg-white/5")}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
