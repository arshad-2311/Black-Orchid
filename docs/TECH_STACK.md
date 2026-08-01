# Technology Stack

This document lists every technology used in Black Orchid and explains **why** each was
chosen. The stack is deliberately conservative — proven, type-safe, and well-integrated
— so that the cinematic surface rests on a boringly reliable foundation.

---

## Core Framework

### Next.js 16 (App Router)
**Package:** `next` ^16.1.1

The entire application — public site, admin dashboard, and REST API — is one Next.js
project. The **App Router** is used because:

- **Route handlers** (`src/app/api/**/route.ts`) give us REST endpoints with zero extra
  server boilerplate, colocated with the frontend.
- **Server/client component split** lets the layout and metadata stay server-rendered
  while the interactive views are client components.
- **`output: "standalone"`** produces a self-contained production server that bundles
  the `db/`, `prisma/`, `public/`, and `.env` — ideal for single-container deployment.

### React 19
**Package:** `react` / `react-dom` ^19.0.0

Required by Next.js 16. The app uses `useEffect`, `useRef`, `useState`, and the new
concurrent features where helpful. No class components.

### TypeScript 5
**Package:** `typescript` ^5

Every file is typed. Shared types in `src/lib/types.ts` mirror the Prisma models so the
client and API agree on shapes. `tsconfig.json` maps `@/*` → `./src/*`. Strictness is
enforced; `next.config.ts` sets `typescript.ignoreBuildErrors: true` only to avoid
blocking builds on non-fatal type nitpicks during rapid iteration.

---

## Styling

### Tailwind CSS 4
**Package:** `tailwindcss` ^4 + `@tailwindcss/postcss`

Utility-first styling for both the public site and admin. Tailwind 4's CSS-first config
(`@theme inline` in `globals.css`) lets us define the luxury palette as CSS variables
and exposes them as utility classes (`bg-background`, `text-gold`, etc.). Chosen for
development speed, consistency, and small production output (only used classes ship).

### shadcn/ui (New York style)
**Packages:** Radix UI primitives + `class-variance-authority` + `cmdk`

A copy-in component library (not an npm dependency) living in `src/components/ui/`. The
**New York** style was chosen for its tighter, more professional aesthetic over the
default style. Configured in `components.json` with a neutral base color, CSS variables,
and Lucide icons. Used primarily by the admin dashboard; the public site uses bespoke
primitives for a more cinematic look.

### Lucide React
**Package:** `lucide-react` ^0.525.0

The icon library. Consistent stroke width, tree-shakeable, and the shadcn/ui default.
Used everywhere — nav, buttons, admin sidebar, form fields, dish badges.

---

## Database

### Prisma 6
**Packages:** `prisma` ^6.11.1 + `@prisma/client` ^6.11.1

A type-safe ORM that generates a fully-typed client from `schema.prisma`. Chosen because:

- **End-to-end type safety** — the `db.menuItem.findMany(...)` return type is inferred,
  so refactors catch errors at compile time.
- **Schema as source of truth** — `bun run db:push` synchronises the DB with the schema.
- **Migrations** are available (`db:migrate`) when the schema stabilises.

The client is a singleton (`src/lib/db.ts`) cached on `globalThis` to survive Next.js
hot-reload.

### SQLite
**Provider:** `sqlite` (via Prisma)

A file-based database at `db/custom.db`. Chosen because:

- **No server to provision** — perfect for a single-operator restaurant CMS.
- **Trivial backups** — copy the file.
- **Zero-config dev** — `bun run db:push` creates it instantly.

The trade-off (no concurrent writers) is acceptable: the admin is a single user and
public traffic only reads. The schema can be swapped to PostgreSQL by changing the
`datasource` provider if horizontal scaling is ever needed.

---

## Animation

### GSAP + ScrollTrigger
**Package:** `gsap` ^3.15.0

The industry-standard JavaScript animation library. Used for scroll-triggered reveals
(`useFadeUp`, `useFadeScale`, `useParallax`), the SplitType text reveals, the magnetic
button effect, the image clip-path mask reveals, and the multi-phase liquid-glass page
transition. Chosen for its **scrubbing** (animations tied to scroll position), its
`ScrollTrigger` plugin, and its `context()` API for clean cleanup. All hooks respect
`prefers-reduced-motion`.

### Lenis
**Package:** `lenis` ^1.3.25

A lightweight smooth-scroll library. Wired into GSAP's ticker (`gsap.ticker.add(raf)`)
so ScrollTrigger updates stay in sync with the smoothed scroll position. Gives the site
its signature "weighty" scroll feel without jank. Disabled under reduced-motion.

### Framer Motion
**Package:** `framer-motion` ^12.23.2

Used for component-level animations: the `PillNav` slide-in, the active-pill sliding
indicator (`layoutId`), view-enter/exit transitions, the `DishShowcase` modal, the
`Lightbox`, staggered list reveals, and the custom cursor's spring-driven ring. Chosen
for its declarative `variants` API and spring physics.

### SplitType
**Package:** `split-type` ^0.3.4

Splits text into words or lines for staggered reveals. Used by `useSplitText` to animate
headlines word-by-word as they enter the viewport (the signature "writing itself"
effect). Reverted cleanly on unmount.

---

## State Management

### Zustand
**Package:** `zustand` ^5.0.6

A minimal, hook-based store. Chosen over Redux/Context for its tiny footprint and
ergonomic API. The single `useApp` store (`src/lib/store.ts`) holds:

- `view` — the current public-site view (with URL hash sync).
- `adminToken` / `adminUser` — the admin session (persisted to localStorage).

No server-state library (React Query, etc.) is needed because the data is simple and
fetched on demand via `apiGet`; the store only owns genuinely client-side state.

---

## Authentication

### bcryptjs
**Package:** `bcryptjs` ^3.0.3 (+ `@types/bcryptjs`)

Password hashing with **12 rounds**. Chosen over Node's native `bcrypt` (which requires
native compilation) because `bcryptjs` is pure JavaScript and deploys anywhere. The
`verifyPassword` function also supports a legacy scrypt format for backward
compatibility with older seeded accounts.

### Custom JWT (HS256)
**Implementation:** `src/lib/auth.ts` (no external JWT library)

A hand-rolled JWT using Node's `crypto` module: `createHmac("sha256", secret)` with
`timingSafeEqual` for signature comparison. **12-hour expiry.** Chosen because the auth
surface is tiny (one admin role, three endpoints) and a 60-line implementation is easier
to audit than configuring NextAuth. Tokens travel in both the `Authorization: Bearer`
header and an `httpOnly` cookie.

> **NextAuth.js v4** is available in the dependency tree (`next-auth` ^4.24.11) if
> multi-provider or session-based auth is needed later, but it is not currently wired up.

---

## UI & UX Utilities

### Sonner
**Package:** `sonner` ^2.0.6

Toast notifications. Used for reservation success, admin CRUD feedback ("Saved",
"Deleted"), and the newsletter signup. Mounted as `SonnerToaster` in the root layout.
Chosen for its clean API and stackable, animated toasts.

### Radix Toast
**Package:** `@radix-ui/react-toast`

A second toast system (the shadcn/ui `Toaster`) mounted alongside Sonner for components
that use the `useToast` hook. Both coexist without conflict.

### Recharts
**Package:** `recharts` ^2.15.4

Composable charting library used in the admin `AdminOverview` for the 7-day reservations
bar chart. Chosen for its declarative component API and responsiveness.

### Sharp
**Package:** `sharp` ^0.34.3

High-performance image processing. Used to compress the curated imagery into the 44 WebP
files in `public/img/` (≈40× smaller than the source CDN images). Available for any
future server-side image transformation needs.

### date-fns
**Package:** `date-fns` ^4.1.0

Date formatting and arithmetic (used for reservation date handling and the admin
dashboard's relative time labels).

---

## Forms & Tables

### React Hook Form
**Package:** `react-hook-form` ^7.60.0 + `@hookform/resolvers` ^5.1.1

Performant, uncontrolled form management. Paired with Zod for schema validation. Used in
admin forms where complex validation is needed.

### Zod
**Package:** `zod` ^4.0.2

Schema-first validation. Defines the shape of API request bodies and form inputs, with
TypeScript inference. Keeps the client and server honest about data shapes.

### TanStack Table
**Packages:** `@tanstack/react-table` ^8.21.3 + `@tanstack/react-query` ^5.82.0

Headless table primitives and server-state querying. Available for admin data tables
(though the current admin uses simpler bespoke tables).

---

## Fonts

Loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS variables:

| Font                | Variable              | Role |
| ------------------- | --------------------- | ---- |
| **Playfair Display** | `--font-playfair`    | All major headings. A high-contrast display serif that signals luxury. Loaded in weights 400–900, normal + italic. |
| **Cormorant Garamond** | `--font-cormorant` | Italic accents, subtitles, pull-quotes, and dish descriptions. A delicate serif that softens the page. Weights 300–700, normal + italic. |
| **Geist**           | `--font-geist-sans`   | The sans-serif workhorse for labels, buttons, UI text, and body copy. Crisp and modern. |

> The public site references these via `font-[family-name:var(--font-playfair)]` Tailwind
> arbitrary properties rather than hardcoded font names, so a font swap is a one-line
> change.

---

## Additional Libraries

| Package | Why it's here |
| --- | --- |
| `clsx` + `tailwind-merge` | The `cn()` helper for merging Tailwind classes without conflicts. |
| `cmdk` | Powers the shadcn/ui `Command` component (searchable menus). |
| `vaul` | The `Drawer` primitive (mobile slide-overs). |
| `embla-carousel-react` | The carousel engine behind the shadcn `Carousel`. |
| `react-day-picker` | The date picker behind the shadcn `Calendar`. |
| `react-resizable-panels` | Resizable panel layouts (shadcn `Resizable`). |
| `react-syntax-highlighter` | Syntax highlighting (available for any code-display need). |
| `react-markdown` | Markdown rendering (available for rich-text content). |
| `@mdxeditor/editor` | A rich-text editor (available for future content editing). |
| `input-otp` | One-time-password input (shadcn `InputOTP`). |
| `uuid` | ID generation where needed. |
| `@reactuses/core` | A collection of React hooks. |
| `next-themes` | Theme toggling (available; the public site is dark-only by design). |
| `next-intl` | Internationalisation (available if multi-language is needed). |
| `@dnd-kit/*` | Drag-and-drop sortable lists (available for future admin reordering). |
| `z-ai-web-dev-sdk` | In-house AI SDK (server-side only; not currently used in features). |

> Availability does not imply usage. The stack intentionally includes shadcn/ui's full
> component set and common utilities so features can be built without adding
> dependencies, but only the libraries described above are actively wired into the
> experience.

---

## Dev Tooling

| Tool | Role |
| --- | --- |
| **Bun** | Package manager, script runner, and (optionally) the production runtime (`bun .next/standalone/server.js`). |
| **ESLint** (`eslint` ^9 + `eslint-config-next`) | Linting. Run with `bun run lint`. |
| **tw-animate-css** | Tailwind animation utilities (used by shadcn/ui). |
| **bun-types** | TypeScript types for Bun APIs. |

---

## Summary: The Stack at a Glance

```
┌─────────────────────────────────────────────────┐
│  Browser                                        │
│  React 19 + Zustand + Framer Motion + GSAP +   │
│  Lenis + SplitType + Tailwind 4 + shadcn/ui    │
└───────────────────────┬─────────────────────────┘
                        │ fetch /api/* (REST)
┌───────────────────────▼─────────────────────────┐
│  Next.js 16 Route Handlers                      │
│  bcrypt + custom JWT (HS256) + requireAdmin()   │
└───────────────────────┬─────────────────────────┘
                        │ Prisma Client
┌───────────────────────▼─────────────────────────┐
│  Prisma 6 + SQLite (db/custom.db)               │
└─────────────────────────────────────────────────┘
```

Every layer was chosen to be **type-safe, deployable as a single container, and
maintainable by one developer** — while leaving headroom to scale (swap SQLite, add
NextAuth, introduce React Query) without rewriting the application.
