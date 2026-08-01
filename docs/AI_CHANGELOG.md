# AI Changelog

This file is the **session log for AI agents** working on the Black Orchid
project. Every AI session — whether it ships code or just investigates —
**must** append a new section at the bottom of this file before terminating.

---

## Purpose

Black Orchid is a long-lived, multi-agent project. Code is touched by many
different AI assistants (Gemini, Copilot, Z.ai, etc.) over time. Without a
shared log, each agent re-discovers the same context, reverts decisions, or
breaks work a previous agent did.

This file solves that. It is the **first** thing an AI reads at the start of
a session (after `docs/AI_BOOTSTRAP.md` and `docs/AI_CONTEXT.md`) and the
**last** thing it writes before exiting.

---

## How to Use This File

### At session start

1. Read this file end-to-end. The most recent entries are at the bottom.
2. Skim `docs/AI_BOOTSTRAP.md` and `docs/AI_CONTEXT.md` for project-wide
   context.
3. Read `docs/DECISION_LOG.md` to understand **why** the codebase looks the
   way it does — do not undo a documented decision without a written reason.
4. Read `docs/KNOWN_ISSUES.md` to avoid re-reporting known problems.

### At session end

1. Append a new section using the template below.
2. Be honest about breaking changes — the next agent needs to know.
3. If you discovered something the next agent should know (a hidden
   invariant, a fragile file, a gotcha), write it in **Next Suggestions**.

---

## Entry Template

Copy this block, fill it in, and append to the bottom of the file. Keep
entries factual and concise — this is a log, not a memoir.

```markdown
---

### YYYY-MM-DD — <Agent name & version>

**Task:** <One-line summary of what this session was supposed to do>

**Files Modified:**
- `<path/to/file>` — <one-line reason>
- `<path/to/file>` — <one-line reason>

**Reason:** <Why this change was needed. 1–3 sentences.>

**Breaking Changes:** <None / list. Be explicit about API, schema, or
type changes that downstream code depends on.>

**Tests Performed:**
- `bun run lint` — <pass / fail / N/A>
- `bun run build` — <pass / fail / N/A>
- Manual smoke test: <what was clicked / verified>

**Next Suggestions:**
- <Concrete next step for the next agent.>
- <Open question or risk to flag.>
```

---

## Example Entries (from actual project history)

These three entries are illustrative of the format and reflect real
milestones in the project's evolution. Future entries should match this
style.

---

### 2025-01-10 — Z.ai Code (initial build)

**Task:** Build the complete Black Orchid luxury restaurant website with
public site + admin CMS + REST API + SQLite database, from a fresh
Next.js 16 scaffold.

**Files Modified:**
- `prisma/schema.prisma` — defined 9 models (AdminUser, MenuCategory,
  MenuItem, GalleryImage, Reservation, Testimonial, EventItem,
  CateringPackage, SiteSettings)
- `prisma/seed.ts` — seeded admin, 6 categories, 24 menu items, 16 gallery
  images, 6 testimonials, 4 events, 3 catering packages, 1 settings row
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/auth.ts` — bcrypt + custom JWT (HS256, 12h expiry)
- `src/lib/api.ts` — client-side fetch helpers with token injection
- `src/lib/store.ts` — Zustand store for view + admin auth state
- `src/lib/types.ts` — shared TypeScript types
- `src/lib/images.ts` — central image URL registry (later replaced by local
  WebP — see 2025-01-18 entry)
- `src/app/page.tsx` — single-route shell, view-switched via Zustand
- `src/app/admin/page.tsx` — admin entry
- `src/app/api/**` — 19 REST routes (menu, gallery, events, testimonials,
  catering, reservations, settings, stats, categories, admin/login,
  admin/logout, admin/change-password)
- `src/components/admin/*` — AdminApp, AdminOverview, AdminMenu,
  AdminReservations, AdminGallery, AdminEvents, AdminCatering,
  AdminTestimonials, AdminSettings, plus shared `ui.tsx`
- `src/components/site/*` — Home, Navbar, Footer, MenuView, GalleryView,
  AboutView, ReservationView, CateringView, BanquetView, ContactView,
  HoursView, LegalView, Lightbox, Chrome, Loader, primitives

**Reason:** Initial project delivery. Needed a working full-stack site with
admin CMS so the restaurant staff could manage content without touching code.

**Breaking Changes:** None — this was the first commit.

**Tests Performed:**
- `bun run lint` — pass
- `bun run build` — pass (standalone output verified in `.next/standalone/`)
- Manual smoke test: admin login, CRUD on every section, reservation flow,
  gallery lightbox, mobile responsive at 375px / 768px / 1280px

**Next Suggestions:**
- The public site is functional but visually plain. Next pass should add
  cinematic motion (GSAP, Lenis) for a luxury feel.
- Image URLs point at a remote CDN with ~1.9 MB files and 1.2 s TTFB —
  should be compressed to local WebP.
- No automated tests yet — add Playwright for the reservation flow.

---

### 2025-01-15 — Z.ai Code (premium refinement)

**Task:** Elevate the public site to a cinematic, luxury experience using
GSAP ScrollTrigger, Lenis smooth scroll, SplitType text reveals, liquid
glass page transitions, magnetic buttons, and a context-aware cursor.

**Files Modified:**
- `src/components/site/motion.tsx` — new: RevealGroup, RevealItem,
  RevealText (word-by-word masked reveal), Parallax, ImageReveal,
  ScrollLine, CountUp
- `src/components/site/premium-motion.ts` — new: magnetic button hook,
  context-aware cursor logic, liquid glass transition orchestrator
- `src/components/site/gsap-utils.ts` — new: ScrollTrigger setup, Lenis
  <-> GSAP ticker bridge, `prefers-reduced-motion` guard
- `src/components/site/Cursor.tsx` — new: gold dot + trailing spring ring,
  grows on interactive hover, disabled on touch
- `src/components/site/Loader.tsx` — rewritten: cinematic curtain lift
- `src/components/site/Navbar.tsx` — rewritten: transparent → glass-cinema
  on scroll, fullscreen mobile menu with staggered Playfair items
- `src/components/site/Home.tsx` — rewritten as cinematic storytelling:
  Hero (video bg + parallax + word-by-word headline reveal), Manifesto,
  Story, SignatureDishes, Philosophy, BanquetCinema, GalleryPreview,
  TestimonialCinema, ReservationCinema
- `src/app/globals.css` — added cinematic utility classes:
  `cinematic-grain`, `ambient-orb`, `glass-cinema`, `glass-gold-cinema`,
  `text-gold-gradient`, `bg-gold-gradient`, `glow-gold`, `ripple`,
  `reveal-mask`, `img-reveal`, `tracking-luxe`, `animate-ken-burns`,
  custom cursor classes
- `src/components/site/primitives.tsx` — added Eyebrow, DisplayHeading,
  LuxuryButton (replaces GoldButton), OrnamentDivider
- `package.json` — added `gsap`, `lenis`, `split-type`

**Reason:** The initial site was functional but didn't feel like a luxury
brand. The client wanted "the website itself to feel like a Black Orchid
experience" — motion, glass, and gold are the brand language.

**Breaking Changes:**
- `GoldButton` export removed from `primitives.tsx` — use `LuxuryButton`.
- `SectionHeading` API changed: now takes a string `title` instead of a
  ReactNode; uses `DisplayHeading` internally.
- Navbar height changed from 80px to 64px when scrolled — any
  `sticky top-20` should become `sticky top-16`.

**Tests Performed:**
- `bun run lint` — pass
- `bun run build` — pass
- Manual smoke test: scroll through Home, Menu, Gallery, About,
  Reservation. Verified motion plays on desktop, respects
  `prefers-reduced-motion`, and degrades gracefully on mobile (cursor
  disabled, parallax reduced).

**Next Suggestions:**
- GSAP "target not found" warnings appear on HMR — benign but noisy.
  Consider guarding with `useLayoutEffect` + a `requestAnimationFrame`
  before initialising ScrollTrigger.
- The liquid glass transition has a noticeable blank frame on slow
  connections while the next view's images load. Consider a preloader.
- ScrollStack pin-based stacking was attempted and removed — see
  2025-01-18 entry for the bug it caused.

---

### 2025-01-18 — Z.ai Code (bug fixes & infrastructure)

**Task:** Fix a batch of bugs reported after the premium refinement pass,
and harden the image pipeline.

**Files Modified:**
- `src/components/site/Home.tsx` (and others) — removed `ScrollStack`
  component entirely. Replaced with simple GSAP fade-up grid. ScrollStack's
  pin-based stacking caused large blank sections between cards on
  short-content pages and was impossible to debug across viewports.
- `src/lib/store.ts` — fixed hash navigation: `hydrateAdmin()` now listens
  for `hashchange` so direct URL navigation with `#menu`, `#gallery`, etc.
  works. Previously only in-app clicks updated the view.
- `src/components/site/motion.tsx` — fixed Framer Motion duration units.
  Several transitions used `duration: 200` (interpreted as 200 seconds)
  instead of `duration: 0.2`. Animations now run at the intended speed.
- `src/lib/auth.ts` — migrated password hashing from scrypt to bcrypt
  (12 rounds). Kept `verifyScryptLegacy()` for backward compatibility with
  existing hashes. New hashes always start with `$2b$12$`. The user
  explicitly requested bcrypt.
- `src/app/api/upload/route.ts` — **new file**. POST endpoint that accepts
  a `FormData` file, validates type (`image/*`) and size (≤ 6 MB), saves
  to `public/uploads/<timestamp>-<random>.<ext>`, returns `{ url }`.
  Required because the client mandate was "no Base64 in the database".
- `src/components/admin/ui.tsx` — added `ImageUploader` and
  `MultiImageUploader` components. Both call `apiUpload()` from
  `src/lib/api.ts`. Drag-and-drop, click-to-browse, "Paste URL" toggle,
  progress bar, inline error display.
- `src/lib/api.ts` — added `apiUpload(file: File)` helper. Sets
  `Authorization` header but deliberately does NOT set `Content-Type` —
  the browser must set the multipart boundary automatically.
- `public/img/*.webp` — 44 new WebP files. Compressed via `sharp` from
  the original CDN URLs. Max dimension 1200px, quality 78. Average file
  size ~50 KB (vs 1.9 MB original). TTFB dropped from 1.2 s to 2 ms.
- `src/lib/images.ts` — updated to point at local `/img/*.webp` instead of
  remote CDN URLs.

**Reason:** Three categories of bugs after the premium pass: (1) layout
glitches from ScrollStack, (2) auth migration the user requested, (3)
image pipeline that violated the "no Base64" rule and was too slow.

**Breaking Changes:**
- `ScrollStack` component is gone. Any code importing it must switch to
  `RevealGroup` + `RevealItem`.
- Existing admin users with scrypt hashes can still log in (backward
  compat), but their hash is NOT auto-upgraded to bcrypt. They will keep
  using scrypt until they change their password.
- `IMAGES` constants changed shape — arrays now contain `/img/<hash>.webp`
  paths, not remote URLs. Any code hard-coding a CDN URL must be updated.

**Tests Performed:**
- `bun run lint` — pass
- `bun run build` — pass
- Manual smoke test: uploaded 5 images via admin (JPG, PNG, WebP, GIF,
  oversize 7 MB → rejected correctly). Verified files appear in
  `public/uploads/` and URLs are stored in the DB. Logged in with the
  existing scrypt-hash admin (still works), changed password, verified
  new hash is bcrypt. Verified hash navigation works for `#menu`,
  `#gallery`, `#reservation`, `#admin`.

**Next Suggestions:**
- Auto-upgrade scrypt hashes to bcrypt on next successful login (re-hash
  with bcrypt, persist). Low priority since the only scrypt user is the
  seeded admin and the password is known.
- Add a cron / on-demand job to compress any future uploads to WebP
  (currently uploads are saved as-is, which can bloat `public/uploads/`).
- Add `sitemap.xml` and `robots.txt` improvements — currently only a
  basic `robots.txt` exists.
- Consider enforcing role-based access per API route (`requireRole("ADMIN")`
  vs `requireRole("EDITOR")`). Today every write only checks
  `requireAdmin()`.

---

<!-- APPEND NEW ENTRIES BELOW THIS LINE -->
