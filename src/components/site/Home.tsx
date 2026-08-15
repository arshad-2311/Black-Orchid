"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform,
} from "framer-motion";
import { ArrowRight, Star, Quote, UtensilsCrossed, Music, Users, Award } from "lucide-react";
import { useApp } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { IMAGES } from "@/lib/images";
import type { MenuItem, GalleryImage, Testimonial, SiteSettings, MenuCategory } from "@/lib/types";
import { Eyebrow, LuxuryButton, TextLink, OrnamentDivider, SpiceLevel, VegBadge } from "./primitives";
import { RevealText, Parallax, ImageReveal, RevealGroup, RevealItem } from "./motion";
import { Lightbox } from "./Lightbox";
import { CircularGallery } from "./CircularGallery";
import { useFadeUp, useFadeScale, useParallax } from "./gsap-utils";
import { cn } from "@/lib/utils";

export function Home({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  useEffect(() => {
    apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => { });
    apiGet<GalleryImage[]>("/api/gallery").then(setGallery).catch(() => { });
  }, []);

  const featuredItems = useMemo(
    () => categories.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 4),
    [categories]
  );

  return (
    <div className="overflow-hidden">
      <Hero settings={settings} />
      <SignatureDishes items={featuredItems} categories={categories} onViewMenu={() => setView("menu")} />
      <Story settings={settings} onReserve={() => setView("reservation")} />
      <ExperienceScrollStack onReserve={() => setView("reservation")} onViewMenu={() => setView("menu")} onBook={() => setView("banquet")} />
      <GalleryPreview images={gallery} onViewAll={() => setView("gallery")} />
      <BanquetCinema settings={settings} onBook={() => setView("banquet")} />
      <CircularGallerySection gallery={gallery} />
      <LiveGoogleReviews />
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ambientColor, setAmbientColor] = useState<string>("rgba(212, 175, 55, 0.22)");

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;

    const sampleFrame = (time: number) => {
      // Throttle sampling to ~15 FPS (every ~66ms) for ultra-low overhead (< 0.5% CPU)
      if (time - lastTime > 66 && video.readyState >= 2) {
        lastTime = time;
        try {
          ctx.drawImage(video, 0, 0, 16, 16);
          const data = ctx.getImageData(0, 0, 16, 16).data;
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          const count = data.length / 4;
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          // Boost warmth & gold luminance slightly for luxury ambience
          setAmbientColor(`rgba(${Math.min(255, r + 25)}, ${Math.min(255, g + 20)}, ${b}, 0.28)`);
        } catch {
          /* noop */
        }
      }
      animId = requestAnimationFrame(sampleFrame);
    };

    animId = requestAnimationFrame(sampleFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section ref={ref} className="relative flex h-[100svh] min-h-[100svh] w-full items-center justify-center overflow-hidden cinematic-grain">
      {/* Hidden 16x16 canvas for video color sampling */}
      <canvas ref={canvasRef} width={16} height={16} className="hidden" aria-hidden />

      {/* Video background */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover object-center"
          autoPlay muted loop playsInline preload="auto" poster={poster}
          disablePictureInPicture controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          aria-hidden tabIndex={-1}
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Real-time Video Ambilight Spill Overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-700 ease-out"
        style={{ background: `radial-gradient(circle at 50% 45%, ${ambientColor} 0%, transparent 65%)` }}
      />

      {/* Ambient floating gold orbs */}
      <div className="ambient-orb" style={{ width: 400, height: 400, background: "rgba(212,175,55,0.18)", top: "15%", left: "5%" }} />
      <div className="ambient-orb" style={{ width: 500, height: 500, background: "rgba(212,175,55,0.10)", bottom: "10%", right: "5%", animationDelay: "-5s" }} />

      {/* Overlays */}
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.8) 100%)" }} />

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <Eyebrow className="justify-center">
            {settings?.tagline || "Fine Dining & Banquet"} — ANNA NAGAR, CHENNAI
          </Eyebrow>
        </motion.div>

        <RevealText
          text={settings?.heroTitle || "An Exquisite Symphony of Flavour"}
          as="h1"
          stagger={0.04}
          delay={0.3}
          className="mt-5 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground drop-shadow-[0_4px_30px_rgba(10,10,10,0.6)] sm:text-6xl lg:text-[5.5rem]"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-foreground/85 drop-shadow-[0_2px_16px_rgba(10,10,10,0.6)] sm:text-2xl"
        >
          {settings?.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <LuxuryButton onClick={() => setView("reservation")} className="min-h-[52px] text-sm" cursorLabel="Reserve">
            Reserve a Table <ArrowRight className="h-4 w-4" />
          </LuxuryButton>
          <LuxuryButton variant="outline" onClick={() => setView("menu")} className="min-h-[52px] text-sm" cursorLabel="Menu">
            Explore Menu
          </LuxuryButton>
        </motion.div>

        {/* Trust indicators — answer "why choose us" instantly */}
        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-foreground/75"
          aria-label="Trust indicators"
        >
          <li className="flex items-center gap-1.5 text-sm">
            <span className="flex items-center gap-0.5 text-gold" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold" />)}
            </span>
            <span className="font-sans text-xs tracking-wide">4.8 Google Rating</span>
          </li>
          <li className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
          <li className="flex items-center gap-1.5 font-sans text-xs tracking-wide"><Award className="h-3.5 w-3.5 text-gold" aria-hidden /> Premium Fine Dining</li>
          <li className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
          <li className="flex items-center gap-1.5 font-sans text-xs tracking-wide"><Users className="h-3.5 w-3.5 text-gold" aria-hidden /> Banquet Facility</li>
        </motion.ul>
      </motion.div>
    </section>
  );
}

/* ============== STORY — asymmetric parallax image + editorial text ============== */
function Story({ settings, onReserve }: { settings: SiteSettings | null; onReserve: () => void }) {
  const { setView } = useApp();
  return (
    <section className="relative bg-background py-32 sm:py-40">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-24">
        {/* Image — parallax, offset column */}
        <div className="lg:col-span-5 lg:col-start-1">
          <Parallax speed={0.15}>
            <ImageReveal src={IMAGES.interior[0]} alt="Black Orchid restaurant interior with warm lighting" rounded="rounded-[2rem]" className="aspect-[4/5]" />
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
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-6xl"
          />
          <OrnamentDivider className="my-8 !justify-start" />
          <RevealGroup className="max-w-[700px] space-y-5">
            <RevealItem>
              <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-foreground/80 sm:text-2xl">
                {settings?.aboutBody}
              </p>
            </RevealItem>
            <RevealItem>
              <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-foreground/80 sm:text-2xl">
                Every plate tells a story. Every visit, a chapter. We do not merely serve meals — we compose experiences, each a fleeting masterpiece.
              </p>
            </RevealItem>
          </RevealGroup>
          {/* Dual CTA — clear next steps */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-10 flex flex-wrap items-center gap-5">
            <LuxuryButton onClick={onReserve} className="min-h-[48px] text-sm">Reserve a Table <ArrowRight className="h-4 w-4" /></LuxuryButton>
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
  const headerRef = useFadeUp<HTMLDivElement>({ duration: 0.7 });
  const gridRef = useFadeScale<HTMLDivElement>({ stagger: 0.15, duration: 0.8 });

  return (
    <section className="relative bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div ref={headerRef} className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow className="mb-6">Signature Selections</Eyebrow>
            <RevealText text="Compositions by the Chef" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-6xl" />
          </div>
          <div className="hidden md:block">
            <TextLink onClick={onViewMenu}>View Full Menu</TextLink>
          </div>
        </div>

        <div ref={gridRef} className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((item, i) => (
            <DishCard key={item.id} item={item} index={i} onViewMenu={onViewMenu} />
          ))}
        </div>

        {/* CTA — clear next step */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-14 flex justify-center">
          <LuxuryButton onClick={onViewMenu} className="min-h-[48px] text-sm">View Full Menu <ArrowRight className="h-4 w-4" /></LuxuryButton>
        </motion.div>
      </div>
    </section>
  );
}

function DishCard({ item, index, onViewMenu }: { item: MenuItem; index: number; onViewMenu: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onViewMenu}
      aria-label={`${item.name} — $${item.price}. ${item.veg ? "Vegetarian" : "Non-vegetarian"}. View in menu.`}
      data-cursor-label="View"
      className="glow-border-hover group relative w-full overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card text-left"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {item.image && (
          <img src={item.image} alt={`${item.name} — ${item.shortDescription || item.description}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
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
          className="overflow-hidden font-[family-name:var(--font-cormorant)] text-lg italic text-foreground/70"
        >
          {item.shortDescription || item.description}
        </motion.p>
      </div>
    </motion.button>
  );
}

/* ============== EXPERIENCE SECTION — GSAP fade-up storytelling (no pinning) ============== */
function ExperienceScrollStack({
  onReserve, onViewMenu, onBook,
}: { onReserve: () => void; onViewMenu: () => void; onBook: () => void }) {
  const headerRef = useFadeUp<HTMLDivElement>({ duration: 0.7 });
  const gridRef = useFadeScale<HTMLDivElement>({ stagger: 0.15, duration: 0.8 });

  const cards = [
    {
      image: IMAGES.food[0],
      alt: "Signature dish plated with precision",
      eyebrow: "Signature Dishes",
      title: "Composed to Perfection",
      description: "Each dish is a study in restraint and luxury — sourced at dawn, plated with devotion, served as theatre.",
      cta: { label: "Explore Menu", onClick: onViewMenu },
    },
    {
      image: IMAGES.interior[0],
      alt: "Luxury restaurant interior with warm lighting",
      eyebrow: "Restaurant Experience",
      title: "An Evening, Composed",
      description: "Crystal chandeliers, velvet booths, and a soundtrack curated for the senses. Every visit is a chapter.",
      cta: { label: "Reserve a Table", onClick: onReserve },
    },
    {
      image: IMAGES.banquet[1],
      alt: "Grand banquet hall set for celebration",
      eyebrow: "Banquet Experience",
      title: "Celebrations of Distinction",
      description: "A grand hall, a dedicated team, and a menu sculpted for your milestone. Weddings, galas, and legends.",
      cta: { label: "Book the Banquet", onClick: onBook },
    },
    {
      image: IMAGES.interior[3],
      alt: "Intimate private dining room",
      eyebrow: "Private Dining",
      title: "Reserved for the Few",
      description: "An intimate room for the discerning few. Bespoke menus, discreet service, and an evening yours alone.",
      cta: { label: "Reserve a Table", onClick: onReserve },
    },
  ];

  return (
    <section className="relative bg-[#080808] py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div ref={headerRef} className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-6 justify-center">The Experience</Eyebrow>
          <RevealText text="A journey through the evening" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-6xl" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            The moments that make Black Orchid unforgettable.
          </p>
        </div>

        <div ref={gridRef} className="mt-16 grid gap-6 sm:grid-cols-2">
          {cards.map((card, i) => (
            <ExperienceCard key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ card, index }: { card: any; index: number }) {
  return (
    <div className="glow-border-hover group relative overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={card.image} alt={card.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <span className="absolute left-5 top-5 font-[family-name:var(--font-playfair)] text-5xl font-bold text-white/[0.08]">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="p-7">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/80">{card.eyebrow}</span>
        <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">{card.title}</h3>
        <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg italic leading-relaxed text-muted-foreground">{card.description}</p>
        {card.cta && (
          <button onClick={card.cta.onClick} className="mt-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-foreground">
            {card.cta.label} <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============== CIRCULAR GALLERY — premium infinite horizontal carousel ============== */
function CircularGallerySection({ gallery }: { gallery: GalleryImage[] }) {
  // Use up to 8 images from the gallery for the carousel
  const carouselImages = gallery.slice(0, 8).map((img) => ({
    url: img.url,
    title: img.title,
    label: img.category,
  }));
  if (carouselImages.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="ambient-orb" style={{ width: 400, height: 400, background: "rgba(212,175,55,0.06)", top: "20%", left: "-5%" }} />
      <div className="mx-auto mb-10 max-w-7xl px-6 text-center sm:px-10">
        <Eyebrow className="mb-5 justify-center">In Motion</Eyebrow>
        <RevealText text="A cinematic gallery" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.1] tracking-luxe text-foreground sm:text-6xl" />
        <p className="mx-auto mt-4 max-w-lg font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">
          Drag, scroll, or use arrow keys to explore.
        </p>
      </div>
      <CircularGallery images={carouselImages} />
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
        <img src={IMAGES.banquet[1]} alt="Grand banquet hall with elegant table settings and warm lighting" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
  const headerRef = useFadeUp<HTMLDivElement>({ duration: 0.7 });
  const gridRef = useFadeScale<HTMLDivElement>({ stagger: 0.1, duration: 0.7 });

  return (
    <section className="bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div ref={headerRef} className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow className="mb-6">In Frame</Eyebrow>
            <RevealText text="A glimpse of Black Orchid" as="h2" className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-6xl" />
          </div>
          <div>
            <TextLink onClick={onViewAll}>View Full Gallery</TextLink>
          </div>
        </div>
        <div ref={gridRef} className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {preview.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLbIndex(i)}
              className={cn("group relative overflow-hidden rounded-2xl", i === 0 || i === 5 ? "sm:row-span-2" : "")}
              style={{ aspectRatio: i === 0 || i === 5 ? "3/4" : "1/1" }}
            >
              <img src={img.url} alt={`${img.title} — ${img.category}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-5 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">{img.title}</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">{img.category}</p>
              </div>
            </button>
          ))}
        </div>

        {/* CTA — clear next step */}
        <div className="mt-14 flex justify-center">
          <LuxuryButton variant="outline" onClick={onViewAll} className="min-h-[48px] text-sm">View Full Gallery <ArrowRight className="h-4 w-4" /></LuxuryButton>
        </div>
      </div>
      {lbIndex !== null && preview[lbIndex] && (
        <Lightbox images={preview} index={lbIndex} onClose={() => setLbIndex(null)} onNav={(d) => setLbIndex((p) => (p === null ? p : (p + d + preview.length) % preview.length))} />
      )}
    </section>
  );
}

/* ============== LIVE GOOGLE REVIEWS (Jotform Widget) ============== */
function LiveGoogleReviews() {
  const [iframeHeight, setIframeHeight] = useState(520);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object" && e.data.type === "jf-widget-resize") {
        if (e.data.height && Number(e.data.height) > 100) {
          setIframeHeight(Math.max(400, Number(e.data.height)));
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const embedHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 8px;
        background: transparent;
        color: #f4efe5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        overflow-x: hidden;
      }
    </style>
  </head>
  <body>
    <div id="JFWebsiteWidget-01a003efac50700080c40ef2fdeed59c2026"></div>
    <script src="https://www.jotform.com/website-widgets/embed/01a003efac50700080c40ef2fdeed59c2026"></script>
    <script>
      const ro = new ResizeObserver(() => {
        const h = document.body.scrollHeight;
        if (h > 80) {
          window.parent.postMessage({ type: 'jf-widget-resize', height: h + 24 }, '*');
        }
      });
      ro.observe(document.body);
    </script>
  </body>
</html>`;

  return (
    <section className="relative border-y border-white/[0.06] bg-[#080808] py-20 sm:py-28 overflow-hidden">
      <div className="ambient-orb" style={{ width: 450, height: 450, background: "rgba(212,175,55,0.06)", top: "15%", left: "25%" }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Eyebrow className="mb-4 justify-center">Google Reviews</Eyebrow>
          <RevealText
            text="Guest Experiences"
            as="h2"
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.05] tracking-luxe text-foreground sm:text-5xl"
          />
          <p className="mt-3 font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            Live reviews and ratings from our guests at Black Orchid, Anna Nagar.
          </p>
        </div>

        {/* Live Jotform Google Reviews Widget */}
        <div className="w-full overflow-hidden rounded-2xl">
          <iframe
            srcDoc={embedHtml}
            title="Google Reviews - Black Orchid"
            className="w-full border-0 transition-all duration-300"
            style={{ minHeight: `${iframeHeight}px`, height: `${iframeHeight}px` }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </section>
  );
}

/* ============== RESERVATION CTA — immersive floating ============== */
function ReservationCinema({ settings, onReserve }: { settings: SiteSettings | null; onReserve: () => void }) {
  const contentRef = useFadeUp<HTMLDivElement>({ duration: 0.8 });

  return (
    <section className="relative overflow-hidden bg-background py-32 sm:py-44">
      <div className="ambient-orb" style={{ width: 400, height: 400, background: "rgba(212,175,55,0.12)", top: "10%", left: "20%" }} />
      <div className="ambient-orb" style={{ width: 500, height: 500, background: "rgba(212,175,55,0.08)", bottom: "0%", right: "10%", animationDelay: "-6s" }} />
      <div ref={contentRef} className="relative z-10 mx-auto max-w-3xl px-6 text-center">
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
          className="mx-auto mt-7 max-w-[600px] font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-foreground/80 sm:text-2xl"
        >
          Let us craft an evening that lingers in memory. Reserve in moments — confirm in elegance.
        </motion.p>
        {/* Dual CTA — Reserve + Call Now for conversion clarity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <LuxuryButton onClick={onReserve} className="glow-border min-h-[52px] rounded-full text-sm">
            Reserve a Table <ArrowRight className="h-4 w-4" />
          </LuxuryButton>
          <a
            href={`tel:${settings?.phone}`}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-gold/40 px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold/8 hover:border-gold/70"
          >
            Call Now
          </a>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 font-sans text-xs uppercase tracking-[0.25em] text-foreground/60"
        >
          {settings?.phone} · {settings?.address}
        </motion.p>
      </div>
    </section>
  );
}
