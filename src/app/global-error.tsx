"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled global root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] text-[#f5f0e8] px-4 py-24 text-center">
        <div className="relative z-10 max-w-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="font-serif text-4xl font-semibold text-[#f5f0e8]">
            Black Orchid
          </h1>

          <p className="mt-4 font-serif text-xl italic text-neutral-400">
            A critical error occurred while initializing the application.
          </p>

          {error.digest && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Reference ID: {error.digest}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f0d878] via-[#d4af37] to-[#b8902a] px-7 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-black transition-all hover:opacity-90 shadow-lg shadow-[#D4AF37]/20"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
