# Black Orchid Public Site Reinvention — Worklog

This file tracks all agent work for the cinematic public website reinvention.
The admin dashboard is FINALIZED and must NOT be touched.

Each agent MUST read this before starting and append a `---` section after finishing.

---
Task ID: 1+2+3+4
Agent: main
Task: Cinematic foundation + shell + Home page

Work Log:
- Reinvented the public palette in globals.css :root: --background #0A0A0A, --card #131313, --foreground #f5f0e8 (warm white), --muted-foreground #8a8a8a, --gold #D4AF37, --border rgba(255,255,255,0.08). Updated primary/secondary/accent/sidebar tokens to match. Admin tokens untouched.
- Added cinematic utility classes to globals.css (before the admin section):
  - .cinematic-grain::after (SVG fractal noise overlay)
  - .ambient-orb (floating gold blur, keyframes orbFloat)
  - .glass-cinema / .glass-gold-cinema (premium glass)
  - .text-gold-gradient / .bg-gold-gradient (warmer gold gradient #f0d878→#d4af37→#b8902a)
  - .glow-gold / .glow-gold-hover (gold box-shadow)
  - .ripple-container / .ripple (ripple effect)
  - .reveal-mask / .reveal-line (text reveal masks)
  - .img-reveal (clip-path image reveal)
  - .tracking-luxe / .tracking-wide-luxe
  - .hairline-gold
  - custom cursor: .cursor-host / .cursor-dot / .cursor-ring (desktop fine-pointer only)
  - .animate-ken-burns
- Created src/components/site/motion.tsx with reusable cinematic motion helpers: RevealGroup, RevealItem, RevealText (word-by-word masked reveal on scroll), Parallax, ImageReveal (clip-path + scale), ScrollLine, CountUp.
- Rewrote src/components/site/primitives.tsx: Eyebrow (with leading gold line), DisplayHeading, SectionHeading, LuxuryButton (gold gradient + ripple + glow + lift; variants solid/outline/ghost), TextLink (animated underline + arrow), OrnamentDivider, SpiceLevel, VegBadge. NOTE: the old GoldButton export no longer exists — use LuxuryButton. The old SectionHeading API changed slightly (uses DisplayHeading internally; `title` is a string).
- Created src/components/site/Cursor.tsx (custom desktop cursor: gold dot + trailing spring ring, grows on interactive hover; disabled on touch).
- Rewrote src/components/site/Loader.tsx (cinematic curtain lift: ambient orb, "Est. 2003", gold letter-spacing reveal, progress line, exits by sliding up).
- Rewrote src/components/site/Navbar.tsx (transparent → glass-cinema on scroll, minimal wordmark logo, animated underline nav, luxury fullscreen mobile menu with staggered Playfair items + ambient orb).
- Rewrote src/components/site/Chrome.tsx (gold scroll progress bar, premium sticky reserve button with glow).
- Rewrote src/components/site/Footer.tsx (minimal luxury: newsletter band with huge Playfair heading, 4-col grid, animated social icons, bottom bar with Privacy/Terms/Admin links).
- Rewrote src/components/site/Home.tsx as cinematic storytelling: Hero (video bg + parallax scale + ambient orbs + word-by-word headline reveal + staggered CTAs), Manifesto (single bold statement with progressive word reveal, gold italic accent words), Story (asymmetric 12-col grid, parallax image reveal + floating stat card + RevealText heading), SignatureDishes (4 staggered editorial dish cards with hover description reveal + floating price), Philosophy (4 numbered pillars in bordered grid), BanquetCinema (full-viewport parallax banner with scroll-driven y+scale), GalleryPreview (masonry with 2 tall tiles + lightbox), TestimonialCinema (single dramatic Playfair quote carousel), ReservationCinema (immersive floating with ambient orbs).
- Updated src/app/page.tsx to render <Cursor /> at the root.

Stage Summary:
- Foundation + shell + Home are DONE and lint-clean.
- IMPORTANT API notes for downstream agents (the public view files you will rewrite):
  - Design tokens (Tailwind classes): bg-background (#0A0A0A), bg-card (#131313), text-foreground (warm white #f5f0e8), text-muted-foreground (#8a8a8a), text-gold / bg-gold / border-gold (#D4AF37), border (rgba white 0.08). Use `border-white/[0.06]` or `border-white/10` for hairlines. Gold gradient text: class `text-gold-gradient`. Gold gradient bg: `bg-gold-gradient`. Gold glow: `glow-gold` / `glow-gold-hover`. Premium glass: `glass-cinema` / `glass-gold-cinema`. Ambient orbs: `<div className="ambient-orb" style={{width,height,background:"rgba(212,175,55,0.12)",top,left}} />`.
  - Typography: Headlines use `font-[family-name:var(--font-playfair)]` (Playfair Display, massive sizes, tracking-luxe). Italic accents use `font-[family-name:var(--font-cormorant)]` (Cormorant Garamond). UI/labels use default sans with uppercase tracking-[0.2em-0.35em].
  - Motion helpers from "@/components/site/motion": `RevealText` (word-by-word masked reveal — props: text, as, stagger, delay, className), `RevealGroup` + `RevealItem` (stagger children), `Parallax` (props: children, className, speed), `ImageReveal` (props: src, alt, className, rounded). Use these instead of plain motion divs for scroll reveals.
  - Primitives from "@/components/site/primitives": `Eyebrow`, `DisplayHeading` (string title), `SectionHeading` (eyebrow?, title:string, subtitle?, center?), `LuxuryButton` (variant solid|outline|ghost; has ripple+glow built-in), `TextLink` (animated underline), `OrnamentDivider`, `SpiceLevel`, `VegBadge`. The OLD `GoldButton` is GONE — use `LuxuryButton`.
  - `useApp().setView(view)` switches the client-side view. `apiGet`/`apiPost` from "@/lib/api". `IMAGES` from "@/lib/images" has .food/.interior/.drinks/.banquet/.dessert/.ambiance/.hero arrays. Types from "@/lib/types".
  - `Lightbox` from "@/components/site/Lightbox" is available (props: images: {url,title?,caption?}[], index, onClose, onNav).
  - Every page should feel cinematic: use RevealText for headings, ImageReveal/Parallax for images, massive whitespace, asymmetric layouts, edge-to-edge sections, minimal text, bold headlines. Full-viewport (min-h-screen) cinematic sections where appropriate. Add ambient orbs to dark sections.
  - The `cinematic-grain` class adds a subtle film-grain overlay (apply to full-viewport sections).
  - Lint rule trap: `react-hooks/set-state-in-effect` forbids synchronous setState in an effect body — use lazy `useState(() => ...)` initializers + event-listener effects. Avoid unused imports.

---
Task ID: 5
Agent: full-stack-developer (Menu + Gallery reinvention)
Task: Reinvent MenuView.tsx and GalleryView.tsx into cinematic, editorial luxury experiences matching the Home page world.

Work Log:
- Read worklog.md (Task 1+2+3+4) and existing MenuView/GalleryView, plus motion.tsx, primitives.tsx, Lightbox.tsx, lib/images.ts, lib/types.ts, lib/api.ts, Home.tsx, Navbar.tsx for full design-system context. Confirmed GoldButton is gone; using LuxuryButton. Confirmed sticky navbar is `fixed top-0 z-50` with scrolled height ~64px, so `sticky top-16` is correct.
- Rewrote src/components/site/MenuView.tsx:
  - Cinematic header: `min-h-[70vh]` full-bleed section with `IMAGES.food[0]` background, three stacked overlays (bg-background/75 + vertical gradient + radial vignette), `cinematic-grain` overlay, two ambient gold orbs. Centered Eyebrow "À La Carte", massive Playfair headline `text-6xl sm:text-7xl lg:text-8xl tracking-luxe` composed of two `RevealText` spans ("The" in foreground, "Menu" in `text-gold-gradient` with staggered delays 0.2/0.45s), OrnamentDivider, Cormorant italic subtitle.
  - Sticky controls: `sticky top-16 z-30 glass-cinema border-y border-white/[0.06]`. Left = horizontal scrollable category pills ("All" + each category) with a sliding `motion.span layoutId="menu-pill-bg"` gold-gradient indicator behind the active pill (spring transition). Right = rounded-full search input (`border-white/10`, `Search` icon, clear-X button) + veg-only toggle pill (`Leaf` icon, emerald when active, gold-hover when not). All controls `min-h-[44px]` for touch.
  - Items: single-column `max-w-4xl mx-auto` editorial list (NOT a card grid). When `active==="ALL"`, each category group gets a Playfair gold group title (text-3xl/4xl) with a hairline rule and dish-count label. Each dish is a `motion.article layout` row with: 80/112px rounded-2xl thumbnail (VegBadge overlay, hover scale-110), Playfair text-xl/2xl name with `Signature` (gold) / `Sold out` (red) badge pills, Cormorant italic description (line-clamp-2), category label + SpiceLevel, gold Playfair price text-xl/2xl on the right. Hairline `border-b border-white/[0.06]` dividers, `py-8` generous padding, row hover `bg-white/[0.02]`.
  - AnimatePresence `mode="wait"` keyed on `active` so category switches fade out the old list and stagger-fade-up the new (each row `delay: i*0.05` capped at 0.5s). Veg/search filtering is live (no exit anim) since the key is `active` only — smoother UX while typing.
  - Empty state: Cormorant italic "No dishes match your search." centered in a `py-32` block.
  - Fetch via `apiGet<MenuCategory[]>("/api/menu")` on mount with the established `.then(setCategories).catch(()=>{})` pattern (lint-safe — setState inside async callback, not in effect body).
  - Added a subtle ambient orb in the items section background.
- Rewrote src/components/site/GalleryView.tsx:
  - Cinematic header: identical treatment to MenuView but with `IMAGES.interior[1]` bg. Eyebrow "Visual Diary", two `RevealText` spans ("The" foreground, "Gallery" gold-gradient), OrnamentDivider, Cormorant italic subtitle, ambient orbs.
  - Filters: centered flex-wrap pill row (All/Food/Drinks/Interior/Events/Banquet) with the same sliding `motion.span layoutId="gallery-pill-bg"` gold indicator. Clicking a filter resets `visible` to 12 and closes any open lightbox.
  - Masonry: true CSS columns `columns-2 sm:columns-3 lg:columns-4 gap-4` with `break-inside-avoid mb-4` on each item (NOT a JS column-distribution). Each item is a `motion.button` with `whileInView` fade+scale reveal (staggered via `(i%4)*0.06`), `loading="lazy"` img with `group-hover:scale-110` over `duration-[1.2s]`, hover gradient overlay + Playfair title + gold uppercase category badge that slides up on hover.
  - AnimatePresence `mode="wait"` keyed on `cat` for filter transitions.
  - Load More: `LuxuryButton variant="outline"` centered, increments `visible` by 12, hidden when all shown.
  - Lightbox: opens on click with the filtered array, index state, and modular `onNav` (wraps modulo `filtered.length`).
  - Empty state for an empty collection.
- Lint: `cd /home/z/my-project && bun run lint` → 0 errors, 0 warnings. No unused imports. No `react-hooks/set-state-in-effect` violations (only setState-in-async-callback pattern used). No GoldButton references. Did NOT touch any file other than the two assigned.

Stage Summary:
- Files changed (only these two, per task constraint):
  - src/components/site/MenuView.tsx — fully rewritten as cinematic editorial menu.
  - src/components/site/GalleryView.tsx — fully rewritten as immersive masonry + lightbox.
- Both pages now feel like the same cinematic world as Home: full-bleed `min-h-[70vh]` darkened-image headers with grain + ambient gold orbs, Playfair `tracking-luxe` headlines with gold-gradient accent word, Cormorant italic subtitles, OrnamentDivider, sticky glass control bar (menu) / centered pill row (gallery) with sliding gold layoutId indicator, staggered AnimatePresence transitions, generous whitespace, hairline borders, hover zoom + gold tint throughout, 44px touch targets, fully responsive.
- Reused design-system primitives: `Eyebrow`, `OrnamentDivider`, `SpiceLevel`, `VegBadge`, `LuxuryButton`, `RevealText`, `Lightbox`, `IMAGES`, `apiGet`, `cn`. Replaced the old `GoldButton` import with `LuxuryButton`. No new dependencies added.
- Lint clean. Dev server not restarted (already running on 3000). No build run.

---
Task ID: 6
Agent: full-stack-developer (Reservation flow reinvention)
Task: Reinvent ReservationView.tsx into a premium 3-step booking wizard with cinematic header, direction-aware step transitions, and an animated confirmation screen — matching the Black Orchid cinematic design system.

Work Log:
- Read worklog.md (Task 1+2+3+4 + 5) and existing ReservationView.tsx, primitives.tsx (LuxuryButton variants, Eyebrow, OrnamentDivider), motion.tsx (RevealText word-by-word reveal), api.ts (apiPost), types.ts (Reservation with guests:number), images.ts (IMAGES.ambiance[0]). Confirmed GoldButton is gone; using LuxuryButton. Confirmed MenuView's cinematic-header pattern for consistency.
- Fully rewrote src/components/site/ReservationView.tsx as a multi-step booking experience:
  - Cinematic header: `min-h-[60vh]` full-bleed section with `IMAGES.ambiance[0]` background, three stacked overlays (bg-background/75 + vertical gradient + radial vignette), `cinematic-grain` overlay, two ambient gold orbs (staggered animationDelay). Centered Eyebrow "Reserve Your Evening", massive Playfair headline `text-6xl sm:text-7xl lg:text-8xl tracking-luxe` composed of two `RevealText` spans ("Online" foreground delay 0.2s, "Reservation" `text-gold-gradient` delay 0.45s), OrnamentDivider, Cormorant italic subtitle "Reserve in moments. Our maître d' will confirm your table personally."
  - Step indicator: centered `max-w-md` relative flex with an absolute background hairline (`bg-white/10`) + a `bg-gold-gradient` progress fill whose `width` animates proportionally to `(step/(total-1))*100%` (0% → 50% → 100%). Three numbered circles (`StepDot`): active = `bg-gold-gradient text-black glow-gold`, done = `bg-gold text-black` with a Check icon, pending = `border-white/15 text-muted-foreground`. Current label below in `text-gold`, done labels `text-foreground/60`, pending `text-muted-foreground/50` — all sans uppercase tracking-[0.2em].
  - Step 1 — Your Details: `PremiumField` wrapper (gold/80 uppercase label with optional lucide icon, animated red error text). Premium inputs: `h-12 sm:h-14 rounded-xl border-white/10 bg-white/[0.03] px-4 focus:border-gold/50 focus:ring-2 focus:ring-gold/15` (shared `inputClass` constant). Name full-width, Phone + Email in `sm:grid-cols-2`. Validation on Continue: name ≥2 chars, phone ≥7 digits, valid email regex. Inline errors clear on edit.
  - Step 2 — Date, Time & Guests: native `<input type="date" min={today}>` styled premium with a scoped `.r-date-input` class (`color-scheme: dark` + webkit-calendar-picker-indicator gold filter via a `<style>` block). Time slots split into "Lunch Service" + "Dinner Service" Cormorant-italic sub-groups, each a 2-col grid of `TimeSlot` pills (selected = `bg-gold-gradient text-black`, else `border-white/10 text-muted-foreground hover:text-gold`, min-h-[44px]). Guest selector = elegant +/- stepper: large gold-gradient Playfair number (text-5xl/6xl) centered between two 12/14 round border buttons (hover gold, disabled at 1/20), with a "Guest/Guests" label below, PLUS a quick-select pill row (1–8+, where 8+ highlights when n≥8). min 1, max 20.
  - Step 3 — Review & Special Requests: `SummaryCard` (`glass-gold-cinema rounded-3xl p-6/8`) with a "Your Reservation" gold label + hairline, then a `sm:grid-cols-2` grid of 6 rows (Name/Phone/Email/Date/Time/Party) — each a sans uppercase label + Playfair value, date rendered as "Monday, January 15, 2024" via `formatDate()` helper. Below: a textarea for special requests (same `inputClass` but multi-row) with a Sparkles label and a muted helper line.
  - Buttons: Step 1 Continue (solid, full-width). Steps 2 & 3 have Back (ghost) + Continue/Confirm (solid, flex-1). All `LuxuryButton` with `min-h-[52px]` for touch. Confirm button shows "Securing your table…" while loading and includes a Sparkles icon. A muted footnote "Your table is held for 15 minutes past the reservation time." under the confirm row.
  - Transitions: `AnimatePresence mode="wait" custom={direction}` with direction-aware `stepVariants` (enter/exit as functions of dir → x: ±40, opacity 0→1). Each step is a keyed motion.div (`step-0/1/2`) with `initial="enter" animate="center" exit="exit"` and a 0.4s `[0.22,1,0.36,1]` ease. Smoothly scrolls to the wizard top on step change / submit / reset via `wizardRef`.
  - Success screen (replaces wizard via top-level AnimatePresence): `glass-gold-cinema rounded-3xl` centered card. Animated gold check = an 80×80 SVG with a `motion.circle` (r=36, `pathLength` 0→1 over 0.9s) + `motion.path` check stroke (delay 0.7s, 0.5s) using a `<linearGradient id="gold-grad">` (#f0d878→#d4af37→#b8902a) — the circle draws in then the check ticks. Then staggered reveals: "Reservation Requested" (Playfair text-4xl/5xl), Cormorant italic message addressing guest by first name with gold-highlighted guests/date/time, a mini details card (Reference = last 8 chars uppercase, Status "Pending Confirmation", Email), a Sparkles line "A confirmation email is on its way", and an outline `LuxuryButton` "Make Another Reservation" that resets form+step+direction.
  - POST behavior preserved: `apiPost<Reservation>("/api/reservations", {...trimmed fields, guests: Number(form.guests)})`. On success → success screen + `toast.success`. On error → `toast.error`. `loading` tracked on the confirm button.
  - State: single `form` object persists across steps; `errors` map; `direction` (1 forward / -1 back); `loading`; `success`. No `useEffect` used anywhere (no fetch-on-mount, no listeners) → no `react-hooks/set-state-in-effect` risk. `today` computed inline (matches original pattern). All setState calls are in event handlers or async callbacks.
- Reused design-system primitives: `Eyebrow`, `OrnamentDivider`, `LuxuryButton` (solid/outline/ghost), `RevealText`, `IMAGES.ambiance`, `apiPost`, `cn`. No `GoldButton`. No new dependencies. Only `src/components/site/ReservationView.tsx` was touched.
- Lint: `cd /home/z/my-project && bun run lint` → 0 errors, 0 warnings. No unused imports. No `react-hooks/set-state-in-effect` violations. Dev server not restarted (already running on 3000). No build run.

Stage Summary:
- Files changed (only this one, per task constraint): src/components/site/ReservationView.tsx — fully rewritten from a single flat form into a cinematic 3-step wizard.
- The reservation now feels like booking a luxury hotel: a darkened-ambiance header with grain + gold orbs and a word-by-word Playfair headline, a progress indicator with a filling gold line and numbered circles, premium dark inputs with gold focus rings, an editorial split of lunch/dinner time pills, an elegant gold-Playfair guest stepper, a glass summary card, direction-aware slide transitions, and a cinematic confirmation with a hand-drawn gold check SVG.
- Lint clean. POST endpoint unchanged (`/api/reservations`, returns 201 Reservation). Form state persists across steps; full reset on "Make Another Reservation".

---
Task ID: 7
Agent: full-stack-developer (remaining views reinvention)
Task: Reinvent the remaining public pages (About, Banquet, Catering, Hours, Contact, Legal) into cinematic, editorial luxury experiences matching the Black Orchid Home page world.

Work Log:
- Read worklog.md (Tasks 1+2+3+4, 5, 6) and existing AboutView/BanquetView/CateringView/HoursView/ContactView/LegalView, plus motion.tsx, primitives.tsx, api.ts, images.ts, types.ts, store.ts, Home.tsx (Story/BanquetCinema patterns), ReservationView.tsx + MenuView.tsx cinematic-header patterns. Confirmed GoldButton is gone; replaced all usages with LuxuryButton. Confirmed the established cinematic header recipe (full-bleed `min-h-[60-70vh]` darkened image with `bg-background/75` + vertical gradient + radial vignette + `cinematic-grain` + 2 ambient gold orbs; centered Eyebrow + massive Playfair `tracking-luxe` headline built from 2-3 `RevealText` spans with the accent word in `text-gold-gradient`; OrnamentDivider; Cormorant italic subtitle). All views use that recipe for consistency.
- Rewrote src/components/site/AboutView.tsx:
  - Cinematic header (`min-h-[65vh]`, `IMAGES.ambiance[1]` bg, grain, orbs) with Eyebrow "Our Story", 3 RevealText spans ("About" / "Black" / "Orchid" gold), OrnamentDivider, Cormorant subtitle.
  - Story section: asymmetric 12-col grid mirroring Home's Story — `lg:col-span-5` narrow image column with `Parallax`-wrapped `ImageReveal` of `IMAGES.interior[1]` (aspect-[4/5], rounded-[2rem]) + a floating `glass-gold-cinema` "Est. 2003" stat card (-mt-16, ml-auto, lg:-mr-8). `lg:col-span-6 lg:col-start-7` wide text column with `Eyebrow`, `RevealText` (settings.aboutTitle), `OrnamentDivider !justify-start`, two Cormorant italic paragraphs (settings.aboutBody + a second one) inside a `RevealGroup`/`RevealItem`, and a `TextLink` "Discover the Menu" → setView("menu").
  - Stats band: `border-y border-white/[0.06] bg-[#080808]` section, 4 stats (12+ Culinary Awards, 200K+ Guests Served, 20+ Years of Legacy, 100% Fresh Ingredients) each with a gold-circle lucide icon, big Playfair `text-gold-gradient` number, sans uppercase label. Wrapped in a `RevealGroup`/`RevealItem` for staggered reveal.
  - Philosophy section: centered `max-w-4xl`, Eyebrow "Our Philosophy", `RevealText` "Craft, sourced with devotion", OrnamentDivider, a large Cormorant italic `text-2xl sm:text-3xl` paragraph, and an outline `LuxuryButton` "Reserve a Table" → setView("reservation"). Two ambient orbs.
- Rewrote src/components/site/BanquetView.tsx:
  - Cinematic header (`min-h-[65vh]`, `IMAGES.banquet[1]` bg) with Eyebrow "Banquet Facility", 3 RevealText spans ("Celebrations" / "of" / "Distinction" gold), OrnamentDivider, Cormorant subtitle = settings.banquetDesc.
  - Showcase: `RevealGroup` 3-col grid of `ImageReveal` (aspect-[4/5], rounded-[1.5rem]); middle tile offset with `lg:-mt-10 lg:mb-10` for a staggered editorial rhythm.
  - Amenities: 6 cards (sm:2, lg:3) — Grand Capacity (settings.banquetCapacity), Stage & Sound, Valet Parking, Bespoke Décor, Dedicated Planner, In-house Catering. Each: gold icon circle (hover:bg-gold/10), Playfair title, Cormorant italic desc, `hover:bg-[#181818]` + `hover:y -4`, hairline `border-white/[0.06]`. Staggered reveal via `RevealGroup`/`RevealItem`.
  - CTA: a `glass-gold-cinema` rounded-[2rem] centered section with ambient orbs inside, Eyebrow "Enquire", `RevealText` "Host your milestone with us", Cormorant subtitle, `LuxuryButton` (solid) "Enquire Now" → setView("reservation").
- Rewrote src/components/site/CateringView.tsx:
  - Cinematic header (`min-h-[65vh]`, `IMAGES.food[5]` bg) with Eyebrow "Catering Services", 3 RevealText spans ("Catering" / "Par" / "Excellence" gold), OrnamentDivider, Cormorant subtitle.
  - Packages: fetch via `apiGet<CateringPackage[]>("/api/catering")` using the lint-safe `useState<CateringPackage[] | null>(null)` pattern with setState inside `.then()`. 3 cards (lg:3) in a `RevealGroup`/`RevealItem`; middle card highlighted (`border-gold/50` + a "Most Popular" gold-gradient badge with `glow-gold`). Each card: `ImageReveal` (aspect-[16/10]) with a `from-card` gradient overlay, Playfair name, gold uppercase `guests` label, Cormorant italic description, hairline divider, big Playfair `text-gold-gradient` price "$X" + "/ guest" muted, features list (split `features` by `|`, trimmed, each with a gold-circle `Check` icon), `LuxuryButton` (solid for popular, outline otherwise) "Enquire" → setView("reservation"). Hover lift (`y: -6`). Empty-state Cormorant italic fallback.
  - Process section: `border-t border-white/[0.06] bg-[#080808]` with Eyebrow "How It Works", `RevealText` "A seamless process", 4 steps (01 Consultation, 02 Custom Menu, 03 Tasting, 04 The Event) in a row with gold-bordered numbered Playfair circles + Playfair titles + Cormorant italic desc, staggered reveal.
  - Phone CTA at bottom: `border-t border-white/[0.06]` separator, sans uppercase label, a `tel:` anchor in Cormorant gold italic `text-3xl sm:text-4xl` with a `Phone` icon.
- Rewrote src/components/site/HoursView.tsx:
  - Cinematic header (`min-h-[60vh]`, `IMAGES.ambiance[2]` bg) with Eyebrow "Plan Your Visit", 2 RevealText spans ("Visiting" / "Hours" gold), OrnamentDivider, Cormorant subtitle.
  - Hours table: `rounded-[1.5rem] border border-white/[0.06] bg-card` card listing 7 days inside a `RevealGroup`/`RevealItem`. Today's row highlighted (`bg-gold/[0.06]` + a "Today" gold-gradient badge). Each row: gold-circle `Calendar` icon + Playfair day name + (today badge) on the left, Cormorant italic hours + `Clock` icon on the right; hairline `border-b border-white/[0.06]` dividers. Uses settings.hoursWeekday / hoursWeekend.
  - Note card: a `glass-gold-cinema` rounded-[1.5rem] with an ambient orb, Cormorant italic note about last orders 90 min before closing + a solid `LuxuryButton` "Reserve a Table" → setView("reservation").
  - `today` computed inline (matches original pattern; no effect, no lint risk).
- Rewrote src/components/site/ContactView.tsx:
  - Cinematic header (`min-h-[60vh]`, `IMAGES.interior[3]` bg) with Eyebrow "Get in Touch", 2 RevealText spans ("Contact" / "Us" gold), OrnamentDivider, Cormorant subtitle.
  - 2-col layout: LEFT = Eyebrow "Visit Black Orchid" + `RevealText` "We would be delighted to host you" + Cormorant intro + `RevealGroup` of 4 info rows (Address / Phone / Email / Weekday Hours) each with a gold-circle lucide icon (hover:bg-gold/10), sans uppercase gold label, Cormorant value (with `tel:`/`mailto:` links where applicable). Below: a "Follow Us" label + a row of 3 social icon circles (Instagram/Facebook/Twitter from settings) with `whileHover={{ y: -3 }}`. RIGHT = a `glass-cinema rounded-[1.5rem]` form card: Playfair "Send a Message" heading, Cormorant subtitle, premium inputs (`inputClass` = `h-12 sm:h-14 rounded-xl border-white/10 bg-white/[0.03] px-4 focus:border-gold/50 focus:ring-2 focus:ring-gold/15`), name/email/textarea fields with a `Field` label wrapper, and a full-width solid `LuxuryButton type="submit"` "Send Message" with a `Send` icon (shows "Sending…" while loading). Submit: 800ms setTimeout + `toast.success` + clear form (matches original simulation behavior; dropped the unused `apiPost` import).
  - Map: full-width `rounded-[1.5rem] border border-white/[0.06] overflow-hidden` OpenStreetMap iframe (existing embed URL), h-[400px], `grayscale contrast-110`.
- Rewrote src/components/site/LegalView.tsx:
  - Cinematic header (NO background image) — `bg-background` with two ambient gold orbs + a `to-background` gradient. Eyebrow "Legal", a single `RevealText` span rendering the title ("Privacy Policy" or "Terms & Conditions") in `text-gold-gradient`, OrnamentDivider, a sans uppercase `tracking-[0.3em]` "Last updated: {date}" line.
  - Content: `max-w-3xl mx-auto space-y-10` section. `Block` helper preserved but restyled — each block is a `RevealItem` wrapping a `motion.div` with `border-l border-gold/20 pl-6 sm:pl-8`, a Playfair gold `text-2xl sm:text-3xl` heading, and Cormorant `text-lg sm:text-xl` muted-foreground paragraphs. Kept the existing 6 Privacy + 6 Terms content blocks (apostrophes HTML-escaped with `&apos;` / `&ldquo;` / `&rdquo;` for safety). Wrapped the whole list in a `RevealGroup` for staggered reveal.
- Reused design-system primitives throughout: `Eyebrow`, `OrnamentDivider`, `LuxuryButton` (solid/outline), `TextLink`, `RevealText`, `RevealGroup`/`RevealItem`, `Parallax`, `ImageReveal`, `IMAGES`, `apiGet`, `cn`, `toast`. No `GoldButton` references. No new dependencies.
- Lint: `cd /home/z/my-project && bun run lint` → 0 errors, 0 warnings. No unused imports. No `react-hooks/set-state-in-effect` violations (only setState inside async `.then()` callback for CateringView fetch; all other setState calls are in event handlers / submit handlers). Did NOT touch any file other than the six assigned. Dev server not restarted (already running on 3000). No build run.

Stage Summary:
- Files changed (only these six, per task constraint):
  - src/components/site/AboutView.tsx — cinematic header + asymmetric story (parallax image + floating "Est. 2003" glass card + RevealText + Cormorant body + TextLink) + 4-stat band + philosophy section.
  - src/components/site/BanquetView.tsx — cinematic header + staggered 3-image showcase + 6-amenity grid + glass-gold CTA.
  - src/components/site/CateringView.tsx — cinematic header + 3 catering packages (middle highlighted "Most Popular") with ImageReveal + gold price + Check-feature lists + LuxuryButton + 4-step process + gold phone CTA.
  - src/components/site/HoursView.tsx — cinematic header + 7-day card with today-row highlight + glass-gold note card with Reserve CTA.
  - src/components/site/ContactView.tsx — cinematic header + 2-col info (gold-circle info rows + social circles) / glass form (premium inputs + LuxuryButton submit) + grayscale OpenStreetMap iframe.
  - src/components/site/LegalView.tsx — image-less cinematic header (ambient orbs only) + RevealText gold title + staggered gold-rule Block list (Playfair gold headings + Cormorant body) preserving all 6 Privacy + 6 Terms sections.
- All six pages now feel like scenes in the same cinematic film as Home / Menu / Gallery / Reservation: full-bleed `min-h-[60-65vh]` darkened-image headers (or ambient-orb-only for Legal) with grain + ambient gold orbs, word-by-word Playfair `tracking-luxe` headlines with a `text-gold-gradient` accent word, OrnamentDivider, Cormorant italic subtitles; asymmetric / editorial layouts; massive whitespace; hairline `border-white/[0.06]` borders; `bg-card` and `bg-[#080808]` section tonal contrast; `glass-gold-cinema` for high-impact CTAs; staggered `RevealGroup`/`RevealItem` reveals; `ImageReveal` clip-path masks; `Parallax` drift on hero images; hover lift/gold-tint throughout; 44px+ touch targets; fully responsive.
- Replaced the old `GoldButton` import in AboutView, BanquetView, CateringView, HoursView with `LuxuryButton` (variants solid/outline/ghost as appropriate). Replaced the `SectionHeading` title-JSX usage with direct `RevealText` calls so the gold accent word is part of the word-by-word reveal. Dropped the unused `apiPost` import from ContactView. CateringView uses the requested `useState<CateringPackage[] | null>(null)` fetch pattern.
- Lint clean (exit 0). Dev server not restarted. No build run.

---
Task ID: 5
Agent: full-stack-developer (AdminMenu rich fields)
Task: Upgrade the Admin Menu "Add/Edit Item" modal in src/components/admin/AdminMenu.tsx to support the new rich MenuItem fields (tagline, shortDescription, chefRecommended, ingredients[], allergens[], servingSize, images[]) — using the existing admin primitives from src/components/admin/ui.tsx.

Work Log:
- Read worklog.md (Tasks 1+2+3+4, 6, 7) to understand the admin design system. Read existing src/components/admin/AdminMenu.tsx, src/components/admin/ui.tsx (all primitives), src/lib/types.ts (MenuItem now has tagline/shortDescription/images/ingredients/allergens/servingSize/chefRecommended), src/app/api/menu/route.ts + [id]/route.ts (POST/PATCH serialize arrays to JSON, PATCH auto-syncs image=images[0] when images provided), and eslint.config.mjs (react-hooks/exhaustive-deps + most rules off; set-state-in-effect still applies so kept the lazy useState + conditional mount pattern).
- Kept the top-level AdminMenu component structure (category list with AdminCard sections, skeleton loaders, empty state, item rows, CategoryActions, conditional ItemModal/CategoryModal mount) — only enhanced item rows and rewrote ItemModal.
- Item row enhancements:
  - Thumbnail now reads from `item.images?.[0] || item.image` (falls back to UtensilsCrossed placeholder when empty).
  - Added a "Chef's Pick" gold badge (ChefHat icon) shown when `item.chefRecommended` is true, alongside the existing Featured/Spice/Veg/Sold-Out badges.
  - The secondary line now prefers `item.tagline` (italic gold) and falls back to `item.description` (muted).
- Extended `ItemFormState` with: `tagline`, `shortDescription`, `images: string[]`, `chefRecommended`, `ingredients: string[]`, `allergens: string[]`, `servingSize`. Dropped the legacy single `image: string` field (now derived from `images[0]` at save time).
- `deriveItemForm(item, categories)`:
  - Edit: `tagline: item.tagline ?? ""`, `shortDescription: item.shortDescription ?? ""`, `chefRecommended: item.chefRecommended ?? false`, `ingredients: item.ingredients ?? []`, `allergens: item.allergens ?? []`, `servingSize: item.servingSize ?? ""`, `images: item.images?.length ? item.images : (item.image ? [item.image] : [])`.
  - Add: sensible defaults (empty strings, false booleans, empty arrays, `available: true`, `spice: "0"`, `categoryId: categories[0]?.id ?? ""`).
  - Kept the lazy `useState(() => deriveItemForm(item, categories))` pattern + conditional mount via `key={editingItem?.id ?? "new"}` in the parent — no useEffect-with-setState, so `react-hooks/set-state-in-effect` is not triggered.
- Upgraded `ItemModal` to `size="xl"` and organised it into 4 clearly labelled sections (each prefixed by a small `SectionLabel` — gold uppercase tracking-[0.18em] + hairline rule):
  1. **Essentials** — Name (required), Tagline (placeholder "A short evocative line — e.g. The crown jewel of the menu", hint about menu placement), Category (SearchableSelect) + Price (AdminInput number, required) in a `md:grid-cols-2`, Short Description (AdminInput, placeholder "One-line summary for menu lists", hint about compact layouts), Full Description (AdminTextarea, rows 4, required).
  2. **Imagery** — new custom `MultiImageUploader` component (NOT the single ImageUploader primitive):
     - Responsive grid `grid-cols-3 sm:grid-cols-4` of aspect-square thumbnails.
     - Each thumbnail: rounded-xl, hairline border, image-cover, with a small "Cover" badge (gold pill + Star icon) on index 0 and a numeric counter chip on every tile.
     - Hover overlay (bg-black/70 backdrop-blur): top row = Replace (Upload icon → file picker → FileReader.readAsDataURL → replaces that index) + Delete (Trash2 → removes that index); bottom row = ChevronLeft/ChevronRight reorder buttons (disabled at edges, swap with neighbour).
     - "Add Image" dashed-border tile at the end (Upload icon + uppercase "Add Image") that opens the file picker and appends.
     - Shared hidden `<input type="file" accept="image/*">` controlled by a `replaceIndexRef` (when set, the next pick replaces that index; otherwise appends). Ref is reset to null after each pick.
     - "Paste URL" fallback row below the grid: a text input + "Add URL" AdminButton (subtle). Enter key also adds.
     - File validation: image/(jpeg|jpg|png|webp|gif|avif) only, max 6MB; inline red error text via AlertTriangle icon.
     - Helper line: "JPG, PNG, WebP, GIF, AVIF · up to 6MB each".
  3. **Dietary & Classification** — `md:grid-cols-2` of Spice Level (SearchableSelect, searchable=false, values 0/1/2/3) + Serving Size (AdminInput, placeholder "e.g. 200g, 4 pieces"); then a row of 4 Toggles in a bordered container: Vegetarian (green), Featured (gold), Chef's Recommendation (gold), Available (green).
  4. **Ingredients & Allergens** — two `TagInput` components:
     - Ingredients (tone="neutral", gold chips).
     - Allergens (tone="red", red-tinted chips + red container border on focus) with a `COMMON_ALLERGENS` suggestions row (Gluten, Dairy, Eggs, Peanuts, Tree Nuts, Shellfish, Fish, Soy, Sesame, Mustard) shown as "+ Allergen" quick-add pills (only those not already present).
     - TagInput behaviour: type → Enter or comma adds a chip (case-insensitive dedupe), Backspace on empty input removes the last chip, blur-with-text also adds. Chips have an X button to remove. Feels like Linear/Notion tag editors.
- `save()` now posts the full payload: `name, tagline, shortDescription, description, price, image (images[0] ?? null), images (array), categoryId, available, veg, spice, featured, chefRecommended, ingredients (array), allergens (array), servingSize`. Kept `apiPost("/api/menu", payload)` for create and `apiPatch(`/api/menu/${item.id}`, payload)` for edit. The API serializes arrays to JSON and auto-syncs `image` from `images[0]`.
- Footer save button uses a derived `canSave` (name non-empty + price set + category set + not saving) for the disabled state.
- Imports: added `useRef` (for the shared file input), lucide icons `Upload, X, ChevronLeft, ChevronRight, ChefHat, Link as LinkIcon, AlertTriangle`. Dropped the unused `ImageUploader` import (replaced by the custom MultiImageUploader). Kept `AdminCard, AdminButton, AdminInput, AdminTextarea, SearchableSelect, Toggle, Modal, AdminSectionTitle, Badge, Skeleton, EmptyState`.
- Style: consistent 8px spacing (`space-y-4` inside sections, `space-y-7` between sections), 12px radius on inputs/cards, `rounded-xl` on thumbnails/tiles, soft hover states (200-300ms transitions), translucent `border-admin-border` + `bg-white/[0.02]` containers, gold accents on labels/cover badge/Chef's Pick.
- Verification: `cd /home/z/my-project && bun run lint` → 0 errors, 0 warnings (exit 0). No `react-hooks/set-state-in-effect` violations (only the existing fetch-on-mount useEffect with setState inside `.then()`, which is allowed). No unused imports. Dev server not restarted (already running on 3000). No build run. Only `src/components/admin/AdminMenu.tsx` was modified.

Stage Summary:
- Files changed (only this one, per task constraint): src/components/admin/AdminMenu.tsx — ItemModal upgraded from a compact form into a 4-section premium content editor (Essentials / Imagery / Dietary & Classification / Ingredients & Allergens), with a custom multi-image uploader (cover badge, hover Replace/Delete, left/right reorder, file + URL inputs, 6MB validation) and Linear/Notion-style tag inputs for ingredients (gold) and allergens (red, with quick-add suggestions).
- Item rows now show a "Chef's Pick" badge when `chefRecommended` and prefer the tagline (italic gold) as the secondary line; thumbnail reads from `images[0]` with `image` fallback.
- Form state initialises via the lazy `useState(() => deriveItemForm(item, categories))` pattern + conditional `key` mount — lint-safe, no setState-in-effect. Save posts the full rich payload (including `images`, `ingredients`, `allergens` as arrays and `tagline`, `shortDescription`, `chefRecommended`, `servingSize`); the API handles JSON serialisation and `image` auto-sync.
- Lint clean (exit 0). Dev server untouched. No build run.
