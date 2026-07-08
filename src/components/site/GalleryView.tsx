"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiGet } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import { Eyebrow, OrnamentDivider } from "./primitives";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Food", "Drinks", "Interior", "Events", "Banquet"];

export function GalleryView() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [cat, setCat] = useState("All");
  const [visible, setVisible] = useState(12);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  useEffect(() => {
    apiGet<GalleryImage[]>("/api/gallery").then(setImages).catch(() => {});
  }, []);

  const filtered = useMemo(
    () => (cat === "All" ? images : images.filter((i) => i.category === cat)),
    [images, cat]
  );
  const shown = filtered.slice(0, visible);

  // masonry columns
  const cols: GalleryImage[][] = [[], [], []];
  shown.forEach((img, i) => cols[i % 3].push(img));

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src="https://sfile.chatglm.cn/images-ppt/77293b7a9ebc.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Visual Diary</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            The <span className="text-gold-gradient">Gallery</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            Moments suspended in light — food, ambience, and celebration.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex justify-start gap-2 overflow-x-auto pb-4 sm:justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setVisible(12); }}
              className={cn(
                "whitespace-nowrap rounded-full px-5 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-all",
                cat === c ? "bg-gold-gradient text-black" : "border border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-gold"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-4">
                {col.map((img) => {
                  const realIndex = filtered.findIndex((f) => f.id === img.id);
                  return (
                    <motion.button
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ duration: 0.5 }}
                      onClick={() => setLbIndex(realIndex)}
                      className="group relative overflow-hidden rounded-xl"
                    >
                      <img src={img.url} alt={img.title} loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ aspectRatio: ci % 2 === 0 ? "3/4" : "4/5" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 translate-y-3 p-4 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{img.title}</p>
                        <p className="font-sans text-[10px] uppercase tracking-wider text-gold">{img.category}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setVisible((v) => v + 9)}
                className="rounded-full border border-gold/40 px-8 py-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/10"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>

      {lbIndex !== null && filtered[lbIndex] && (
        <Lightbox
          images={filtered}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onNav={(d) => setLbIndex((p) => (p === null ? p : (p + d + filtered.length) % filtered.length))}
        />
      )}
    </div>
  );
}
