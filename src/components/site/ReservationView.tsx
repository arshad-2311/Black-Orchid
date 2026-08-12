"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Calendar, Check, Clock, Mail, Minus, Phone, Plus, Sparkles, User, QrCode, Printer,
} from "lucide-react";
import QRCode from "qrcode";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealText } from "./motion";
import { apiPost } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import { toast } from "sonner";
import type { Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PremiumCalendar } from "./PremiumCalendar";

const STEPS = ["Date", "Time", "Guests", "Details", "Confirm"] as const;
const LUNCH_TIMES = ["11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM"];
const AFTERNOON_TIMES = ["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"];
const DINNER_TIMES = ["6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM"];
const GUEST_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8+"] as const;
const MAX_GUESTS = 20;

type FormState = {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  kids: string;
  special: string;
};

const EMPTY_FORM: FormState = {
  name: "", phone: "", email: "", date: "", time: "", guests: "2", kids: "0", special: "",
};

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15 sm:h-14";

type ReservationWithNotif = Reservation & { notificationStatus?: { email: string; sms: string } };

export function ReservationView() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<ReservationWithNotif | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      // Date
      if (!form.date) e.date = "Please select a date";
    } else if (s === 1) {
      // Time
      if (!form.time) e.time = "Please select a time";
    } else if (s === 2) {
      // Guests — always valid (defaults to 2), no validation needed
    } else if (s === 3) {
      // Customer details
      if (!form.name.trim()) e.name = "Please enter your name";
      else if (form.name.trim().length < 2) e.name = "Name is too short";
      if (!form.phone.trim()) e.phone = "Please enter your phone number";
      else if (form.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid phone number";
      if (!form.email.trim()) e.email = "Please enter your email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    }
    return e;
  };

  const scrollToWizard = () => {
    if (wizardRef.current && typeof window !== "undefined") {
      const top = wizardRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
      scrollToWizard();
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
      scrollToWizard();
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await apiPost<Reservation>("/api/reservations", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        date: form.date,
        time: form.time,
        guests: Number(form.guests),
        kids: Number(form.kids || 0),
        special: form.special.trim(),
      });
      setSuccess(res);
      toast.success("Reservation request received ✦");
      scrollToWizard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(null);
    setForm(EMPTY_FORM);
    setStep(0);
    setErrors({});
    setDirection(1);
    scrollToWizard();
  };

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.ambiance[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }}
        />

        {/* Ambient gold orbs */}
        <div className="ambient-orb" style={{ width: 420, height: 420, background: "rgba(212,175,55,0.14)", top: "14%", left: "6%" }} />
        <div className="ambient-orb" style={{ width: 520, height: 520, background: "rgba(212,175,55,0.08)", bottom: "2%", right: "4%", animationDelay: "-5s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Reserve Your Evening</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="Online" as="span" delay={0.2} className="inline-block" />
            <RevealText text="Reservation" as="span" delay={0.45} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            Reserve in moments. Our maître d&apos; will confirm your table personally.
          </motion.p>
        </div>
      </section>

      {/* ============== WIZARD ============== */}
      <section className="relative py-16 sm:py-24">
        {/* Subtle ambient orbs in the section background */}
        <div className="ambient-orb pointer-events-none absolute top-32 left-[-8%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.05)" }} />
        <div className="ambient-orb pointer-events-none absolute bottom-20 right-[-8%]" style={{ width: 380, height: 380, background: "rgba(212,175,55,0.04)", animationDelay: "-4s" }} />

        <div ref={wizardRef} className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {success ? (
              <SuccessScreen key="success" reservation={success} onReset={reset} />
            ) : (
              <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepIndicator step={step} />

                <div className="mt-10 sm:mt-12">
                  <AnimatePresence mode="wait" custom={direction}>
                    {step === 0 && (
                      <motion.div key="step-0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                        <StepDate form={form} errors={errors} update={update} today={today} />
                        <div className="mt-8">
                          <LuxuryButton variant="solid" onClick={next} className="w-full min-h-[52px]">
                            Continue <ArrowRight className="h-4 w-4" />
                          </LuxuryButton>
                        </div>
                      </motion.div>
                    )}

                    {step === 1 && (
                      <motion.div key="step-1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                        <StepTime form={form} errors={errors} update={update} />
                        <div className="mt-8 flex items-center gap-3">
                          <LuxuryButton variant="ghost" onClick={back} className="min-h-[52px]">
                            <ArrowLeft className="h-4 w-4" /> Back
                          </LuxuryButton>
                          <LuxuryButton variant="solid" onClick={next} className="min-h-[52px] flex-1">
                            Continue <ArrowRight className="h-4 w-4" />
                          </LuxuryButton>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step-2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                        <StepGuests form={form} update={update} />
                        <div className="mt-8 flex items-center gap-3">
                          <LuxuryButton variant="ghost" onClick={back} className="min-h-[52px]">
                            <ArrowLeft className="h-4 w-4" /> Back
                          </LuxuryButton>
                          <LuxuryButton variant="solid" onClick={next} className="min-h-[52px] flex-1">
                            Continue <ArrowRight className="h-4 w-4" />
                          </LuxuryButton>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step-3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                        <StepDetails form={form} errors={errors} update={update} />
                        <div className="mt-8 flex items-center gap-3">
                          <LuxuryButton variant="ghost" onClick={back} className="min-h-[52px]">
                            <ArrowLeft className="h-4 w-4" /> Back
                          </LuxuryButton>
                          <LuxuryButton variant="solid" onClick={next} className="min-h-[52px] flex-1">
                            Continue <ArrowRight className="h-4 w-4" />
                          </LuxuryButton>
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div key="step-4" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                        <StepConfirm form={form} update={update} />
                        <div className="mt-8 flex items-center gap-3">
                          <LuxuryButton variant="ghost" onClick={back} className="min-h-[52px]">
                            <ArrowLeft className="h-4 w-4" /> Back
                          </LuxuryButton>
                          <LuxuryButton variant="solid" onClick={submit} disabled={loading} className="min-h-[52px] flex-1">
                            {loading ? "Securing your table…" : <>Confirm Reservation <Sparkles className="h-4 w-4" /></>}
                          </LuxuryButton>
                        </div>
                        <p className="mt-4 text-center font-sans text-[11px] text-muted-foreground/70">
                          Your table is held for 15 minutes past the reservation time.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style>{`
        .r-date-input { color-scheme: dark; }
        .r-date-input::-webkit-calendar-picker-indicator {
          filter: invert(0.8) sepia(1) saturate(3) hue-rotate(5deg) brightness(0.95);
          cursor: pointer;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        .r-date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>
    </div>
  );
}

/* =========================================================
   STEP INDICATOR — numbered circles + filling gold line
   ========================================================= */
function StepIndicator({ step }: { step: number }) {
  const total = STEPS.length;
  return (
    <div className="mx-auto max-w-md">
      <div className="relative flex items-start justify-between">
        {/* Background hairline */}
        <div className="absolute left-0 right-0 top-[18px] h-px bg-white/10 sm:top-[20px]" />
        {/* Gold progress fill */}
        <motion.div
          className="absolute left-0 top-[18px] h-px bg-gold-gradient sm:top-[20px]"
          initial={false}
          animate={{ width: `${(step / (total - 1)) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        {STEPS.map((label, i) => (
          <div key={label} className="relative z-10 flex flex-col items-center">
            <StepDot index={i} current={step} />
            <span
              className={cn(
                "mt-2.5 font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 sm:text-[11px]",
                i === step ? "text-gold" : i < step ? "text-foreground/60" : "text-muted-foreground/50"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDot({ index, current }: { index: number; current: number }) {
  const done = index < current;
  const active = index === current;
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10",
        active && "border-gold bg-gold-gradient text-black glow-gold",
        done && "border-gold bg-gold text-black",
        !active && !done && "border-white/15 bg-background text-muted-foreground"
      )}
    >
      {done ? (
        <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
      ) : (
        <span className="font-[family-name:var(--font-playfair)] text-sm font-semibold sm:text-base">
          {index + 1}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   STEP 1 — DATE
   ========================================================= */
function StepDate({
  form, errors, update, today,
}: {
  form: FormState;
  errors: Record<string, string>;
  update: (key: keyof FormState, value: string) => void;
  today: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">Choose a Date</h2>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">Select the evening you wish to join us.</p>
      </div>
      <div className="pt-2">
        <label className="mb-2 block font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Reservation Date
        </label>
        <PremiumCalendar
          value={form.date}
          onChange={(val) => update("date", val)}
          minDate={today}
          error={errors.date}
        />
        {errors.date && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 font-sans text-xs text-red-400">
            {errors.date}
          </motion.p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STEP 2 — TIME
   ========================================================= */
function StepTime({
  form, errors, update,
}: {
  form: FormState;
  errors: Record<string, string>;
  update: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">Select a Time</h2>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">Open continuously from 11:00 AM to 11:00 PM.</p>
      </div>
      <div className="space-y-5">
        <TimeGroup title="Lunch Service (11:00 AM – 2:30 PM)" times={LUNCH_TIMES} selected={form.time} onSelect={(t) => update("time", t)} />
        <TimeGroup title="Afternoon & Lounge (3:00 PM – 5:30 PM)" times={AFTERNOON_TIMES} selected={form.time} onSelect={(t) => update("time", t)} />
        <TimeGroup title="Dinner Service (6:00 PM – 11:00 PM)" times={DINNER_TIMES} selected={form.time} onSelect={(t) => update("time", t)} />
      </div>
      {errors.time && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-sans text-xs text-red-400">
          {errors.time}
        </motion.p>
      )}
    </div>
  );
}

/* =========================================================
   STEP 3 — GUESTS
   ========================================================= */
function StepGuests({
  form, update,
}: {
  form: FormState;
  update: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">Party Size</h2>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">Select the number of guests and kids joining your table.</p>
      </div>

      <div className="space-y-6">
        {/* ADULTS SECTION */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-4 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold/90 font-semibold">
              Adult Guests
            </span>
          </div>
          <GuestStepper
            value={form.guests}
            min={1}
            max={MAX_GUESTS}
            label="Guest"
            labelPlural="Guests"
            showQuickSelect={true}
            onChange={(v) => update("guests", v)}
          />
        </div>

        {/* KIDS SECTION */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-4 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold/90 font-semibold">
              Kids / Children
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground/60">Ages 12 & under</p>
          </div>
          <GuestStepper
            value={form.kids || "0"}
            min={0}
            max={10}
            label="Kid"
            labelPlural="Kids"
            showQuickSelect={false}
            onChange={(v) => update("kids", v)}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 4 — CUSTOMER DETAILS
   ========================================================= */
function StepDetails({
  form, errors, update,
}: {
  form: FormState;
  errors: Record<string, string>;
  update: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">Your Details</h2>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">So our maître d' can confirm your table.</p>
      </div>
      <PremiumField id="r-name" label="Full Name" icon={User} error={errors.name}>
        <input id="r-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jane Doe" className={inputClass} autoComplete="name" />
      </PremiumField>
      <div className="grid gap-5 sm:grid-cols-2">
        <PremiumField id="r-phone" label="Phone" icon={Phone} error={errors.phone}>
          <input id="r-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 95850 18502" className={inputClass} autoComplete="tel" />
        </PremiumField>
        <PremiumField id="r-email" label="Email" icon={Mail} error={errors.email}>
          <input id="r-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@email.com" className={inputClass} autoComplete="email" />
        </PremiumField>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 5 — CONFIRM (review + special requests)
   ========================================================= */
function StepConfirm({
  form, update,
}: {
  form: FormState;
  update: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">Confirm Your Reservation</h2>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">Review the details and add any special requests.</p>
      </div>
      <SummaryCard form={form} />
      <div>
        <label htmlFor="r-special" className="mb-2 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">
          <Sparkles className="h-3.5 w-3.5" /> Special Requests
        </label>
        <textarea
          id="r-special"
          rows={4}
          value={form.special}
          onChange={(e) => update("special", e.target.value)}
          placeholder="Anniversary celebration, dietary requirements, seating preference…"
          className={cn(inputClass, "h-auto resize-none py-3.5")}
        />
        <p className="mt-2 font-sans text-[11px] text-muted-foreground/70">Optional — share anything that would make your evening more memorable.</p>
      </div>
    </div>
  );
}

function TimeGroup({
  title, times, selected, onSelect,
}: {
  title: string;
  times: string[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 font-[family-name:var(--font-cormorant)] text-sm italic text-muted-foreground">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {times.map((t) => (
          <TimeSlot key={t} value={t} selected={selected === t} onClick={() => onSelect(t)} />
        ))}
      </div>
    </div>
  );
}

function TimeSlot({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[44px] items-center justify-center rounded-xl border font-sans text-sm font-medium tracking-wide transition-all duration-200",
        selected
          ? "border-transparent bg-gold-gradient text-black"
          : "border-white/10 text-muted-foreground hover:border-gold/40 hover:text-gold"
      )}
    >
      {value}
    </button>
  );
}

function GuestStepper({
  value,
  min = 1,
  max = MAX_GUESTS,
  label = "Guest",
  labelPlural = "Guests",
  showQuickSelect = true,
  onChange,
}: {
  value: string;
  min?: number;
  max?: number;
  label?: string;
  labelPlural?: string;
  showQuickSelect?: boolean;
  onChange: (v: string) => void;
}) {
  const n = Math.max(min, Math.min(max, Number(value) || 0));
  const set = (v: number) => onChange(String(Math.max(min, Math.min(max, v))));
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-6 sm:gap-10">
        <button
          type="button"
          onClick={() => set(n - 1)}
          disabled={n <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-foreground transition-all duration-200 hover:border-gold/50 hover:text-gold disabled:pointer-events-none disabled:opacity-30 sm:h-14 sm:w-14"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex min-w-[88px] flex-col items-center">
          <span className="font-[family-name:var(--font-playfair)] text-5xl font-semibold text-gold-gradient sm:text-6xl">
            {n}
          </span>
          <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {n === 1 ? label : labelPlural}
          </span>
        </div>
        <button
          type="button"
          onClick={() => set(n + 1)}
          disabled={n >= max}
          aria-label={`Increase ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-foreground transition-all duration-200 hover:border-gold/50 hover:text-gold disabled:pointer-events-none disabled:opacity-30 sm:h-14 sm:w-14"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Quick-select pills */}
      {showQuickSelect && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {GUEST_OPTIONS.map((g) => {
            const sel = g === "8+" ? n >= 8 : String(n) === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChange(g === "8+" ? "8" : g)}
                className={cn(
                  "flex h-9 min-w-[38px] items-center justify-center rounded-full border px-3 font-sans text-xs font-medium transition-all duration-200",
                  sel
                    ? "border-transparent bg-gold-gradient text-black"
                    : "border-white/10 text-muted-foreground hover:border-gold/40 hover:text-gold"
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ form }: { form: FormState }) {
  const kidsCount = Number(form.kids || 0);
  const partyValue = `${form.guests} ${Number(form.guests) === 1 ? "Adult" : "Adults"}${kidsCount > 0 ? `, ${kidsCount} ${kidsCount === 1 ? "Kid" : "Kids"}` : ""}`;

  const rows = [
    { label: "Name", value: form.name || "—" },
    { label: "Phone", value: form.phone || "—" },
    { label: "Email", value: form.email || "—" },
    { label: "Date", value: form.date ? formatDate(form.date) : "—" },
    { label: "Time", value: form.time || "—" },
    { label: "Party", value: partyValue },
  ];
  return (
    <div className="glass-gold-cinema rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">Your Reservation</span>
        <span className="h-px flex-1 bg-gold/20" />
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {r.label}
            </div>
            <div className="mt-1.5 break-words font-[family-name:var(--font-playfair)] text-lg text-foreground sm:text-xl">
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   SUCCESS SCREEN — animated gold check + confirmation
   ========================================================= */
function SuccessScreen({
  reservation, onReset,
}: {
  reservation: ReservationWithNotif;
  onReset: () => void;
}) {
  const firstName = reservation.name.split(" ")[0] || reservation.name;
  const ticketRef = `BO-RES-${reservation.id.slice(-8).toUpperCase()}`;
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      n: reservation.name,
      d: reservation.date,
      t: reservation.time,
      g: String(reservation.guests),
      k: String(reservation.kids || 0),
    }).toString();
    const verifyUrl = `${origin}/verify/${reservation.id}?${params}`;
    QRCode.toString(verifyUrl, { type: "svg", margin: 1, color: { dark: "#D4AF37", light: "#0A0A0C" } })
      .then(setQrSvg)
      .catch(() => { });
  }, [reservation]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-gold-cinema rounded-3xl p-6 text-center sm:p-10 max-w-lg mx-auto"
    >
      {/* Animated gold check — SVG pathLength draw-in */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center">
        <motion.svg viewBox="0 0 80 80" className="h-20 w-20" initial="hidden" animate="visible">
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="2.5"
            variants={{
              hidden: { pathLength: 0 },
              visible: { pathLength: 1, transition: { duration: 0.9, ease: "easeInOut" } },
            }}
          />
          <motion.path
            d="M24 41 L35 53 L57 29"
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
              hidden: { pathLength: 0 },
              visible: { pathLength: 1, transition: { duration: 0.5, delay: 0.7, ease: "easeInOut" } },
            }}
          />
          <defs>
            <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f0d878" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#b8902a" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">
        Table Confirmed
      </motion.h2>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mx-auto mt-2 max-w-md font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground sm:text-xl">
        Thank you, {firstName}. We look forward to hosting you at Black Orchid.
      </motion.p>

      {/* LUXURY DIGITAL RESERVATION PASS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="group relative mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-b from-[#14120E] via-[#0A0A0C] to-[#0A0A0C] p-6 text-left shadow-2xl shadow-gold/10 backdrop-blur-md print:bg-black print:text-black">
        {/* Pass Header */}
        <div className="flex items-center justify-between border-b border-gold/20 pb-4">
          <div>
            <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold/80">Digital Guest Pass</span>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">Black Orchid</h3>
          </div>
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-xs font-semibold text-gold">
            {ticketRef}
          </span>
        </div>

        {/* QR Code Center Section */}
        <div className="my-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-sm">
          {qrSvg ? (
            <div className="h-36 w-36 overflow-hidden rounded-lg border border-gold/30 p-2 bg-[#0A0A0C]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center text-gold"><QrCode className="h-16 w-16 animate-pulse" /></div>
          )}
          <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Scan at Host Stand upon arrival
          </span>
        </div>

        {/* Pass Details */}
        <div className="space-y-2 border-t border-gold/20 pt-4 text-sm">
          <Row label="Guest" value={reservation.name} />
          <Row label="Date" value={formatDate(reservation.date)} />
          <Row label="Time" value={reservation.time} />
          <Row
            label="Party Size"
            value={`${reservation.guests} ${reservation.guests === 1 ? "Adult" : "Adults"}${reservation.kids && reservation.kids > 0 ? `, ${reservation.kids} ${reservation.kids === 1 ? "Kid" : "Kids"}` : ""}`}
          />
          <Row label="Email" value={reservation.email} />
        </div>

        {/* Truthful SMS Notification Badge */}
        <div className="mt-4 print:hidden">
          {reservation.notificationStatus?.sms === "SENT" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-sans text-xs text-emerald-400">
              <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Confirmation details have been sent to your phone.</span>
            </div>
          ) : reservation.notificationStatus?.sms === "DISABLED" ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-xs text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Your reservation has been received. SMS confirmation is currently unavailable.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-sans text-xs text-amber-300">
              <Phone className="h-4 w-4 shrink-0 text-amber-300" />
              <span>Your reservation has been received. We were unable to send the SMS confirmation.</span>
            </div>
          )}
        </div>

        {/* Pass Action Controls */}
        <div className="mt-6 flex justify-center print:hidden">
          <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/20">
            <Printer className="h-4 w-4" /> Print / Save Pass
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-8 flex justify-center print:hidden">
        <LuxuryButton variant="outline" onClick={onReset} className="min-h-[52px]">
          Make Another Reservation
        </LuxuryButton>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   SHARED PRIMITIVES
   ========================================================= */
function PremiumField({
  id, label, icon: Icon, error, children,
}: {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80"
      >
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 font-sans text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <span className="break-all text-right font-[family-name:var(--font-cormorant)] text-base text-foreground sm:text-lg">
        {value}
      </span>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}
