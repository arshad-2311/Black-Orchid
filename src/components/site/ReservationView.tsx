"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, User, Phone, Mail, Check, Sparkles } from "lucide-react";
import { Eyebrow, OrnamentDivider } from "./primitives";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import type { Reservation } from "@/lib/types";

const TIMES = [
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
];

export function ReservationView() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", date: "", time: "", guests: "2", special: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Reservation | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiPost<Reservation>("/api/reservations", form);
      setSuccess(res);
      toast.success("Reservation request received! ✦");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-25">
          <img src="https://sfile.chatglm.cn/images-ppt/9c8b65502c86.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Book Your Table</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            Online <span className="text-gold-gradient">Reservation</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            Reserve in moments. Our maître d' will confirm your table personally.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-gold rounded-3xl p-10 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, stiffness: 200 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient">
                  <Check className="h-10 w-10 text-black" />
                </motion.div>
                <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Reservation Requested</h2>
                <p className="mt-3 font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
                  Thank you, {success.name}. We've received your request for {success.guests} guest{success.guests > 1 ? "s" : ""} on {success.date} at {success.time}.
                </p>
                <div className="mx-auto mt-6 max-w-sm rounded-xl border border-gold/20 bg-background/50 p-5 text-left">
                  <Row label="Reference" value={success.id.slice(-8).toUpperCase()} />
                  <Row label="Status" value="Pending Confirmation" />
                  <Row label="Email" value={success.email} />
                </div>
                <p className="mt-5 flex items-center justify-center gap-2 font-sans text-xs text-gold">
                  <Sparkles className="h-3.5 w-3.5" /> A confirmation email is on its way
                </p>
                <button
                  onClick={() => { setSuccess(null); setForm({ name: "", phone: "", email: "", date: "", time: "", guests: "2", special: "" }); }}
                  className="mt-6 rounded-full border border-gold/40 px-6 py-2.5 font-sans text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold/10"
                >
                  Make Another Reservation
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={submit}
                className="rounded-3xl border border-gold/10 bg-card/40 p-7 sm:p-10"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field icon={User} label="Full Name">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-lux" placeholder="Jane Doe" />
                  </Field>
                  <Field icon={Phone} label="Phone">
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-lux" placeholder="+1 (555) 000-0000" />
                  </Field>
                  <Field icon={Mail} label="Email" full>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-lux" placeholder="jane@email.com" />
                  </Field>
                  <Field icon={Calendar} label="Date">
                    <input required type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-lux" />
                  </Field>
                  <Field icon={Clock} label="Time">
                    <select required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-lux">
                      <option value="">Select time</option>
                      {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field icon={Users} label="Guests" full>
                    <div className="flex flex-wrap gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8+"].map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setForm({ ...form, guests: g === "8+" ? "8" : g })}
                          className={`h-11 w-11 rounded-full border font-sans text-sm transition-all ${form.guests === (g === "8+" ? "8" : g) ? "border-gold bg-gold-gradient text-black" : "border-gold/20 text-muted-foreground hover:border-gold/50"}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Special Requests" full>
                    <textarea rows={3} value={form.special} onChange={(e) => setForm({ ...form, special: e.target.value })} className="input-lux resize-none" placeholder="Anniversary, dietary needs, seating preference…" />
                  </Field>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? "Securing your table…" : <>Request Reservation <Sparkles className="h-4 w-4" /></>}
                </button>
                <p className="mt-3 text-center font-sans text-xs text-muted-foreground">
                  Your table is held for 15 minutes past the reservation time.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style>{`
        .input-lux {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid oklch(0.82 0.14 84 / 0.2);
          background: oklch(0.16 0.008 264 / 0.6);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: oklch(0.96 0.012 80);
          outline: none;
          transition: border-color 0.2s;
        }
        .input-lux::placeholder { color: oklch(0.7 0.02 80 / 0.5); }
        .input-lux:focus { border-color: oklch(0.82 0.14 84 / 0.6); }
        .input-lux option { background: oklch(0.18 0.008 264); color: oklch(0.96 0.012 80); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(3) hue-rotate(10deg); cursor: pointer; }
      `}</style>
    </div>
  );
}

function Field({ icon: Icon, label, children, full }: { icon?: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gold/10 py-2 last:border-0">
      <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-[family-name:var(--font-cormorant)] text-lg text-foreground">{value}</span>
    </div>
  );
}
