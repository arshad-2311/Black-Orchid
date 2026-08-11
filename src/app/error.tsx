"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { LuxuryButton } from "@/components/site/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled App Router rendering error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      {/* Ambient background blur */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-gold/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-lg">
        {/* Warning Icon Badge */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold shadow-lg shadow-gold/5">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Heading */}
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-foreground font-semibold">
          An Unexpected Moment Has Occurred
        </h2>

        {/* Subtitle */}
        <p className="mt-3 font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
          We encountered an issue rendering this section. Our team has been notified.
        </p>

        {/* Error digest hint if present */}
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/60">
            Reference ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <LuxuryButton
            onClick={() => reset()}
            variant="solid"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </LuxuryButton>

          <a
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-gold/50 hover:text-gold"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
