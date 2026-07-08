"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Star, Quote, Sparkles, Crown, ChefHat,
  Leaf, Wine, CalendarHeart, MapPin, Instagram as IgIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import type { MenuItem, GalleryImage, Testimonial, SiteSettings, MenuCategory, EventItem } from "@/lib/types";
import { Eyebrow, OrnamentDivider, GoldButton, SectionHeading, SpiceLevel, VegBadge } from "./primitives";
import { Lightbox } from "./Lightbox";

export function Home({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
    apiGet<GalleryImage[]>("/api/gallery").then(setGallery).catch(() => {});
    apiGet<Testimonial[]>("/api/testimonials?featured=1").then(setTestimonials).catch(() => {});
    apiGet<EventItem[]>("/api/events").then(setEvents).catch(() => {});
  }, []);

  const featuredItems = useMemo(
    () => categories.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 6),
    [categories]
  );

  return (
    <div>
      <Hero settings={settings} />
      <Marquee />
      <AboutPreview settings={settings} />
      <FeaturedMenu items={featuredItems} categories={categories} onViewMenu={() => setView("menu")} />
      <WhyChooseUs />
      <BanquetBanner settings={settings} onBook={() => setView("banquet")} />
      <GalleryPreview images={gallery} onViewAll={() => setView("gallery")} />
      <Testimonials testimonials={testimonials} />
      <GoogleReviews />
      <InstagramFeed />
      <EventsPreview events={events} />
      <ReservationCTA settings={settings} onReserve={() => setView("reservation")} />
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const poster = IMAGES.hero[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Respect prefers-reduced-motion: show poster only, do not autoplay video.
  // Initialize synchronously from the media query to avoid a flash, then track changes.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Lazy-attempt autoplay once the video element mounts (only if motion allowed)
  useEffect(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => { v.play().catch(() => {}); };
    if (v.readyState >= 2) tryPlay();
    v.addEventListener("loadeddata", tryPlay, { once: true });
    v.addEventListener("canplay", () => setVideoReady(true), { once: true });
    return () => { v.removeEventListener("loadeddata", tryPlay); };
  }, [reducedMotion]);

  // Staggered content animation variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.16, delayChildren: 0.25 } },
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="relative flex h-[100svh] min-h-[100svh] w-screen items-center justify-center overflow-hidden">
      {/* Background video (covers entire viewport, centered focal point) */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          aria-hidden="true"
          tabIndex={-1}
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      )}

      {/* Poster fallback shown when reduced-motion is on, or before video is ready */}
      {(reducedMotion || !videoReady) && (
        <div className="absolute inset-0">
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center"
          />
          {!reducedMotion && (
            <div className="absolute inset-0 shimmer opacity-20" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Dark gradient overlay for readability (~60% darkening) */}
      <div className="absolute inset-0 bg-background/60" />
      {/* Top & bottom fade for nav/scroll legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/30 to-background" />
      {/* Vignette around the edges */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, oklch(0.16 0.008 264 / 0.75) 100%)" }}
      />

      {/* Centered content with staggered fade-up animations */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div variants={item}>
          <Eyebrow className="mb-6">{settings?.tagline || "Fine Dining & Banquet"}</Eyebrow>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.05] text-foreground drop-shadow-[0_4px_24px_oklch(0.16_0.008_264/0.7)] sm:text-7xl lg:text-8xl"
        >
          <span className="text-gold-gradient">{settings?.heroTitle || "An Exquisite Symphony of Flavour"}</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-7 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/90 drop-shadow-[0_2px_12px_oklch(0.16_0.008_264/0.6)] sm:text-2xl"
        >
          {settings?.heroSubtitle}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <GoldButton onClick={() => setView("reservation")} className="min-h-[44px]">
            Reserve a Table <ArrowRight className="h-4 w-4" />
          </GoldButton>
          <GoldButton variant="outline" onClick={() => setView("menu")} className="min-h-[44px]">
            Explore Menu
          </GoldButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ---------------- MARQUEE ---------------- */
function Marquee() {
  const words = ["Exquisite Cuisine", "Opulent Ambience", "Master Chefs", "Private Events", "Cocktail Artistry", "Banquet Royalty"];
  const row = [...words, ...words];
  return (
    <div className="border-y border-gold/10 bg-card/30 py-5">
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {row.map((w, i) => (
            <span key={i} className="mx-8 flex items-center gap-8 font-[family-name:var(--font-cormorant)] text-2xl italic text-muted-foreground">
              {w} <Sparkles className="h-4 w-4 text-gold/70" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ABOUT PREVIEW ---------------- */
function AboutPreview({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-2xl">
            <img src={IMAGES.interior[0]} alt="Restaurant interior" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          {/* Floating stat */}
          <div className="glass-gold absolute -bottom-6 -right-4 rounded-2xl px-6 py-4 text-center sm:-right-6">
            <p className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-gold">20+</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Years of Legacy</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <Eyebrow className="mb-5">{settings?.aboutTitle || "Our Story"}</Eyebrow>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            A Sanctuary of <span className="text-gold-gradient">Culinary Art</span>
          </h2>
          <OrnamentDivider className="mt-6 !justify-start" />
          <p className="mt-6 font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground">
            {settings?.aboutBody}
          </p>
          <div className="mt-8 flex items-center gap-6">
            <GoldButton variant="outline" onClick={() => setView("about")}>
              Read More <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="font-sans text-sm text-muted-foreground">4.9 / 5 · 1,200+ reviews</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- FEATURED MENU ---------------- */
function FeaturedMenu({
  items, categories, onViewMenu,
}: { items: MenuItem[]; categories: MenuCategory[]; onViewMenu: () => void }) {
  const display = items.length > 0 ? items : categories.flatMap((c) => c.items).slice(0, 6);
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Signature Selections"
          title={<>Chef's <span className="text-gold-gradient">Featured</span> Creations</>}
          subtitle="A curated tasting of our most beloved compositions, plated to perfection."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((item, i) => (
            <FeaturedCard key={item.id} item={item} index={i} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <GoldButton onClick={onViewMenu}>
            Explore Full Menu <ArrowRight className="h-4 w-4" />
          </GoldButton>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ item, index }: { item: MenuItem; index: number }) {
  const [hover, setHover] = useState(false);
  const cat = item.categoryId;
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden rounded-2xl border border-gold/10 bg-card/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-card to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-background/70 px-3 py-1 font-sans text-[10px] uppercase tracking-wider text-gold backdrop-blur">
            {cat}
          </span>
          {item.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 font-sans text-[10px] uppercase tracking-wider text-black">
              <Crown className="h-3 w-3" /> Signature
            </span>
          )}
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <VegBadge veg={item.veg} />
          <SpiceLevel level={item.spice} />
        </div>
      </div>
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">{item.name}</h3>
          <span className="shrink-0 font-[family-name:var(--font-playfair)] text-xl text-gold">${item.price}</span>
        </div>
        <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic leading-snug text-muted-foreground">
          {item.description}
        </p>
        <motion.div
          animate={{ width: hover ? "100%" : "0%" }}
          transition={{ duration: 0.5 }}
          className="mt-4 h-px bg-gold-gradient"
        />
      </div>
    </motion.article>
  );
}

/* ---------------- WHY CHOOSE US ---------------- */
function WhyChooseUs() {
  const features = [
    { Icon: Crown, title: "Premium Dining", desc: "An award-winning destination where every detail is sculpted for the discerning palate." },
    { Icon: Leaf, title: "Fresh Ingredients", desc: "Sourced at dawn from trusted farms and the finest markets across the globe." },
    { Icon: ChefHat, title: "Experienced Chefs", desc: "A brigade of master chefs with Michelin-graded pedigree and relentless craft." },
    { Icon: Sparkles, title: "Luxury Ambience", desc: "Crystal chandeliers, velvet booths, and a soundtrack curated for the senses." },
    { Icon: CalendarHeart, title: "Private Events", desc: "Bespoke celebrations orchestrated by a dedicated events concierge." },
    { Icon: Wine, title: "Curated Cellar", desc: "A 600-label wine cellar and a cocktail program worthy of legend." },
  ];
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 opacity-20">
        <img src={IMAGES.ambiance[0]} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-background/80" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Black Orchid Difference"
          title={<>Why <span className="text-gold-gradient">Connoisseurs</span> Choose Us</>}
          subtitle="Six pillars that define an experience beyond dining."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-gold/10 bg-card/50 p-7 transition-all duration-500 hover:border-gold/40 hover:bg-card"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 text-gold transition-transform duration-500 group-hover:scale-110 group-hover:border-gold">
                <f.Icon className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{f.title}</h3>
              <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg leading-snug text-muted-foreground">{f.desc}</p>
              <span className="pointer-events-none absolute -right-4 -top-4 font-[family-name:var(--font-playfair)] text-7xl font-bold text-gold/5">
                {String(i + 1).padStart(2, "0")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BANQUET BANNER ---------------- */
function BanquetBanner({ settings, onBook }: { settings: SiteSettings | null; onBook: () => void }) {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={IMAGES.banquet[1]} alt="Banquet hall" className="h-[60vh] min-h-[420px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-xl px-8 sm:px-14"
            >
              <Eyebrow className="mb-5">Banquet Facility</Eyebrow>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
                Celebrations Worthy of <span className="text-gold-gradient">Legend</span>
              </h2>
              <p className="mt-5 font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
                {settings?.banquetDesc}
              </p>
              <div className="mt-6 flex flex-wrap gap-6">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">Capacity</p>
                  <p className="font-[family-name:var(--font-playfair)] text-2xl text-foreground">{settings?.banquetCapacity}</p>
                </div>
                <div className="h-12 w-px bg-gold/20" />
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">Amenities</p>
                  <p className="font-[family-name:var(--font-playfair)] text-2xl text-foreground">Valet · Stage · DJ</p>
                </div>
              </div>
              <div className="mt-8">
                <GoldButton onClick={onBook}>
                  Book the Banquet <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- GALLERY PREVIEW ---------------- */
function GalleryPreview({ images, onViewAll }: { images: GalleryImage[]; onViewAll: () => void }) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const preview = images.slice(0, 8);
  // masonry-ish columns
  const cols: GalleryImage[][] = [[], [], [], []];
  preview.forEach((img, i) => cols[i % 4].push(img));

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Moments in Frame"
          title={<>A Glimpse of <span className="text-gold-gradient">Black Orchid</span></>}
          subtitle="From plated artistry to grand halls — step inside our world."
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-4">
              {col.map((img, i) => {
                const realIndex = ci + i * 4;
                return (
                  <motion.button
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    onClick={() => setLbIndex(realIndex)}
                    className="group relative overflow-hidden rounded-xl"
                  >
                    <img src={img.url} alt={img.title} className="w-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ aspectRatio: ci % 2 === 0 ? "3/4" : "1/1" }} />
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
        <div className="mt-12 text-center">
          <GoldButton variant="outline" onClick={onViewAll}>
            View Full Gallery <ArrowRight className="h-4 w-4" />
          </GoldButton>
        </div>
      </div>
      {lbIndex !== null && preview[lbIndex] && (
        <Lightbox
          images={preview}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onNav={(d) => setLbIndex((p) => (p === null ? p : (p + d + preview.length) % preview.length))}
        />
      )}
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [idx, setIdx] = useState(0);
  const list = testimonials.length ? testimonials : [];
  useEffect(() => {
    if (!list.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  if (!list.length) return null;
  const t = list[idx];

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 opacity-10">
        <img src={IMAGES.interior[2]} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Kind Words" title={<>Voices of Our <span className="text-gold-gradient">Patrons</span></>} />
        <div className="relative mt-14 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Quote className="mx-auto h-10 w-10 text-gold/40" />
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="mx-auto mt-5 max-w-2xl font-[family-name:var(--font-cormorant)] text-2xl italic leading-relaxed text-foreground sm:text-3xl">
                “{t.message}”
              </blockquote>
              <figcaption className="mt-7 flex items-center justify-center gap-3">
                {t.photo && (
                  <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/40" />
                )}
                <div className="text-left">
                  <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{t.name}</p>
                  <p className="font-sans text-xs uppercase tracking-wider text-gold/80">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold hover:bg-gold/10" aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {list.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-gold" : "w-2 bg-foreground/30"}`} aria-label={`Testimonial ${i + 1}`} />
            ))}
          </div>
          <button onClick={() => setIdx((i) => (i + 1) % list.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold hover:bg-gold/10" aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- GOOGLE REVIEWS ---------------- */
function GoogleReviews() {
  const reviews = [
    { name: "Alexandra R.", rating: 5, text: "The tasting menu was a journey. Each course more stunning than the last. Black Orchid has set a new standard.", time: "2 weeks ago" },
    { name: "Jonathan P.", rating: 5, text: "Service was impeccable and the wagyu melted like butter. The ambience transports you.", time: "1 month ago" },
    { name: "Mira S.", rating: 4, text: "Beautiful evening for our anniversary. The sommelier's pairing was inspired.", time: "1 month ago" },
  ];
  return (
    <section className="border-y border-gold/10 bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="text-center lg:text-left">
            <Eyebrow className="mb-3">Google Reviews</Eyebrow>
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <span className="font-[family-name:var(--font-playfair)] text-6xl font-semibold text-gold-gradient">4.9</span>
              <div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="mt-1 font-sans text-sm text-muted-foreground">Based on 1,284 Google reviews</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:max-w-3xl">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-gold/10 bg-background/60 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="font-sans text-[10px] text-muted-foreground">{r.time}</span>
                </div>
                <p className="mt-3 font-[family-name:var(--font-cormorant)] text-base italic leading-snug text-muted-foreground">“{r.text}”</p>
                <p className="mt-3 font-sans text-sm font-medium text-foreground">{r.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- INSTAGRAM FEED ---------------- */
function InstagramFeed() {
  const feed = [...IMAGES.food.slice(0, 3), ...IMAGES.drinks.slice(0, 2), IMAGES.dessert[0], IMAGES.interior[5]];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="@blackorchid"
          title={<>Follow Our <span className="text-gold-gradient">Instagram</span></>}
          subtitle="A daily dose of plated artistry and behind-the-scenes magic."
        />
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {feed.map((url, i) => (
            <motion.a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              <img src={url} alt="Instagram post" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                <IgIcon className="h-7 w-7 text-gold" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- EVENTS PREVIEW ---------------- */
function EventsPreview({ events }: { events: EventItem[] }) {
  if (!events.length) return null;
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Upcoming" title={<>Signature <span className="text-gold-gradient">Events</span></>} />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 3).map((e, i) => (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-gold/10 bg-card/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {e.image && (
                  <img src={e.image} alt={e.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute right-4 top-4 rounded-lg bg-gold px-3 py-1.5 text-center">
                  <p className="font-[family-name:var(--font-playfair)] text-lg font-bold leading-none text-black">{new Date(e.date).getDate()}</p>
                  <p className="font-sans text-[9px] uppercase tracking-wider text-black/70">{new Date(e.date).toLocaleString("en", { month: "short" })}</p>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">{e.title}</h3>
                <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground line-clamp-2">{e.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- RESERVATION CTA ---------------- */
function ReservationCTA({ settings, onReserve }: { settings: SiteSettings | null; onReserve: () => void }) {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="glass-gold relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
          <Eyebrow className="mb-5">Reserve Your Evening</Eyebrow>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            An Unforgettable Experience <br className="hidden sm:block" />
            <span className="text-gold-gradient">Awaits Your Table</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            Let us craft an evening that lingers in memory. Reserve in moments — confirm in elegance.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
            <GoldButton onClick={onReserve}>
              Reserve a Table <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <a href={`tel:${settings?.phone}`} className="flex items-center gap-2 font-sans text-sm text-muted-foreground transition-colors hover:text-gold">
              <MapPin className="h-4 w-4 text-gold" /> {settings?.phone}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
