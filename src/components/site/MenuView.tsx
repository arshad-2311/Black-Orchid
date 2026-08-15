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

// In-memory module cache for instant 0ms navigation between tabs
let cachedMenuCategories: MenuCategory[] | null = null;

export function MenuView() {
  const [categories, setCategories] = useState<MenuCategory[]>(() => cachedMenuCategories || []);
  const [loading, setLoading] = useState<boolean>(!cachedMenuCategories || cachedMenuCategories.length === 0);
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
    let alive = true;
    apiGet<MenuCategory[]>("/api/menu")
      .then((data) => {
        if (!alive) return;
        cachedMenuCategories = data;
        setCategories(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
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
          <img src={IMAGES.food[0]} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
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

      {/* ============== CATEGORY SELECTOR + SEARCH / FILTER BAR ============== */}
      <section className="sticky top-20 z-30 border-y border-white/[0.08] bg-background/90 py-4 backdrop-blur-xl transition-all duration-300 sm:top-24 sm:py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Horizontal scrollable category rail with scroll arrow indicators */}
          <div className="relative mb-4 flex items-center">
            <button
              onClick={() => scrollCategory("left")}
              aria-label="Scroll categories left"
              className="absolute -left-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-background/90 text-gold shadow-lg backdrop-blur-md transition-all hover:bg-gold/10 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={categoryScrollRef}
              className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto px-1 py-1 touch-pan-x"
            >
              {loading && categories.length === 0 ? (
                <>
                  <div className="h-10 w-20 shrink-0 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-10 w-28 shrink-0 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-10 w-32 shrink-0 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-10 w-24 shrink-0 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-10 w-28 shrink-0 rounded-full bg-white/5 animate-pulse" />
                </>
              ) : (
                <>
                  <CategoryPill
                    active={active === "ALL"}
                    onClick={(el) => {
                      setActive("ALL");
                      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                    }}
                    count={categories.reduce((acc, c) => acc + c.items.length, 0)}
                  >
                    All
                  </CategoryPill>
                  {categories.map((c) => (
                    <CategoryPill
                      key={c.id}
                      active={active === c.id}
                      onClick={(el) => {
                        setActive(c.id);
                        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                      }}
                      count={c.items.length}
                    >
                      {c.name}
                    </CategoryPill>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={() => scrollCategory("right")}
              aria-label="Scroll categories right"
              className="absolute -right-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-background/90 text-gold shadow-lg backdrop-blur-md transition-all hover:bg-gold/10 md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Search + Veg toggle row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes…"
                aria-label="Search dishes"
                className="h-11 w-full rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-8 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-gold/50 focus:bg-white/[0.06] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setVegOnly((v) => !v)}
              aria-pressed={vegOnly}
              className={cn(
                "flex h-11 min-h-[44px] items-center gap-2 rounded-full border px-4 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300",
                vegOnly
                  ? "border-emerald-600/60 bg-emerald-950/40 text-emerald-400 shadow-[0_0_12px_rgba(5,150,105,0.15)]"
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
          <AnimatePresence mode="popLayout">
            {loading && categories.length === 0 ? (
              <MenuSkeleton key="loading-skeleton" />
            ) : totalShown === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="py-32 text-center"
              >
                <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground sm:text-3xl">
                  No dishes match your search.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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

/* ============== LUXURY MENU SKELETON LOADER ============== */
function MenuSkeleton() {
  return (
    <div className="space-y-16 animate-pulse">
      {[1, 2].map((g) => (
        <div key={g} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-9 w-48 rounded-xl bg-white/10" />
            <div className="h-px flex-1 bg-white/5" />
            <div className="h-4 w-16 rounded bg-white/5" />
          </div>
          <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-6 first:pt-2 last:pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-white/10" />
                  <div className="space-y-2.5">
                    <div className="h-5 w-48 rounded bg-white/10" />
                    <div className="h-3.5 w-72 rounded bg-white/5" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============== DISH ROW — editorial, clickable to open showcase ============== */
function DishRow({ item, categoryName, index, onOpen }: { item: MenuItem; categoryName: string; index: number; onOpen: () => void }) {
  const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <motion.button
      initial={{ opacity: 0, y: isCoarse ? 8 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isCoarse ? 0.25 : 0.4, delay: isCoarse ? 0 : Math.min(index * 0.02, 0.15), ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="group relative flex w-full flex-col gap-3 py-6 text-left transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-6 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] px-3 sm:px-4 rounded-xl -mx-3 sm:-mx-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-[family-name:var(--font-playfair)] text-xl font-medium tracking-wide text-foreground transition-colors group-hover:text-gold sm:text-2xl">
            {item.name}
          </span>
          <VegBadge veg={item.veg} />
          {item.spice > 0 && <SpiceLevel level={item.spice} />}
          {item.chefRecommended && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-gold">
              <Award className="h-2.5 w-2.5" /> Chef&apos;s Pick
            </span>
          )}
        </div>

        {item.tagline && (
          <p className="mt-1 font-[family-name:var(--font-cormorant)] text-sm italic text-gold/80 sm:text-base">
            {item.tagline}
          </p>
        )}

        <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {item.description}
        </p>

        {/* Pairing note preview if present */}
        {item.winePairing && (
          <p className="mt-2 flex items-center gap-1.5 font-sans text-[11px] text-gold/75">
            <Wine className="h-3 w-3 shrink-0" />
            <span className="truncate">Pairing: {item.winePairing}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-1 shrink-0 pt-1">
        <span className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold italic text-gold-gradient sm:text-3xl">
          {item.price !== null && item.price !== undefined ? `₹${item.price}` : "M.P."}
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-gold/80 transition-colors">
          View details →
        </span>
      </div>
    </motion.button>
  );
}

function CategoryPill({
  children,
  active,
  onClick,
  count,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: (el: HTMLButtonElement | null) => void;
  count?: number;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  return (
    <button
      ref={ref}
      type="button"
      data-active={active}
      onClick={() => onClick(ref.current)}
      className={cn(
        "relative shrink-0 rounded-full px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 min-h-[44px] flex items-center gap-2",
        active
          ? "bg-gold text-background shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          : "border border-white/10 text-muted-foreground hover:border-gold/40 hover:text-gold"
      )}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-normal transition-colors",
            active ? "bg-black/30 text-white" : "bg-white/10 text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
