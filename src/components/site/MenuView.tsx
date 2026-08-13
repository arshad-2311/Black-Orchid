"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Leaf, ChevronRight, ChevronLeft, Award, Wine } from "lucide-react";
import { apiGet } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { Eyebrow, OrnamentDivider, SpiceLevel, VegBadge } from "./primitives";
import { RevealText } from "./motion";
import { DishShowcase } from "./DishShowcase";
import { cn } from "@/lib/utils";

type Group = { category: MenuCategory; items: MenuItem[] };

export function MenuView() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [active, setActive] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState<number | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategory = (dir: "left" | "right") => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll the active category pill into view within the horizontal rail
  useEffect(() => {
    if (!categoryScrollRef.current) return;
    const container = categoryScrollRef.current;
    const activeEl = container.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      const containerRect = container.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      const offset = elRect.left - containerRect.left - containerRect.width / 2 + elRect.width / 2;
      container.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
  }, []);

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const pass = (i: MenuItem) =>
      (!vegOnly || i.veg) &&
      (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));

    if (active === "ALL") {
      return categories
        .map((c) => ({ category: c, items: c.items.filter(pass) }))
        .filter((g) => g.items.length > 0);
    }
    const cat = categories.find((c) => c.id === active);
    if (!cat) return [];
    return [{ category: cat, items: cat.items.filter(pass) }].filter((g) => g.items.length > 0);
  }, [categories, active, vegOnly, query]);

  // Flat list of currently-shown dishes — used for showcase navigation
  const flatDishes = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const totalShown = flatDishes.length;

  return (
    <div>
      {/* ============== CINEMATIC HEADER ============== */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden cinematic-grain">
        <div className="absolute inset-0 -z-10">
          <img src={IMAGES.food[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
            <Eyebrow className="mb-6 justify-center">À La Carte</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-8xl">
            <RevealText text="The" as="span" delay={0.05} className="inline-block" />
            <RevealText text="Menu" as="span" delay={0.10} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
          >
            A symphony of flavours, composed by our master chefs and served with quiet theatre.
          </motion.p>
        </div>
      </section>

      {/* ============== STICKY CONTROLS — horizontal pill rail for all sizes ============== */}
      <section className="sticky top-16 z-30 glass-cinema border-y border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category pills with left/right arrows — works on both mobile and desktop */}
          <div className="flex items-center gap-1.5 py-3 lg:py-4">
            <button
              type="button"
              onClick={() => scrollCategory("left")}
              aria-label="Previous categories"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-card/80 text-foreground transition-all duration-200 hover:border-gold/50 hover:text-gold hover:bg-gold/10 active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={categoryScrollRef}
              className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto scroll-smooth px-1 py-1"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            >
              <CategoryPill active={active === "ALL"} onClick={() => setActive("ALL")}>
                All
              </CategoryPill>
              {categories.map((c) => (
                <CategoryPill key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
                  {c.name}
                </CategoryPill>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategory("right")}
              aria-label="Next categories"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-card/80 text-foreground transition-all duration-200 hover:border-gold/50 hover:text-gold hover:bg-gold/10 active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Search + veg filter row */}
          <div className="flex items-center gap-3 border-t border-white/[0.04] py-3 lg:border-t-0 lg:py-0 lg:pb-4">
            <div className="relative flex-1 lg:w-64 lg:flex-none">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes…"
                className="h-11 w-full rounded-full border border-white/10 bg-card/60 pl-10 pr-9 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-gold/50 focus:outline-none lg:text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-gold"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setVegOnly((v) => !v)}
              aria-pressed={vegOnly}
              className={cn(
                "flex h-11 min-h-[44px] items-center gap-2 rounded-full border px-4 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300",
                vegOnly
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 text-muted-foreground hover:border-gold/40 hover:text-gold"
              )}
            >
              <Leaf className="h-3.5 w-3.5" /> Veg
            </button>
          </div>
        </div>
      </section>

      {/* ============== ITEMS — editorial list, single column ============== */}
      <section className="relative py-16 sm:py-24">
        <div className="ambient-orb pointer-events-none absolute top-40 left-[-10%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.04)" }} />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {totalShown === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="py-32 text-center"
              >
                <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground sm:text-3xl">
                  No dishes match your search.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {(() => {
                  let runningIndex = 0;
                  return groups.map((group, gi) => {
                    const startIdx = runningIndex;
                    runningIndex += group.items.length;
                    return (
                      <div key={group.category.id} className={gi > 0 ? "mt-16" : ""}>
                        {active === "ALL" && (
                          <div className="mb-4 flex items-center gap-5">
                            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-luxe text-gold sm:text-4xl">
                              {group.category.name}
                            </h2>
                            <span className="h-px flex-1 bg-white/[0.06]" />
                            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                              {group.items.length} {group.items.length === 1 ? "dish" : "dishes"}
                            </span>
                          </div>
                        )}
                        <div>
                          {group.items.map((item, i) => (
                            <DishRow
                              key={item.id}
                              item={item}
                              categoryName={group.category.name}
                              index={i}
                              onOpen={() => setShowcaseIndex(startIdx + i)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ============== DISH SHOWCASE MODAL ============== */}
      {showcaseIndex !== null && flatDishes.length > 0 && (
        <DishShowcase
          dishes={flatDishes}
          index={Math.min(showcaseIndex, flatDishes.length - 1)}
          onClose={() => setShowcaseIndex(null)}
          onNav={(dir) => setShowcaseIndex((p) => (p === null ? p : (p + dir + flatDishes.length) % flatDishes.length))}
          onSelect={(i) => setShowcaseIndex(i)}
        />
      )}
    </div>
  );
}

/* ============== DISH ROW — editorial, clickable to open showcase ============== */
function DishRow({ item, categoryName, index, onOpen }: { item: MenuItem; categoryName: string; index: number; onOpen: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.5), ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="group relative flex w-full cursor-pointer gap-4 border-b border-white/[0.06] px-3 py-8 text-left transition-colors duration-300 hover:bg-white/[0.02] sm:gap-6 sm:px-4"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] sm:h-28 sm:w-28">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-card to-secondary" />
        )}
        <div className="absolute left-1.5 top-1.5">
          <VegBadge veg={item.veg} />
        </div>
        {item.chefRecommended && (
          <div className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold-gradient text-black shadow">
            <Award className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-gold sm:text-2xl">
            {item.name}
          </h3>
          {item.featured && (
            <span className="rounded-full border border-gold/40 bg-gold/[0.06] px-2.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
              Signature
            </span>
          )}
          {item.chefRecommended && (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
              Chef's Pick
            </span>
          )}
          {item.winePairing && (
            <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
              <Wine className="h-2.5 w-2.5" /> Wine Pair
            </span>
          )}
          {!item.available && (
            <span className="rounded-full border border-red-500/40 bg-red-500/[0.06] px-2.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Sold out
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-cormorant)] text-base italic leading-snug text-muted-foreground sm:text-lg">
          {item.shortDescription || item.description}
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/60">{categoryName}</span>
          <SpiceLevel level={item.spice} />
        </div>
      </div>

      {/* Price + view hint */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-1 pt-1 sm:items-center sm:flex-row sm:gap-3">
        <span className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gold sm:text-2xl">
          {item.variants && item.variants.length > 0 ? (
            (() => {
              const prices = item.variants.map((v) => v.price).filter((p) => typeof p === "number" && p > 0);
              if (prices.length === 0) return item.price ? `₹${item.price}` : "";
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
            })()
          ) : item.price !== null && item.price !== undefined ? (
            `₹${item.price}`
          ) : (
            ""
          )}
        </span>
        <span className="hidden items-center gap-1 font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
          View <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.button>
  );
}

/* ============== CATEGORY PILL — sliding gold indicator via layoutId ============== */
function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className={cn(
        "relative flex min-h-[44px] items-center whitespace-nowrap rounded-full px-5 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-300",
        active ? "text-black" : "text-muted-foreground hover:text-gold"
      )}
    >
      {active && (
        <motion.span
          layoutId="menu-pill-bg"
          className="absolute inset-0 rounded-full bg-gold-gradient"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
