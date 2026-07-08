"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export type LightboxImage = { url: string; title?: string; caption?: string | null };

export function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNav]);

  const img = images[index];
  if (!img) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 backdrop-blur-xl"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNav(-1); }}
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10 sm:left-8"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNav(1); }}
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10 sm:right-8"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <motion.figure
          key={index}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-h-[85vh] max-w-5xl px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={img.url}
            alt={img.title || ""}
            className="mx-auto max-h-[78vh] w-auto rounded-lg object-contain shadow-2xl"
          />
          {(img.title || img.caption) && (
            <figcaption className="mt-4 text-center">
              {img.title && (
                <p className="font-[family-name:var(--font-playfair)] text-2xl text-foreground">{img.title}</p>
              )}
              {img.caption && (
                <p className="mt-1 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
                  {img.caption}
                </p>
              )}
            </figcaption>
          )}
        </motion.figure>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {index + 1} / {images.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
