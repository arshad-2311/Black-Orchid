"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform, useInView,
} from "framer-motion";
import { ArrowRight, Star, Quote, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import type { MenuItem, GalleryImage, Testimonial, SiteSettings, MenuCategory, EventItem } from "@/lib/types";
import { Eyebrow, LuxuryButton, TextLink, OrnamentDivider, SpiceLevel, VegBadge } from "./primitives";
import { RevealText, Parallax, ImageReveal, RevealGroup, RevealItem } from "./motion";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";

export function Home({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
    apiGet<GalleryImage[]>("/api/gallery").then(setGallery).catch(() => {});
    apiGet<Testimonial[]>("/api/testimonials?featured=1").then(setTestimonials).catch(() => {});
  }, []);

  const featuredItems = useMemo(
    () => categories.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 4),
    [categories]
  );

  return (
    <div className="overflow-hidden">
      <Hero settings={settings} />
      <Manifesto />
      <Story settings={settings} />
      <SignatureDishes items={featuredItems} categories={categories} onViewMenu={() => setView("menu")} />
      <Philosophy />
      <BanquetCinema settings={settings} onBook={() => setView("banquet")} />
      <GalleryPreview images={gallery} onViewAll={() => setView("gallery")} />
      <TestimonialCinema testimonials={testimonials} />
      <ReservationCinema settings={settings} onReserve={() => setView("reservation")} />
    </div>
  );
}

/* ============== HERO — cinematic video + word reveal + ambient light ============== */
function Hero({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const poster = IMAGES.hero[0];

  return (
    <section ref={ref} className="relative flex h-[100svh] min-h-[100svh] w-screen items-center justify-center overflow-hidden cinematic-grain">
      {/* Video background */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <video
          className="h-full w-full object-cover object-center"
          autoPlay muted loop playsInline preload="auto" poster={poster}
          disablePictureInPicture controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          aria-hidden tabIndex={-1}
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Ambient floating gold orbs */}
      <div className="ambient-orb" style={{ width: 400, height: 400, background: "rgba(212,175,55,0.18)", top: "15%", left: "5%" }} />
      <div className="ambient-orb" style={{ width: 500, height: 500, background: "rgba(212,175,55,0.10)", bottom: "10%", right: "5%", animationDelay: "-5s" }} />

      {/* Overlays */}
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.8) 100%)" }} />

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
          <Eyebrow className="justify-center">{settings?.tagline || "Fine Dining & Banquet"}</Eyebrow>
        </motion.div>

        <RevealText
          text={settings?.heroTitle || "An Exquisite Symphony of Flavour"}
          as="h1"
          stagger={0.08}
          delay={1.8}
          className="mt-8 font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.02] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-7xl lg:text-[5.5rem]"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 1 }}
          className="mx-auto mt-8 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
        >
          {settings?.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.9 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <LuxuryButton onClick={() => setView("reservation")} className="min-h-[52px]">
            Reserve a Table <ArrowRight className="h-4 w-4" />
          </LuxuryButton>
          <LuxuryButton variant="outline" onClick={() => setView("menu")} className="min-h-[52px]">
            Explore Menu
          </LuxuryButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ============== MANIFESTO — single bold statement, scroll reveal ============== */
function Manifesto() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const words = "We do not serve meals. We compose evenings — each one a fleeting masterpiece, plated to be remembered long after the last bite.";
  const wordArr = words.split(" ");

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center bg-background px-6 py-32">
      <div className="mx-auto max-w-5xl text-center">
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }} className="mb-10 font-sans text-[11px] uppercase tracking-[0.4em] text-gold/70">
          The Philosophy
        </motion.p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium leading-[1.3] tracking-luxe text-foreground sm:text-5xl lg:text-6xl">
          {wordArr.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.12 }}
              animate={inView ? { opacity: 1 } : { opacity: 0.12 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={cn("inline-block", (w === "compose" || w === "evenings" || w === "masterpiece") && "text-gold-gradient italic")}
            >
              {w}&nbsp;
            </motion.span>
          ))}
        </h2>
      </div>
    </section>
  );
}

/* ============== STORY — asymmetric parallax image + editorial text ============== */
function Story({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  return (
    <section className="relative bg-background py-32 sm:py-40">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-24">
        {/* Image — parallax, offset column */}
        <div className="lg:col-span-5 lg:col-start-1">
          <Parallax speed={0.15}>
            <ImageReveal src={IMAGES.interior[0]} alt="Black Orchid interior" rounded="rounded-[2rem]" className="aspect-[4/5]" />
          </Parallax>
          {/* Floating stat card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass-gold-cinema relative z-10 -mt-16 ml-auto w-max rounded-2xl px-8 py-6 text-center lg:-mr-8"
          >
            <p className="font-[family-name:var(--font-playfair)] text-5xl font-semibold text-gold-gradient">20+</p>
            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Years of Legacy</p>
          </motion.div>
        </div>

        {/* Text — offset column */}
        <div className="lg:col-span-6 lg:col-start-7">
          <Eyebrow className="mb-7">{settings?.aboutTitle || "Our Story"}</Eyebrow>
          <RevealText
            text="A Sanctuary of Culinary Art"
            as="h2"
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl"
          />
          <OrnamentDivider className="my-8 !justify-start" />
          <RevealGroup className="space-y-5">
            <RevealItem>
              <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                {settings?.aboutBody}
              </p>
            </RevealItem>
            <RevealItem>
              <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                Every plate tells a story. Every visit, a chapter. We do not merely serve meals — we compose experiences, each a fleeting masterpiece.
              </p>
            </RevealItem>
          </RevealGroup>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-10">
            <TextLink onClick={() => setView("about")}>Read Our Story</TextLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============== SIGNATURE DISHES — staggered editorial cards ============== */
function SignatureDishes({
  items, categories, onViewMenu,
}: { items: MenuItem[]; categories: MenuCategory[]; onViewMenu: () => void }) {
  const display = items.length > 0 ? items : categories.flatMap((c) => c.items).slice(0, 4);
  return (
    <section className="relative bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow className="mb-6">Signature Selections</Eyebrow>
            <RevealText text="Compositions by the Chef" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl" />
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}>
            <TextLink onClick={onViewMenu}>View Full Menu</TextLink>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((item, i) => (
            <DishCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DishCard({ item, index }: { item: MenuItem; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {item.image && (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        {/* Price floating */}
        <motion.div
          animate={{ y: hover ? 0 : 8, opacity: hover ? 1 : 0.9 }}
          className="glass-gold-cinema absolute right-4 top-4 rounded-full px-3.5 py-1.5"
        >
          <span className="font-[family-name:var(--font-playfair)] text-base font-semibold text-gold">${item.price}</span>
        </motion.div>
        {/* Badges */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <VegBadge veg={item.veg} />
          <SpiceLevel level={item.spice} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80">{item.categoryId}</p>
        <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{item.name}</h3>
        <motion.p
          initial={false}
          animate={{ height: hover ? "auto" : 0, opacity: hover ? 1 : 0, marginTop: hover ? 8 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground"
        >
          {item.description}
        </motion.p>
      </div>
    </motion.article>
  );
}

/* ============== PHILOSOPHY — numbered editorial ============== */
function Philosophy() {
  const pillars = [
    { n: "01", title: "Sourced with Devotion", desc: "From trusted farms and distant markets, at the peak of season." },
    { n: "02", title: "Crafted by Masters", desc: "A brigade of chefs with Michelin-graded pedigree and relentless craft." },
    { n: "03", title: "Served as Theatre", desc: "Every plate arrives with quiet ceremony — a moment composed for you." },
    { n: "04", title: "Remembered Forever", desc: "An evening designed to linger in memory, long after the last pour." },
  ];
  return (
    <section className="relative overflow-hidden bg-[#080808] py-32 sm:py-40">
      <div className="ambient-orb" style={{ width: 500, height: 500, background: "rgba(212,175,55,0.06)", top: "30%", right: "-10%" }} />
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="max-w-2xl">
          <Eyebrow className="mb-6">The Difference</Eyebrow>
          <RevealText text="Four pillars of an evening" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl" />
        </div>
        <div className="mt-20 grid gap-px overflow-hidden rounded-[2rem] border border-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="group relative bg-card p-10 transition-colors duration-500 hover:bg-[#181818]"
            >
              <span className="font-[family-name:var(--font-playfair)] text-6xl font-bold text-white/[0.08] transition-colors duration-500 group-hover:text-gold/30">{p.n}</span>
              <h3 className="mt-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{p.title}</h3>
              <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic leading-snug text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== BANQUET CINEMA — full-width parallax banner ============== */
function BanquetCinema({ settings, onBook }: { settings: SiteSettings | null; onBook: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.15]);

  return (
    <section ref={ref} className="relative flex h-[100vh] min-h-[600px] items-center overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={IMAGES.banquet[1]} alt="Banquet hall" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="max-w-xl">
          <Eyebrow className="mb-6">Banquet Facility</Eyebrow>
          <RevealText
            text="Celebrations worthy of legend"
            as="h2"
            className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.02] tracking-luxe text-foreground sm:text-7xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-7 max-w-lg font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-muted-foreground sm:text-2xl"
          >
            {settings?.banquetDesc}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-8"
          >
            <div><p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/70">Capacity</p><p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-foreground">{settings?.banquetCapacity}</p></div>
            <div className="h-10 w-px bg-white/15" />
            <div><p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold/70">Amenities</p><p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-foreground">Valet · Stage · DJ</p></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10"
          >
            <LuxuryButton onClick={onBook}>Book the Banquet <ArrowRight className="h-4 w-4" /></LuxuryButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============== GALLERY PREVIEW — masonry with reveals ============== */
function GalleryPreview({ images, onViewAll }: { images: GalleryImage[]; onViewAll: () => void }) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const preview = images.slice(0, 6);
  return (
    <section className="bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow className="mb-6">In Frame</Eyebrow>
            <RevealText text="A glimpse of Black Orchid" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl" />
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}>
            <TextLink onClick={onViewAll}>View Full Gallery</TextLink>
          </motion.div>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {preview.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (i % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setLbIndex(i)}
              className={cn("group relative overflow-hidden rounded-2xl", i === 0 || i === 5 ? "sm:row-span-2" : "")}
              style={{ aspectRatio: i === 0 || i === 5 ? "3/4" : "1/1" }}
            >
              <img src={img.url} alt={img.title} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-5 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{img.title}</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">{img.category}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      {lbIndex !== null && preview[lbIndex] && (
        <Lightbox images={preview} index={lbIndex} onClose={() => setLbIndex(null)} onNav={(d) => setLbIndex((p) => (p === null ? p : (p + d + preview.length) % preview.length))} />
      )}
    </section>
  );
}

/* ============== TESTIMONIAL CINEMA — single dramatic quote ============== */
function TestimonialCinema({ testimonials }: { testimonials: Testimonial[] }) {
  const [idx, setIdx] = useState(0);
  const list = testimonials;
  useEffect(() => {
    if (!list.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 7000);
    return () => clearInterval(t);
  }, [list.length]);
  if (!list.length) return null;
  const t = list[idx];

  return (
    <section className="relative overflow-hidden bg-[#080808] py-32 sm:py-44">
      <div className="ambient-orb" style={{ width: 450, height: 450, background: "rgba(212,175,55,0.08)", top: "20%", left: "30%" }} />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Quote className="mx-auto h-12 w-12 text-gold/30" />
        <div className="mt-8 min-h-[280px] sm:min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.figure key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
              <div className="flex justify-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
              </div>
              <blockquote className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-playfair)] text-2xl font-medium italic leading-[1.4] text-foreground sm:text-4xl sm:leading-[1.35]">
                “{t.message}”
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3">
                {t.photo && <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/40" />}
                <div className="text-left">
                  <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{t.name}</p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex justify-center gap-2">
          {list.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={cn("h-1.5 rounded-full transition-all duration-500", i === idx ? "w-10 bg-gold" : "w-1.5 bg-white/20")} aria-label={`Testimonial ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== RESERVATION CTA — immersive floating ============== */
function ReservationCinema({ settings, onReserve }: { settings: SiteSettings | null; onReserve: () => void }) {
  return (
    <section className="relative overflow-hidden bg-background py-32 sm:py-44">
      <div className="ambient-orb" style={{ width: 400, height: 400, background: "rgba(212,175,55,0.12)", top: "10%", left: "20%" }} />
      <div className="ambient-orb" style={{ width: 500, height: 500, background: "rgba(212,175,55,0.08)", bottom: "0%", right: "10%", animationDelay: "-6s" }} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <Eyebrow className="justify-center mb-7">Reserve Your Evening</Eyebrow>
        <RevealText
          text="An unforgettable experience awaits"
          as="h2"
          className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.02] tracking-luxe text-foreground sm:text-7xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-7 max-w-lg font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground sm:text-2xl"
        >
          Let us craft an evening that lingers in memory. Reserve in moments — confirm in elegance.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-12"
        >
          <LuxuryButton onClick={onReserve} className="min-h-[56px] text-sm">
            Reserve a Table <ArrowRight className="h-4 w-4" />
          </LuxuryButton>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground"
        >
          {settings?.phone} · {settings?.address}
        </motion.p>
      </div>
    </section>
  );
}
