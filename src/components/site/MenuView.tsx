"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { Eyebrow, GoldButton, OrnamentDivider, SpiceLevel, VegBadge } from "./primitives";
import { cn } from "@/lib/utils";

export function MenuView() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [active, setActive] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let items = categories.flatMap((c) => c.items.map((i) => ({ ...i, categoryName: c.name })));
    if (active !== "ALL") items = items.filter((i) => i.categoryId === active);
    if (vegOnly) items = items.filter((i) => i.veg);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return items;
  }, [categories, active, vegOnly, query]);

  return (
    <div className="pt-28">
      {/* Header */}
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src="https://sfile.chatglm.cn/images-ppt/05d707105d1a.jpeg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">À La Carte</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            The <span className="text-gold-gradient">Menu</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            A symphony of flavours, composed by our master chefs and served with quiet theatre.
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-16 z-30 border-y border-gold/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <CategoryPill active={active === "ALL"} onClick={() => setActive("ALL")}>All</CategoryPill>
            {categories.map((c) => (
              <CategoryPill key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
                {c.name}
              </CategoryPill>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes…"
                className="h-10 w-full rounded-full border border-gold/20 bg-card/50 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none sm:w-56"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setVegOnly((v) => !v)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium uppercase tracking-wider transition-colors",
                vegOnly ? "border-green-500/60 bg-green-500/10 text-green-400" : "border-gold/20 text-muted-foreground hover:text-gold"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Veg
            </button>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <p className="py-20 text-center font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground">
              No dishes match your search.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) => (
                  <motion.article
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
                    className="group flex overflow-hidden rounded-2xl border border-gold/10 bg-card/40"
                  >
                    <div className="relative w-28 shrink-0 overflow-hidden sm:w-36">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-card to-secondary" />
                      )}
                      <div className="absolute left-1.5 top-1.5">
                        <VegBadge veg={item.veg} />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-foreground">{item.name}</h3>
                        <span className="shrink-0 font-[family-name:var(--font-playfair)] text-lg text-gold">${item.price}</span>
                      </div>
                      <p className="mt-1.5 flex-1 font-[family-name:var(--font-cormorant)] text-base italic leading-snug text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-sans text-[10px] uppercase tracking-wider text-gold/70">{item.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <SpiceLevel level={item.spice} />
                          {!item.available && <span className="font-sans text-[10px] uppercase tracking-wider text-red-400">Sold out</span>}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-all",
        active ? "bg-gold-gradient text-black" : "border border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}
