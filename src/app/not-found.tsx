"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Lock, ArrowLeft } from "lucide-react";
import { OrnamentDivider, Eyebrow } from "@/components/site/primitives";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect common admin URL typos to the real /admin route
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
    // Catch "/admin", "/admi", "/admin/...", "/admin-panel", etc. — anything that looks like an admin attempt
    if (/^\/admi(n|n-.*)?$/.test(path) || path.includes("admin") || path === "/admi") {
      if (path !== "/admin") router.replace("/admin");
    }
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <Eyebrow className="mb-5">Error 404</Eyebrow>

        <h1 className="font-[family-name:var(--font-playfair)] text-7xl font-semibold leading-none sm:text-9xl">
          <span className="text-gold-gradient">404</span>
        </h1>

        <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">
          This Page Could Not Be Found
        </h2>

        <OrnamentDivider className="my-6" />

        <p className="mx-auto max-w-md font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
          The page you seek has drifted from our menu. Let us guide you back to an evening worth savouring.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => router.push("/")}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gold-gradient px-7 py-3 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-black transition-transform hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" /> Return Home
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gold/50 px-7 py-3 font-sans text-sm font-medium uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10"
          >
            <Lock className="h-4 w-4" /> Admin Panel
          </button>
        </motion.div>

        <button
          onClick={() => router.back()}
          className="mt-8 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </motion.div>
    </div>
  );
}
