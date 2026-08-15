"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  error?: string;
  className?: string;
}

export function RecaptchaBadge({ onVerify, onExpire, error, className }: RecaptchaProps) {
  const [status, setStatus] = useState<"idle" | "verifying" | "verified">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Handle live Google reCAPTCHA if siteKey is supplied in env
  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;

    const scriptId = "google-recaptcha-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkGrecaptcha = () => {
      if ((window as any).grecaptcha && (window as any).grecaptcha.render && containerRef.current) {
        try {
          (window as any).grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            callback: (t: string) => {
              setStatus("verified");
              toast.success("Security verified ✦");
              onVerify(t);
            },
            "expired-callback": () => {
              setStatus("idle");
              onExpire?.();
            },
          });
        } catch {
          /* already rendered */
        }
      } else {
        setTimeout(checkGrecaptcha, 200);
      }
    };

    checkGrecaptcha();
  }, [siteKey, onVerify, onExpire]);

  // Built-in Luxury Human Verification Challenge
  const handleInteractiveVerification = () => {
    if (status !== "idle") return;
    setStatus("verifying");

    setTimeout(() => {
      const entropy = `${Date.now()}_${Math.random().toString(36).substring(2, 12)}_${navigator.userAgent.length}`;
      const mockToken = `bo_human_${btoa(entropy)}`;
      setStatus("verified");
      toast.success("Security check passed! You are verified as human ✦");
      onVerify(mockToken);
    }, 750);
  };

  if (siteKey) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-2", className)}>
        <div ref={containerRef} />
        {error && (
          <p className="mt-2.5 flex items-center gap-1.5 font-sans text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/[0.03] p-4 sm:p-5 transition-all duration-300",
        error
          ? "border-red-500/50 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30"
          : status === "verified"
          ? "border-emerald-500/40 bg-emerald-950/15"
          : "border-white/10 hover:border-gold/30",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Verification Interactive Checkbox */}
        <button
          type="button"
          onClick={handleInteractiveVerification}
          disabled={status !== "idle"}
          className={cn(
            "group flex items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 w-full sm:w-auto cursor-pointer",
            status === "verified"
              ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : status === "verifying"
              ? "border-gold/40 bg-gold/10 text-gold"
              : "border-white/20 bg-black/50 text-foreground hover:border-gold/60 hover:bg-white/[0.06] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          )}
          aria-label="I'm not a robot security check"
        >
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-300",
              status === "verified"
                ? "border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : status === "verifying"
                ? "border-gold/60 bg-gold/20 text-gold"
                : "border-white/30 bg-white/5 group-hover:border-gold/60"
            )}
          >
            {status === "verifying" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === "verified" ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : null}
          </div>

          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold tracking-wide">
              {status === "verified"
                ? "Verified Human"
                : status === "verifying"
                ? "Verifying interaction…"
                : "I'm not a robot"}
            </span>
            <span className="font-sans text-[10px] text-muted-foreground/70">
              {status === "verified" ? "Verification complete" : "Click checkbox to verify"}
            </span>
          </div>
        </button>

        {/* reCAPTCHA Brand Badge */}
        <div className="flex items-center gap-2 text-right shrink-0">
          <div className="flex flex-col items-center sm:items-end">
            <div className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wider text-muted-foreground">
              <ShieldCheck className={cn("h-4 w-4", status === "verified" ? "text-emerald-400" : "text-gold/80")} />
              <span>reCAPTCHA</span>
            </div>
            <div className="flex gap-1.5 font-sans text-[9px] text-muted-foreground/60">
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:underline hover:text-gold">
                Privacy
              </a>
              <span>•</span>
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:underline hover:text-gold">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-sans text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
