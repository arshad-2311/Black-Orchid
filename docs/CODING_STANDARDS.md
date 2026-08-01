# Coding Standards

The conventions every contributor must follow when writing code for Black Orchid.

> **Source of truth**
> - `tsconfig.json` — TypeScript config (strict mode, `@/*` alias)
> - `eslint.config.mjs` — lint rules
> - `src/components/site/primitives.tsx` — design-system primitives
> - `src/components/site/motion.tsx` + `premium-motion.ts` + `gsap-utils.ts` — motion helpers
> - `src/lib/auth.ts`, `src/lib/api.ts`, `src/lib/db.ts` — backend utilities

---

## 1. TypeScript

### 1.1 Strict typing throughout

- `tsconfig.json` has `"strict": true`.
- All functions, components, and hooks have explicit return types where inference isn't obvious.
- `any` is discouraged but `noImplicitAny: false` is set (allows some flexibility with third-party types). Prefer `unknown` over `any` when the type is truly unknown.

```ts
// ✅ Good
function parseItem(raw: PrismaMenuItem): MenuItem { ... }

// ⚠️ Acceptable for untyped third-party data
function parseItem(raw: any): MenuItem { ... }

// ❌ Avoid
function parseItem(raw): any { ... }
```

### 1.2 Type definitions live in `src/lib/types.ts`

All shared types (`MenuItem`, `GalleryImage`, `Reservation`, `Testimonial`, `EventItem`, `CateringPackage`, `SiteSettings`, `AdminUser`, `MenuCategory`) are defined in `src/lib/types.ts`. Import from there:

```ts
import type { MenuItem, SiteSettings } from "@/lib/types";
```

### 1.3 Use `import type` for type-only imports

```ts
// ✅ Good — type-only import is erased at compile time
import type { MenuItem } from "@/lib/types";

// ✅ Also fine — mixed import
import { apiGet } from "@/lib/api";
import type { MenuItem } from "@/lib/types";
```

### 1.4 The `@/*` path alias

`tsconfig.json` maps `@/*` to `./src/*`. Always use the alias for imports from `src/`:

```ts
// ✅ Good
import { db } from "@/lib/db";
import { LuxuryButton } from "@/components/site/primitives";

// ❌ Avoid — relative paths that cross directories
import { db } from "../../../lib/db";
```

Relative imports are fine **within** a feature folder (e.g. `./primitives` from `./Home`).

---

## 2. Styling

### 2.1 Tailwind CSS only — no inline styles (except dynamic values)

```tsx
// ✅ Good — Tailwind classes
<button className="rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-black">
  Reserve
</button>

// ⚠️ Acceptable — dynamic value that can't be a class
<div className="ambient-orb" style={{ width: 400, height: 400, top: "15%", left: "5%" }} />

// ❌ Avoid — styling that should be a class
<div style={{ display: "flex", padding: "16px", backgroundColor: "#0A0A0A" }} />
```

### 2.2 Design tokens

Use the CSS variables / Tailwind classes defined in `src/app/globals.css`:

| Token | Class | Value |
| --- | --- | --- |
| Background | `bg-background` | `#0A0A0A` |
| Card | `bg-card` | `#131313` |
| Foreground | `text-foreground` | `#f5f0e8` (warm white) |
| Muted | `text-muted-foreground` | `#8a8a8a` |
| Gold | `text-gold` / `bg-gold` / `border-gold` | `#D4AF37` |
| Border (hairline) | `border-white/[0.06]` or `border-white/10` | — |
| Gold gradient text | `text-gold-gradient` | `#f0d878 → #d4af37 → #b8902a` |
| Gold gradient bg | `bg-gold-gradient` | same |
| Gold glow | `glow-gold` / `glow-gold-hover` | box-shadow |
| Premium glass | `glass-cinema` / `glass-gold-cinema` | backdrop-blur + tint |
| Film grain | `cinematic-grain` | SVG noise overlay |
| Ambient orb | `ambient-orb` | floating gold blur |

**Do not** use indigo or blue colours. The brand palette is dark + gold.

### 2.3 Typography

| Role | Class | Font |
| --- | --- | --- |
| Headlines | `font-[family-name:var(--font-playfair)]` | Playfair Display |
| Italic accents | `font-[family-name:var(--font-cormorant)]` | Cormorant Garamond |
| UI / body | (default) `font-[family-name:var(--font-geist-sans)]` | Geist Sans |
| Letter spacing | `tracking-luxe` / `tracking-[0.2em]` / `tracking-[0.35em]` | — |

### 2.4 Responsive design (mobile-first)

- Start with mobile styles, add `sm:`, `md:`, `lg:`, `xl:` prefixes for larger screens.
- All touch targets ≥ 44px (`min-h-[44px]` or `min-w-[44px]`).
- Test on 375px (iPhone SE), 768px (iPad), 1280px+ (desktop).

---

## 3. Components

### 3.1 Use shadcn/ui for primitives

The `src/components/ui/` folder contains the full shadcn/ui (New York style) library: Button, Card, Dialog, Input, Select, Table, Toast, etc. **Prefer these over custom implementations.**

```tsx
// ✅ Good — use shadcn/ui
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ❌ Avoid — custom button
function MyButton() { return <button className="..." /> }
```

### 3.2 Use the Black Orchid design-system primitives for the public site

For the **public site**, prefer the luxury primitives in `src/components/site/primitives.tsx`:

- `Eyebrow` — small uppercase label with leading gold mark
- `DisplayHeading` — massive editorial heading
- `SectionHeading` — eyebrow + display + optional subtitle
- `LuxuryButton` — gold gradient, ripple, glow, magnetic (variants: `solid` / `outline` / `ghost`)
- `TextLink` — animated underline + arrow
- `OrnamentDivider` — gold ornament divider
- `SpiceLevel` — 0–3 chilli icons
- `VegBadge` — green/veg badge

> The old `GoldButton` export no longer exists — use `LuxuryButton`.

### 3.3 Admin primitives

For the **admin CMS**, use the primitives in `src/components/admin/ui.tsx`:

- `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminButton`
- `Modal`, `Badge`, `Skeleton`, `EmptyState`, `AdminSectionTitle`
- `ImageUploader` (single image), `MultiImageUploader` (multiple images)
- `SearchableSelect`, `TagInput`, `Toggle`

### 3.4 `"use client"` directive

Add `"use client";` at the top of any file that:
- Uses React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Uses browser APIs (`window`, `document`, `localStorage`)
- Uses client-only libraries (GSAP, Framer Motion, Lenis, Zustand)
- Handles user events (onClick, onChange, onSubmit)

```tsx
// src/components/site/Home.tsx
"use client";

import { useEffect, useState } from "react";
// ...
```

API route handlers (`src/app/api/**/route.ts`) do **not** use `"use client"` — they run on the server. Do not add `"use server"` either — Next.js 16 Route Handlers are server-side by default.

---

## 4. API Routes

### 4.1 Use Next.js Route Handlers, not Server Actions

All backend logic lives in `src/app/api/**/route.ts` as Route Handlers (`GET`, `POST`, `PATCH`, `PUT`, `DELETE` exports). **Server Actions are not used.**

```ts
// src/app/api/menu/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const categories = await db.menuCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

### 4.2 All database access goes through Prisma

Never use raw SQL or a different ORM. Always `import { db } from "@/lib/db"`.

```ts
// ✅ Good
const menu = await db.menuItem.findMany({ ... });

// ❌ Avoid
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("...");
```

### 4.3 Auth via `requireAdmin()`

Every write operation (POST/PATCH/PUT/DELETE) must call `requireAdmin(req)`:

```ts
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // proceed with the write
}
```

Public reads (GET) are open. See [AUTHENTICATION.md](./AUTHENTICATION.md) for the full auth flow.

### 4.4 Error handling

Wrap route handlers in `try/catch`. Return a human-readable error message and appropriate HTTP status:

```ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    // ...
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
```

### 4.5 Response conventions

| Operation | Status | Body |
| --- | --- | --- |
| GET (success) | 200 | The resource(s) |
| POST (create) | 201 (or 200) | The created resource |
| PATCH / PUT (update) | 200 | The updated resource |
| DELETE (success) | 200 | `{ "ok": true }` |
| Validation error | 400 | `{ "error": "..." }` |
| Unauthenticated | 401 | `{ "error": "Unauthorized" }` |
| Not found | 404 | `{ "error": "..." }` |
| Server error | 500 | `{ "error": "..." }` |

---

## 5. Images

### 5.1 `<img>` attributes

Every `<img>` tag must have:

```tsx
<img
  src={url}
  alt={description}        // descriptive; alt="" for decorative
  loading="lazy"           // defer loading until near viewport
  decoding="async"         // decode off the main thread
  className="h-full w-full object-cover"
/>
```

The hero video poster is an exception — it's `preload="auto"` because it's above the fold.

### 5.2 No Base64 in the database

Images are uploaded to `public/uploads/` via `POST /api/upload` (or referenced from `public/img/`). The database stores **only the URL string**, never the file contents.

```ts
// ✅ Good — store the URL
await db.menuItem.create({ data: { image: "/uploads/123-abc.png", ... } });

// ❌ Never — store the file contents
await db.menuItem.create({ data: { image: "data:image/png;base64,iVBOR..." } });
```

See [IMAGE_STORAGE.md](./IMAGE_STORAGE.md).

### 5.3 No Next.js `<Image>` component

All images are plain `<img>` tags. The static WebP files are already optimised, and the Next.js Image component's on-the-fly optimisation would add overhead without benefit. The `<ImageReveal>` wrapper in `src/components/site/motion.tsx` is the preferred way to render a content image with a reveal animation.

---

## 6. Animations

### 6.1 GSAP for scroll-triggered, Framer Motion for component-level

| Use case | Tool |
| --- | --- |
| Scroll-triggered reveals (fade-up, parallax, image mask) | GSAP + ScrollTrigger (`useFadeUp`, `useImageReveal`, `useParallax`) |
| Page transitions | GSAP timeline (`usePageTransition` in `premium-motion.ts`) |
| Text split reveals | SplitType + GSAP (`useSplitText`) |
| Component enter/exit (modals, list items) | Framer Motion (`AnimatePresence`, `motion.div`) |
| Layout animations (active nav pill) | Framer Motion (`layoutId`) |
| Spring physics (cursor, magnetic button) | Framer Motion `useSpring` / GSAP `elastic.out` |

### 6.2 Use the existing hooks — don't reinvent

```tsx
// ✅ Good — use the existing hooks
import { useFadeUp, useFadeScale, useParallax } from "@/components/site/gsap-utils";
import { useSplitText, useImageReveal, useMagnetic, usePageTransition, useLenis } from "@/components/site/premium-motion";
import { RevealText, Parallax, ImageReveal, RevealGroup, RevealItem } from "@/components/site/motion";

// ❌ Avoid — custom GSAP timeline in a component
useEffect(() => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current } });
  tl.from(".my-element", { opacity: 0, y: 50 });
}, []);
```

If you need a one-off animation, use `useReveal` (generic GSAP from/to hook) or a `motion.div` with `whileInView`.

### 6.3 Always respect `prefers-reduced-motion`

Every motion hook checks `prefers-reduced-motion` and renders elements visible immediately if the user has requested reduced motion:

```ts
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

useEffect(() => {
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity: 1, y: 0, scale: 1 });
    return;
  }
  // ... animation setup
}, []);
```

For Framer Motion, use the `useReducedMotion()` hook or check the media query manually.

### 6.4 Clean up on unmount

Every GSAP hook uses `gsap.context()` and returns a cleanup function that calls `ctx.revert()`:

```ts
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, scrollTrigger: { ... } });
  }, el);
  return () => ctx.revert();  // ← kills ScrollTriggers + reverts DOM changes
}, []);
```

For SplitType, also call `split.revert()` to restore the original text node:

```ts
return () => { ctx.revert(); split.revert(); };
```

For event listeners (magnetic button, cursor), remove them in the cleanup:

```ts
useEffect(() => {
  el.addEventListener("mousemove", onMove);
  return () => el.removeEventListener("mousemove", onMove);
}, []);
```

### 6.5 GPU-friendly transforms only

Animate `opacity`, `y`, `x`, `scale`, `rotation` — **never** `top`, `left`, `width`, `height`, `margin`, `padding`. Layout-triggering properties cause jank.

```ts
// ✅ Good
gsap.to(el, { y: 50, opacity: 0.5, duration: 0.8 });

// ❌ Avoid — triggers layout
gsap.to(el, { marginTop: 50, width: 200, duration: 0.8 });
```

`clipPath` is acceptable (used by `useImageReveal`) — it's composited and doesn't trigger layout.

---

## 7. Naming Conventions

| Element | Convention | Example |
| --- | --- | --- |
| React components | PascalCase | `LuxuryButton`, `AdminMenu`, `ReservationView` |
| Functions / hooks | camelCase | `useFadeUp`, `hashPassword`, `requireAdmin` |
| Variables | camelCase | `featuredItems`, `adminToken` |
| Constants | UPPER_SNAKE_CASE | `AUTH_COOKIE`, `BCRYPT_ROUNDS`, `VARIANT_TINTS` |
| TypeScript types | PascalCase | `MenuItem`, `SiteSettings`, `ViewKey` |
| Files (components) | PascalCase | `LuxuryButton.tsx`, `AdminMenu.tsx` |
| Files (utilities) | kebab-case or camelCase | `gsap-utils.ts`, `premium-motion.ts`, `auth.ts` |
| CSS classes (custom) | kebab-case | `glass-cinema`, `ambient-orb`, `text-gold-gradient` |
| API routes | kebab-case | `/api/admin/login`, `/api/menu` |
| Prisma models | PascalCase | `MenuItem`, `GalleryImage`, `SiteSettings` |
| Prisma fields | camelCase | `chefRecommended`, `shortDescription` |

### Hook naming

- `use<Thing>` — returns a value or ref (`useFadeUp`, `useMagnetic`)
- `use<Thing>` with side effects, no return — `useLenis`, `usePageTransition`

---

## 8. Import Order

Group imports in this order, separated by blank lines:

```tsx
// 1. React / Next.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

// 2. Third-party libraries
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { create } from "zustand";
import { Home, ArrowRight } from "lucide-react";

// 3. Lib utilities (via @/ alias)
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import type { MenuItem, SiteSettings } from "@/lib/types";
import { IMAGES } from "@/lib/images";
import { cn } from "@/lib/utils";

// 4. UI components (shadcn/ui or design-system)
import { Button } from "@/components/ui/button";
import { Eyebrow, LuxuryButton } from "@/components/site/primitives";
import { RevealText } from "@/components/site/motion";

// 5. Relative imports (within the same feature folder)
import { Hero } from "./Hero";
import { useFadeUp } from "./gsap-utils";
```

ESLint doesn't enforce this, but consistency makes the codebase scannable.

---

## 9. Error Handling

### 9.1 API routes — `try/catch`

Every route handler wraps its body in `try/catch`:

```ts
export async function POST(req: Request) {
  try {
    // ... logic
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}
```

### 9.2 Client-side — `toast.error`

User-facing errors use Sonner toasts:

```tsx
import { toast } from "sonner";

try {
  await apiPost("/api/menu", payload);
  toast.success("Menu item created");
} catch (err) {
  toast.error(err instanceof Error ? err.message : "Failed to save");
}
```

### 9.3 Async data fetching — silent fail with fallback

For non-critical data (e.g. loading settings on the home page), catch and use a fallback:

```tsx
useEffect(() => {
  apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => {});
}, []);
```

The `.catch(() => {})` is intentional — the UI has null-safe rendering that shows a skeleton or default content. Don't let a failed fetch crash the page.

---

## 10. No `console.log` in Production

```tsx
// ✅ Acceptable during local development
console.log("debug:", value);

// ❌ Must be removed before committing
```

Use `console.error` for genuine error logging in API route catch blocks (these are useful in `server.log`). Avoid `console.log` in client components — it pollutes the user's browser console.

To find stray logs:

```bash
rg "console\.(log|debug)" src/ --type ts --type tsx
```

---

## 11. Lint-Safe Data Fetching

The ESLint rule `react-hooks/set-state-in-effect` forbids synchronous `setState` calls inside a `useEffect` body. The lint-safe pattern is to call `setState` inside an async callback:

```tsx
// ✅ Good — setState inside .then() callback
useEffect(() => {
  apiGet<MenuCategory[]>("/api/menu")
    .then(setCategories)
    .catch(() => {});
}, []);

// ❌ Lint error — setState called synchronously in effect body
useEffect(() => {
  setCategories([]); // forbidden
}, []);
```

For initialising state from props or localStorage, use a lazy `useState` initializer:

```tsx
// ✅ Good — lazy initializer
const [collapsed, setCollapsed] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("bo_admin_sidebar_collapsed") === "1";
});
```

---

## 12. Accessibility Checklist

Before marking a component done, verify:

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`, `<article>`)
- [ ] All interactive elements are keyboard-accessible (Tab + Enter + Escape)
- [ ] Focus rings are visible (`focus:ring-2 focus:ring-gold/15`)
- [ ] Touch targets ≥ 44px (`min-h-[44px]`)
- [ ] `alt` text on every `<img>` (or `alt=""` for decorative)
- [ ] `aria-label` on icon-only buttons
- [ ] `prefers-reduced-motion` respected
- [ ] Color contrast meets WCAG AA (gold `#D4AF37` on `#0A0A0A` passes)

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for the full guide.

---

## 13. Git / Commit Conventions

- Commit messages: imperative mood, lowercase first word (`add reservation wizard`, not `Added reservation wizard`)
- One logical change per commit
- Run `bun run lint` before committing — must pass with 0 errors
- Append a `---` section to `worklog.md` after finishing work (see [README.md](./README.md) §Contribution Guide)

---

## 14. Related Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Colors, typography, motion timing
- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) — Component-by-component reference
- [ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md) — GSAP / Framer Motion / Lenis patterns
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — A11y checklist
- [API_REFERENCE.md](./API_REFERENCE.md) — Route handler conventions
- [AUTHENTICATION.md](./AUTHENTICATION.md) — `requireAdmin()` usage
