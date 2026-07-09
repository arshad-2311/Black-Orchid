"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, Maximize2, Star, Flame, Leaf, Award,
  Check, AlertTriangle, Plus, Minus,
} from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LuxuryButton } from "./primitives";

/* =========================================================
   DISH SHOWCASE — premium full-screen dish detail modal
   - Split layout: image left (with zoom + gallery + fullscreen), details right
   - Staggered text reveal, prev/next dish nav, related dishes
   - Mobile adaptive: image top, details below, sticky price bar
   ========================================================= */
export function DishShowcase({
  dishes, index, onClose, onNav, onSelect, onReserve,
}: {
  dishes: MenuItem[]; index: number; onClose: () => void; onNav: (dir: -1 | 1) => void; onSelect?: (i: number) => void; onReserve?: () => void;
}) {
  const dish = dishes[index];

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  if (!dish) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[90] flex items-stretch justify-center bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        {/* Close + nav controls (outside the panel so they don't clip) */}
        <button
          onClick={onClose}
          className="fixed right-4 top-4 z-[95] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold sm:right-6 sm:top-6"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNav(-1); }}
          className="fixed left-2 top-1/2 z-[95] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold lg:flex"
          aria-label="Previous dish"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNav(1); }}
          className="fixed right-2 top-1/2 z-[95] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold lg:flex"
          aria-label="Next dish"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* The panel — scales in */}
        <motion.div
          key={dish.id}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative my-0 h-full w-full overflow-y-auto bg-[#0a0a0a] sm:my-4 sm:h-auto sm:max-h-[94vh] sm:rounded-3xl lg:my-8 lg:max-h-[90vh] lg:border lg:border-white/[0.08]"
        >
          <div className="grid lg:grid-cols-2">
            {/* IMAGE SIDE — keyed by dish.id so internal state resets when navigating dishes */}
            <DishImageGallery key={dish.id} dish={dish} />

            {/* DETAILS SIDE */}
            <DishDetails dish={dish} dishes={dishes} index={index} onNav={onNav} onSelect={onSelect} onReserve={onReserve} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   IMAGE GALLERY — main image with zoom + thumbnails + fullscreen
   ========================================================= */
function DishImageGallery({ dish }: { dish: MenuItem }) {
  const images = dish.images && dish.images.length > 0 ? dish.images : (dish.image ? [dish.image] : []);
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  // (active/zoom reset automatically via the `key={dish.id}` prop on this component)

  // Touch swipe for mobile
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) setActive((a) => (a + (dx < 0 ? 1 : -1) + images.length) % images.length);
    touchStartX.current = null;
  };

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!zoom) return;
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [zoom]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-card lg:aspect-auto lg:min-h-[80vh]">
        <span className="font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="relative bg-black lg:sticky lg:top-0 lg:h-[90vh]">
      {/* Main image with zoom */}
      <div
        ref={imgWrapRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative aspect-square overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:h-full"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={dish.name}
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: zoom ? 1.8 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.5 }, scale: { duration: zoom ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] } }}
            style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Subtle vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {/* Top-left badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <PillVeg veg={dish.veg} />
          {dish.chefRecommended && (
            <span className="flex items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-black shadow-lg">
              <Award className="h-3 w-3" /> Chef's Pick
            </span>
          )}
          {!dish.available && (
            <span className="rounded-full bg-red-500/90 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">Sold Out</span>
          )}
        </div>

        {/* Top-right controls */}
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={() => setZoom((z) => !z)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold"
            aria-label="Toggle zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-all hover:border-gold/60 hover:text-gold"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile swipe hint arrows (desktop uses outer arrows) */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 lg:hidden">
          {images.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-8 bg-gold" : "w-1.5 bg-white/40")} aria-label={`Image ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn("h-16 w-16 overflow-hidden rounded-lg border-2 transition-all", i === active ? "border-gold opacity-100" : "border-white/20 opacity-60 hover:opacity-100")}
            >
              <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
            onClick={() => setFullscreen(false)}
          >
            <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white hover:text-gold" aria-label="Close fullscreen">
              <X className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setFullscreen(false); }} className="hidden" aria-hidden />
            <motion.img
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[active]}
              alt={dish.name}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }} className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white hover:text-gold" aria-label="Previous image"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }} className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white hover:text-gold" aria-label="Next image"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   DETAILS SIDE — staggered text reveal + metadata + related
   ========================================================= */
function DishDetails({
  dish, dishes, index, onNav, onSelect, onReserve,
}: { dish: MenuItem; dishes: MenuItem[]; index: number; onNav: (dir: -1 | 1) => void; onSelect?: (i: number) => void; onReserve?: () => void }) {
  // Related: same category, exclude self, take 4
  const related = dishes.filter((d) => d.categoryId === dish.categoryId && d.id !== dish.id).slice(0, 4);
  // If fewer than 4 in same category, fill from others
  const fill = related.length < 4 ? dishes.filter((d) => d.id !== dish.id && !related.includes(d)).slice(0, 4 - related.length) : [];
  const relatedFinal = [...related, ...fill];

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <div className="flex flex-col overflow-y-auto px-6 py-8 sm:px-10 sm:py-12 lg:max-h-[90vh]">
      <motion.div variants={stagger} initial="hidden" animate="show" key={dish.id} className="flex-1">
        {/* Category eyebrow */}
        <motion.p variants={item} className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/80">
          {dish.categoryId}
        </motion.p>

        {/* Name */}
        <motion.h2 variants={item} className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
          {dish.name}
        </motion.h2>

        {/* Tagline */}
        {dish.tagline && (
          <motion.p variants={item} className="mt-3 font-[family-name:var(--font-cormorant)] text-xl italic text-gold sm:text-2xl">
            {dish.tagline}
          </motion.p>
        )}

        {/* Badges row */}
        <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-2.5">
          <PillVeg veg={dish.veg} />
          {dish.spice > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-orange-400">
              <Flame className="h-3 w-3" /> {["", "Mild", "Medium", "Hot"][dish.spice]}
            </span>
          )}
          {dish.chefRecommended && (
            <span className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-gold">
              <Award className="h-3 w-3" /> Chef's Recommendation
            </span>
          )}
          {dish.featured && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-foreground/70">
              <Star className="h-3 w-3 fill-gold text-gold" /> Signature
            </span>
          )}
          {!dish.available && (
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-red-400">Currently Unavailable</span>
          )}
        </motion.div>

        {/* Hairline */}
        <motion.div variants={item} className="my-7 h-px w-full bg-gradient-to-r from-gold/40 via-white/10 to-transparent" />

        {/* Description */}
        <motion.p variants={item} className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-foreground/85 sm:text-2xl">
          {dish.description}
        </motion.p>

        {/* Ingredients */}
        {dish.ingredients.length > 0 && (
          <motion.div variants={item} className="mt-8">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">Ingredients</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {dish.ingredients.map((ing, i) => (
                <span key={i} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-sans text-xs text-foreground/80">{ing}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Allergens */}
        {dish.allergens.length > 0 && (
          <motion.div variants={item} className="mt-6">
            <h3 className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-red-400/80">
              <AlertTriangle className="h-3 w-3" /> Allergens
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {dish.allergens.map((a, i) => (
                <span key={i} className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 font-sans text-xs text-red-400/90">{a}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Serving size */}
        {dish.servingSize && (
          <motion.div variants={item} className="mt-6 flex items-center gap-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Serving</span>
            <span className="font-[family-name:var(--font-cormorant)] text-lg italic text-foreground/90">{dish.servingSize}</span>
          </motion.div>
        )}

        {/* Price + reserve (desktop) */}
        <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-7">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Price</span>
            <p className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-gold-gradient">${dish.price}</p>
          </div>
          {onReserve && dish.available && (
            <LuxuryButton onClick={onReserve} className="min-h-[48px]">Reserve to Taste</LuxuryButton>
          )}
        </motion.div>
      </motion.div>

      {/* Prev/Next (mobile + desktop inline) */}
      <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
        <button onClick={() => onNav(-1)} className="group flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold">
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Previous
        </button>
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{index + 1} / {dishes.length}</span>
        <button onClick={() => onNav(1)} className="group flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold">
          Next <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Related dishes */}
      {relatedFinal.length > 0 && (
        <div className="mt-10">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">You may also like</h3>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedFinal.map((r) => {
              const ri = dishes.findIndex((d) => d.id === r.id);
              return <RelatedCard key={r.id} dish={r} onClick={() => { if (ri >= 0) onSelect?.(ri); }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RelatedCard({ dish, onClick }: { dish: MenuItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group overflow-hidden rounded-xl border border-white/[0.06] bg-card text-left transition-all hover:-translate-y-1 hover:border-gold/30">
      <div className="relative aspect-square overflow-hidden">
        {dish.image && <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-foreground leading-tight">{dish.name}</p>
          <p className="mt-0.5 font-sans text-xs text-gold">${dish.price}</p>
        </div>
      </div>
    </button>
  );
}

/* Veg / Non-veg pill */
function PillVeg({ veg }: { veg: boolean }) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider",
      veg ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"
    )}>
      <Leaf className="h-3 w-3" /> {veg ? "Vegetarian" : "Non-Veg"}
    </span>
  );
}
