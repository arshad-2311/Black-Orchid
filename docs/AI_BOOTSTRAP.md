# AI Bootstrap — Quick Start for Gemini

> **Read this first.** It is a 2-page orientation for any AI agent (Gemini, Copilot, etc.)
> joining the Black Orchid project. After reading this, proceed to
> `docs/AI_CONTEXT.md` for the full rule set.

---

## 1. What This Project Is

**Black Orchid** is a production-grade luxury restaurant website with a full CMS admin
dashboard. The public site is a cinematic single-page application; the admin panel is a
separate route at `/admin`.

- **Brand:** Fine dining + banquet facility. Dark charcoal + gold luxury aesthetic.
- **Vibe:** Cinematic, editorial, immersive — feels like a film, not a template.
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma (SQLite)
  · GSAP + Lenis + Framer Motion · shadcn/ui · Zustand.

---

## 2. Project Goals

| Goal | Detail |
|------|--------|
| **Drive reservations** | Every page guides toward "Reserve a Table". |
| **Showcase the brand** | Premium dark + gold aesthetic, cinematic motion. |
| **Full CMS** | Admin can manage all content without touching code. |
| **Production-ready** | 90+ Lighthouse, accessible, responsive, deployable. |
| **Maintainable** | Clean architecture, documented, reusable components. |

---

## 3. Current Status

**Feature-complete and in production refinement.**

- ✅ Public site: 11 views (home, about, menu, banquet, gallery, catering, hours, contact, reservation, privacy, terms)
- ✅ Admin CMS: 8 sections (overview, reservations, menu, gallery, testimonials, events, catering, settings)
- ✅ Full CRUD with JWT auth (bcrypt + HS256)
- ✅ Image uploads to disk (`/api/upload`)
- ✅ 44 compressed WebP images, hero video
- ✅ Premium animations: GSAP ScrollTrigger, Lenis smooth scroll, SplitType, liquid glass page transitions, magnetic buttons, context-aware cursor
- ✅ 27-file documentation package in `/docs`
- ⚠️ No automated tests yet (manual only)
- ⚠️ SQLite (not PostgreSQL) — fine for current scale
- ⚠️ No email sending for reservations (stub only)

---

## 4. High-Level Architecture

```
Browser
  │
  ├── / (public site — Zustand hash routing, single Next.js route)
  │     ├── PillNav, Cursor, Loader, Footer, Chrome
  │     └── 11 views switched via useApp().setView()
  │
  ├── /admin (separate Next.js route)
  │     ├── Login screen (JWT)
  │     └── AdminApp (sidebar + 8 CMS sections)
  │
  └── /api/* (19 REST route handlers)
        ├── Public: GET /api/menu, POST /api/reservations, GET /api/settings
        ├── Admin: all POST/PATCH/DELETE (requireAdmin() → JWT verify)
        └── /api/upload (FormData → public/uploads/)
              │
              ▼
        Prisma → SQLite (db/custom.db)
        9 models: AdminUser, MenuCategory, MenuItem, GalleryImage,
        Reservation, Testimonial, EventItem, CateringPackage, SiteSettings
```

**Data flow:** Client `fetch()` → `apiGet/apiPost` (injects JWT from Zustand) →
Next.js Route Handler → `requireAdmin()` → Prisma → SQLite → JSON response.

---

## 5. Files to Read First

Read in this order before making any changes:

| # | File | Why |
|---|------|-----|
| 1 | `docs/AI_CONTEXT.md` | The full rulebook — DO/DO-NOT, brand, philosophy |
| 2 | `docs/PROJECT_MEMORY.md` | Why decisions were made, lessons learned |
| 3 | `docs/CODING_STANDARDS.md` | TypeScript, Tailwind, animation, naming rules |
| 4 | `docs/DESIGN_SYSTEM.md` | Colors, typography, spacing, components |
| 5 | `docs/ANIMATION_SYSTEM.md` | GSAP, Lenis, SplitType, transitions, cleanup |
| 6 | `docs/API_REFERENCE.md` | All 19 endpoints, auth, request/response |
| 7 | `docs/KNOWN_ISSUES.md` | Benign warnings vs real bugs — don't "fix" benign ones |
| 8 | `prisma/schema.prisma` | Database models — the source of truth for data |
| 9 | `src/lib/store.ts` | Zustand store — view routing + admin auth state |
| 10 | `src/app/page.tsx` | Entry point — how views are rendered + transitions |

---

## 6. Common Pitfalls

| Pitfall | What happens | Fix |
|---------|-------------|-----|
| **Using `duration: 200` in Framer Motion** | Animation takes 200 *seconds*, not ms | Use `0.2` (seconds) |
| **`setState` in `useEffect` body** | ESLint `react-hooks/set-state-in-effect` error | Use lazy `useState(() => …)` initializer + event listener |
| **Forgetting `gsap.context().revert()`** | Memory leak, ScrollTriggers survive unmount | Return cleanup from every `useEffect` that uses GSAP |
| **Storing Base64 in DB** | Bloats DB, breaks saves | Use `/api/upload` → store URL only |
| **Prisma `create` with `categoryId` instead of `category: { connect: { id } }`** | `Argument 'category' is missing` error on required relations | Use `connect` syntax for creates |
| **Not restarting dev server after `schema.prisma` changes** | Prisma client is stale, fields not recognized | `bun run db:generate` + restart |
| **Edit buttons with `opacity-0 group-hover:opacity-100`** | Invisible on mobile/touch → "does nothing" reports | Make always visible or `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` |
| **`<motion.button>` with Framer props on plain `<button>`** | JSX parsing error | Remove Framer props when switching to `<button>` |
| **Hiding cursor with `mix-blend-mode: difference`** | Invisible on dark backgrounds | Don't use mix-blend on the cursor |
| **ScrollStack / pin-based animations** | Large blank sections, layout bugs | Avoid pinning; use GSAP fade-up instead |

---

## 7. Design Rules

1. **Colors:** Background `#0A0A0A`, cards `#131313`, gold `#D4AF37`, text `#f5f0e8`,
   muted `#8a8a8a`. Admin: `#0B0B0F` / `#141418` / `#D4AF37` (scoped to `.admin-root`).
2. **Typography:** Playfair Display (headings), Cormorant Garamond (italic accents),
   Geist (body/labels). Use `font-[family-name:var(--font-playfair)]` etc.
3. **Spacing:** 8px system. Sections use `py-32 sm:py-40`. Cards use `p-6` or `p-8`.
4. **Radius:** `rounded-xl` (12px) for inputs, `rounded-2xl` (16px) for cards,
   `rounded-full` for buttons/pills.
5. **Glass:** `glass-cinema` for public overlays, `admin-surface` / `admin-surface-elevated`
   for admin cards.
6. **Shadows:** `shadow-soft`, `shadow-soft-lg`, `glow-gold` — never harsh.
7. **Border glow:** `.glow-border` (continuous) and `.glow-border-hover` (on hover only).
   Apply sparingly — primary CTAs and featured cards only.
8. **Film grain:** Global, 2.5% opacity, `mix-blend-overlay`. Don't increase.
9. **Buttons:** `LuxuryButton` with `variant="solid|outline|ghost"`. Has ripple + magnetic
   + glow built in. Pass `cursorLabel="Reserve"` for context-aware cursor labels.
10. **Never use indigo or blue.** Gold is the only accent.

---

## 8. Coding Conventions

```typescript
// ✅ Correct: TypeScript, Tailwind, "use client", lazy initializer
"use client";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export function MyComponent({ items }: { items: MenuItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Item[] | null>(null); // null = loading

  useEffect(() => {
    apiGet<Item[]>("/api/items").then(setData).catch(() => setData([]));
  }, []);

  // ✅ GSAP with cleanup
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => { /* animations */ }, ref.current);
    return () => ctx.revert(); // ← always clean up
  }, []);

  return <div ref={ref} className="rounded-2xl border border-white/[0.06] bg-card" />;
}
```

**Rules:**
- TypeScript strict mode throughout.
- `"use client"` on every component that uses hooks/state/animations.
- Tailwind utility classes only — no inline CSS (except dynamic `style={{}}` for values that can't be Tailwind).
- API routes: Next.js Route Handlers (`export async function GET/POST/PATCH/DELETE`).
- All write endpoints call `requireAdmin(req)` — returns null if unauthenticated.
- Images: `loading="lazy" decoding="async"` on every `<img>`. Upload via `/api/upload`, never Base64.
- State: Zustand (`useApp`), local `useState` in modals. No Redux, no React Query for data fetching.
- After any CRUD: call `load()` to re-fetch and refresh UI.
- Animations: GSAP for scroll-triggered, Framer Motion for component-level. Check `prefers-reduced-motion`.
- Cleanup: `gsap.context().revert()` in every GSAP `useEffect` return.
- Lint must pass: `bun run lint` with 0 errors.
- Import order: React → libraries → `@/lib` → `@/components` → relative.

---

## 9. Pre-Change Checklist

Before writing any code, verify:

- [ ] I have read `docs/AI_CONTEXT.md` and `docs/PROJECT_MEMORY.md`.
- [ ] I am **not** redesigning pages or changing branding/colors/typography.
- [ ] I am **not** removing existing functionality or animations.
- [ ] I am reusing existing components (`LuxuryButton`, `AdminCard`, `Modal`, etc.).
- [ ] I am following the design system (`docs/DESIGN_SYSTEM.md`).
- [ ] My animation respects `prefers-reduced-motion` and cleans up on unmount.
- [ ] My images use `loading="lazy" decoding="async"`.
- [ ] My API routes call `requireAdmin()` for protected operations.
- [ ] My `useEffect` does not call `setState` synchronously (use lazy initializer or event listener).
- [ ] I will run `bun run lint` and fix all errors before finishing.
- [ ] I will test on desktop (1440px) and mobile (390px).
- [ ] I will append my work record to `worklog.md`.
- [ ] I will not "fix" benign warnings (Framer Motion scroll-offset, GSAP HMR target-not-found).

---

*This file is the entry point. For full details, read the 27-file documentation in `/docs/`.*
