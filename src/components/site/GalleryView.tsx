"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import type { GalleryImage } from "@/lib/types";
import { Eyebrow, LuxuryButton, OrnamentDivider } from "./primitives";
import { RevealText } from "./motion";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Food", "Drinks", "Interior", "Events", "Banquet"];

// In-memory module cache for instant 0ms transitions
let cachedGalleryImages: GalleryImage[] | null = null;

export function GalleryView() {
  const [images, setImages] = useState<GalleryImage[]>(() => cachedGalleryImages || []);
  const [loading, setLoading] = useState<boolean>(!cachedGalleryImages || cachedGalleryImages.length === 0);
  const [cat, setCat] = useState("All");
  const [visible, setVisible] = useState(12);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<GalleryImage[]>("/api/gallery")
      .then((data) => {
        if (!alive) return;
        cachedGalleryImages = data;
        setImages(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (cat === "All" ? images : images.filter((i) => i.category === cat)),
    [images, cat]
  );
  const shown = filtered.slice(0, visible);

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.interior[1]} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }}
        />

        {/* Ambient gold orbs */}
        <div className="ambient-orb" style={{ width: 420, height: 420, background: "rgba(212,175,55,0.14)", top: "18%", left: "6%" }} />
        <div className="ambient-orb" style={{ width: 520, height: 520, background: "rgba(212,175,55,0.08)", bottom: "4%", right: "4%", animationDelay: "-5s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Visual Diary</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="The" as="span" delay={0.05} className="inline-block" />
            <RevealText text="Gallery" as="span" delay={0.10} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            Moments suspended in light — food, ambience, and celebration.
          </motion.p>
        </div>
      </section>

      {/* ============== FILTERS — single horizontal editorial rail ============== */}
      <section className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="no-scrollbar flex items-center justify-start sm:justify-center gap-2 overflow-x-auto px-4 py-2 touch-pan-x">
            {CATEGORIES.map((c) => (
              <FilterPill
                key={c}
                active={cat === c}
                onClick={(btnEl) => {
                  setCat(c);
                  setVisible(12);
                  setLbIndex(null);
                  btnEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
              >
                {c}
              </FilterPill>
            ))}
          </div>
        </div>
      </section>

      {/* ============== MASONRY GRID — CSS columns ============== */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && images.length === 0 ? (
            <GallerySkeleton />
          ) : shown.length === 0 ? (
            <p className="py-32 text-center font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground sm:text-3xl">
              No images in this collection yet.
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={cat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="columns-2 gap-4 sm:columns-3 lg:columns-4"
              >
                {shown.map((img, i) => (
                  <motion.button
                    key={img.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: Math.min((i % 4) * 0.04, 0.12), ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setLbIndex(i)}
                    className="group relative mb-4 block w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] break-inside-avoid min-h-[160px]"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      loading={i < 4 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 translate-y-3 p-4 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="font-[family-name:var(--font-playfair)] text-lg leading-tight text-foreground">
                        {img.title}
                      </p>
                      <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-gold">
                        {img.category}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Load more button */}
          {!loading && visible < filtered.length && (
            <div className="mt-14 flex justify-center">
              <LuxuryButton
                variant="outline"
                onClick={() => setVisible((v) => v + 12)}
                className="min-h-[48px] px-8 text-xs uppercase tracking-[0.2em]"
              >
                Load More Moments ({filtered.length - visible} remaining)
              </LuxuryButton>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox modal */}
      {lbIndex !== null && shown[lbIndex] && (
        <Lightbox
          images={shown}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onNav={(dir) =>
            setLbIndex((p) => (p === null ? p : (p + dir + shown.length) % shown.length))
          }
        />
      )}
    </div>
  );
}

/* ============== LUXURY GALLERY SKELETON ============== */
function GallerySkeleton() {
  const heights = [280, 200, 320, 240, 300, 220, 260, 310];
  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 animate-pulse">
      {heights.map((h, i) => (
        <div
          key={i}
          className="mb-4 rounded-2xl border border-white/5 bg-white/[0.03]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: (btnEl: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      className={cn(
        "rounded-full px-5 py-2 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 min-h-[44px]",
        active
          ? "bg-gold text-background shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          : "border border-white/10 text-muted-foreground hover:border-gold/40 hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}
