# Folder Structure

This document maps every folder and significant file in the repository, explaining what
each contains and how the pieces relate.

```
black-orchid/
├── docs/                      # Project documentation (this file lives here)
├── prisma/                    # Database schema + seed script
├── public/                    # Static assets served as-is
├── db/                        # SQLite database file (runtime)
├── src/
│   ├── app/                   # Next.js App Router (routes + API)
│   ├── components/
│   │   ├── site/              # Public site components
│   │   ├── admin/             # Admin dashboard components
│   │   └── ui/                # shadcn/ui component library
│   ├── hooks/                 # Shared React hooks
│   └── lib/                   # Core logic (db, auth, api, store, types)
├── examples/                  # WebSocket reference demo
├── next.config.ts             # Next.js configuration
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json            # shadcn/ui config (New York style)
├── Caddyfile                  # Gateway configuration
└── .env                       # DATABASE_URL (and ADMIN_JWT_SECRET in prod)
```

---

## `prisma/`

The database layer configuration.

| File            | Description |
| --------------- | ----------- |
| `schema.prisma` | Defines the SQLite datasource and **9 models**: `AdminUser`, `MenuCategory`, `MenuItem`, `GalleryImage`, `Reservation`, `Testimonial`, `EventItem`, `CateringPackage`, `SiteSettings`. Array fields (`images`, `ingredients`, `allergens`) are stored as JSON strings because SQLite primitives cannot be lists. |
| `seed.ts`       | Idempotent seed script. Creates the default admin (`admin@blackorchid.com` / `admin123`), upserts `SiteSettings`, seeds 6 menu categories, 24 menu items with rich data (tagline, ingredients, allergens, serving size, multiple images), 16 gallery images, 6 testimonials, 4 events, and 3 catering packages. Run with `bun prisma/seed.ts`. |

---

## `public/`

Static assets served directly by Next.js at the root URL.

| Path                  | Description |
| --------------------- | ----------- |
| `img/`                | **44 compressed WebP images** — food, interior, drinks, banquet, dessert, hero, ambiance, and avatars. Referenced through the typed registry in `src/lib/images.ts`. ~40× smaller than the original CDN images. |
| `uploads/`            | Runtime image uploads from the admin `ImageUploader`. Files are named `<timestamp>-<hash>.<ext>`. The DB stores only the URL string — never Base64. |
| `hero-video.mp4`      | Cinematic hero background video (~2.4 MB). Used by the Home hero section. |
| `logo.svg`            | Brand wordmark. |
| `robots.txt`          | Crawler directives. |

---

## `db/`

| File         | Description |
| ------------ | ----------- |
| `custom.db`  | The SQLite database file. Created by `bun run db:push`. Back it up by copying the file. The path is set via `DATABASE_URL=file:/home/z/my-project/db/custom.db` in `.env`. |

---

## `src/app/`

The Next.js App Router root. Contains the two user-facing routes, the layout, global
styles, the API route tree, and the 404 page.

| File / Dir             | Description |
| ---------------------- | ----------- |
| `layout.tsx`           | Root layout. Loads the three Google fonts (Geist, Playfair Display, Cormorant Garamond) as CSS variables, sets metadata (title, description, OpenGraph, Twitter), renders the global film-grain overlay (`opacity: 0.025`), and mounts both toast providers (`Toaster` + `SonnerToaster`). |
| `page.tsx`             | The public site entry — the **only** public route. A client component that reads `view` from the Zustand store and renders the corresponding view component (`Home`, `MenuView`, `GalleryView`, …). Mounts `Cursor`, `Loader`, `ScrollProgress`, `PillNav`, `Footer`, `StickyReserve`. Initialises Lenis smooth scroll and the page-transition hook. Hydrates admin session on mount. Redirects `view === "admin"` to `/admin`. |
| `globals.css`          | The complete design system: Tailwind 4 import, `@theme` token mapping, the luxury dark palette (`:root`), custom utilities (`.glass-cinema`, `.text-gold-gradient`, `.glow-border`, `.ripple`, etc.), the custom-cursor CSS, the admin palette scoped to `.admin-root`, and keyframes (shimmer, slowZoom, kenBurns, orbFloat, borderGlowPulse, …). |
| `not-found.tsx`        | The 404 page. Cinematic, with a gold "404" gradient, `OrnamentDivider`, and buttons to return home or open the admin. Auto-redirects admin-URL typos (e.g. `/admi`, `/admin-panel`) to `/admin`. |
| `admin/`               | The admin route. |
| `api/`                 | The REST API route tree. |

### `src/app/admin/`

| File       | Description |
| ---------- | ----------- |
| `page.tsx` | The `/admin` route entry. A client component that hydrates the admin session from localStorage, then renders `ScrollProgress` + `AdminApp`. |

### `src/app/api/`

Every subfolder is a resource; each contains `route.ts` (collection) and `[id]/route.ts`
(item) where applicable. All write operations call `requireAdmin(req)`.

```
api/
├── route.ts                    # GET /api → { message: "Hello, world!" } (health check)
├── admin/
│   ├── login/route.ts          # POST — verify password, sign JWT, set cookie
│   ├── logout/route.ts         # POST — clear the auth cookie
│   └── change-password/route.ts# POST — admin-protected, bcrypt-hashes new password
├── categories/[id]/route.ts    # PATCH / DELETE a menu category
├── catering/
│   ├── route.ts                # GET (public) / POST (admin)
│   └── [id]/route.ts           # PATCH / DELETE (admin)
├── events/
│   ├── route.ts                # GET (public) / POST (admin)
│   └── [id]/route.ts           # PATCH / DELETE (admin)
├── gallery/
│   ├── route.ts                # GET (public) / POST (admin)
│   └── [id]/route.ts           # PATCH / DELETE (admin)
├── menu/
│   ├── route.ts                # GET (public) categories+items / POST (admin) item or category
│   └── [id]/route.ts           # PATCH / DELETE (admin) a menu item
├── reservations/
│   ├── route.ts                # POST (public, creates PENDING) / GET (admin list)
│   └── [id]/route.ts           # PATCH (status) / DELETE (admin)
├── settings/route.ts           # GET (public) / PUT (admin) the singleton settings row
├── stats/route.ts              # GET (admin) dashboard aggregate stats
└── testimonials/
    ├── route.ts                # GET (public, ?featured=1) / POST (admin)
    └── [id]/route.ts           # PATCH / DELETE (admin)
```

> **Image upload:** `src/lib/api.ts` provides `apiUpload(file)` which POSTs to
> `/api/upload` (multipart form-data). The uploaded file is saved to `public/uploads/`
> and the URL string is returned.

---

## `src/components/site/`

The public website's component library. Every file is a client component (`"use client"`)
unless noted.

### Shell & Chrome

| File            | Description |
| --------------- | ----------- |
| `PillNav.tsx`    | Floating glassmorphism navigation pill. Transparent at the top of the page, becomes `glass-cinema` after 40px of scroll. Desktop: inline pills with a sliding gold active indicator (`layoutId`). Mobile: collapses to a hamburger that opens a fullscreen staggered overlay. Includes the wordmark logo and a "Reserve" button. |
| `Cursor.tsx`     | Context-aware custom cursor (desktop, fine-pointer only). Five states — `default`, `hover`, `view`, `drag`, `text` — each with a different ring size, border color, and optional icon/label. A gold dot tracks precisely; a spring-driven ring trails. Reads `data-cursor` and `data-cursor-label` attributes on hovered elements. |
| `Loader.tsx`     | Cinematic intro loader. Full-screen black overlay with an ambient gold orb, "Est. 2003" eyebrow, the "Black Orchid" wordmark with a letter-spacing reveal, and a gold progress line. Exits by sliding up after 1.9s. |
| `Chrome.tsx`     | Exports `ScrollProgress` (a 0.5px gold gradient bar at the very top, spring-driven) and `StickyReserve` (a floating desktop "Book" orb at 700px scroll + a mobile bottom bar with safe-area inset). Hidden on the reservation view itself. |
| `Footer.tsx`     | Newsletter band (huge Playfair heading + email capture with success toast), 4-column grid (brand+socials, quick links, contact, hours), and a bottom bar with Privacy / Terms / Admin links. |

### Motion Utilities

| File                  | Description |
| --------------------- | ----------- |
| `motion.tsx`          | Framer Motion-based reusable primitives: `RevealGroup`/`RevealItem` (staggered fade-up), `RevealText` (word-by-word masked text reveal), `Parallax` (scroll-driven Y movement), `ImageReveal` (clip-path + scale image reveal), `ScrollLine`, `CountUp`. |
| `gsap-utils.ts`       | GSAP + ScrollTrigger hooks: `useFadeUp`, `useFadeScale`, `useParallax`, `useReveal`. All register ScrollTrigger, respect `prefers-reduced-motion`, clean up via `gsap.context().revert()`, and use GPU-friendly transforms. |
| `premium-motion.ts`   | The premium motion layer: `useLenis` (global smooth scroll wired into GSAP's ticker), `useSplitText` (SplitType word/line reveals), `useImageReveal` (GSAP clip-path mask), `useMagnetic` (magnetic button effect), and `usePageTransition` (the signature liquid-glass bloom transition with 5 layers + variant tints per destination). Re-exports the `gsap-utils` hooks. |

### Primitives (design-system atoms)

| File              | Description |
| ----------------- | ----------- |
| `primitives.tsx`  | `Eyebrow`, `DisplayHeading`, `SectionHeading`, `LuxuryButton` (gold gradient + ripple + magnetic + glow, variants solid/outline/ghost), `TextLink` (animated underline + arrow), `OrnamentDivider`, `SpiceLevel`, `VegBadge`. |

### Views

| File                 | Description |
| -------------------- | ----------- |
| `Home.tsx`           | The home page — a vertical narrative: Hero (video bg + parallax + headline reveal), Manifesto, Signature Dishes, Story, Philosophy, Banquet Cinema, Gallery Preview, Circular Gallery, Testimonials, Reservation CTA. Fetches categories, gallery, and featured testimonials on mount. |
| `MenuView.tsx`       | Cinematic header + sticky controls (desktop category pills + search + veg filter; mobile `OptionWheel`) + editorial single-column dish list. Clicking a dish opens `DishShowcase`. |
| `DishShowcase.tsx`   | Full-screen dish detail modal. Split layout: image gallery (zoom, thumbnails, fullscreen, swipe) on the left; staggered text reveal, ingredients, allergens, serving size, price, and related dishes on the right. Keyboard nav (Esc, ←/→). |
| `GalleryView.tsx`    | Cinematic header + filter pills (All/Food/Drinks/Interior/Events/Banquet) + CSS-columns masonry grid with hover captions + "Load More" + `Lightbox`. |
| `Lightbox.tsx`       | Fullscreen image viewer with prev/next, keyboard nav, title + caption, and a position indicator. |
| `OptionWheel.tsx`    | A vertical scroll-wheel category selector for mobile. Touch-drag + momentum + snap-to-center. Keyboard accessible. Respects reduced-motion. |
| `CircularGallery.tsx`| Infinite horizontal image carousel with drag + wheel + keyboard. Active slide scales to 1, others to 0.85. Dots indicator. |
| `ReservationView.tsx`| The 5-step reservation wizard (Date → Time → Guests → Details → Confirm) with directional slide transitions, validation, and a success state. POSTs to `/api/reservations`. |
| `AboutView.tsx`      | The restaurant's story — asymmetric parallax image, stats, philosophy pillars. |
| `BanquetView.tsx`    | Banquet capacity, description, feature grid, and imagery. |
| `CateringView.tsx`   | Catering packages (fetched from API) with feature lists and enquiry CTAs. |
| `HoursView.tsx`      | Operating hours, weekday vs weekend. |
| `ContactView.tsx`    | Contact details, socials, map placeholder, and a message form. |
| `LegalView.tsx`      | Privacy Policy and Terms of Service (rendered from a `kind` prop). |

---

## `src/components/admin/`

The admin dashboard. All files are client components.

| File                    | Description |
| ----------------------- | ----------- |
| `AdminApp.tsx`          | The admin shell. Renders the `LoginScreen` if unauthenticated, otherwise the sidebar + topbar + section content. Desktop sidebar is collapsible (persisted to localStorage). Mobile uses a slide-in drawer. Includes the `ChangePasswordModal`. |
| `ui.tsx`                | The admin design-system library, scoped to `.admin-root`: `AdminCard`, `StatCard`, `StatusBadge`, `AdminSectionTitle`, `AdminButton` (solid/subtle/ghost/danger), `AdminInput` (with icon/error/hint), `Modal`, `SearchableSelect`, `Toggle`, `ImageUploader` (drag&drop + preview + progress + URL mode), `Badge`, `Skeleton`, `EmptyState`, `ConfirmDialog`, and pagination controls. |
| `AdminOverview.tsx`     | Dashboard home. Stat cards (reservations today, pending, menu items, gallery, etc.), a 7-day reservations bar chart (Recharts), recent reservations list, quick actions, and menu category breakdown. |
| `AdminReservations.tsx` | Reservations table with status filter, search, status update (PENDING → CONFIRMED/CANCELLED/COMPLETED), delete, and a detail drawer. |
| `AdminMenu.tsx`         | Menu management — category CRUD + item CRUD with the full rich-field form (tagline, short description, price, multiple images via `ImageUploader`, ingredients/allergens tag inputs, spice, veg, featured, chef-recommended, serving size, availability). |
| `AdminGallery.tsx`      | Gallery image CRUD with `ImageUploader`, category, caption, and order. |
| `AdminTestimonials.tsx` | Testimonial CRUD with name, role, photo, rating, message, featured flag. |
| `AdminEvents.tsx`       | Event CRUD with title, description, date, image, published toggle. |
| `AdminCatering.tsx`     | Catering package CRUD with name, description, price, guests, image, features (pipe-separated). |
| `AdminSettings.tsx`     | Edit the singleton `SiteSettings` row — restaurant name, tagline, hero/about copy, contact details, hours, socials, banquet info, and meta tags. |

---

## `src/components/ui/`

The complete **shadcn/ui** component library (New York style, Lucide icons). These are
the unstyled-primitive building blocks used primarily by the admin dashboard. The public
site mostly uses its own `primitives.tsx` for a more bespoke look.

Includes (among others): `button`, `card`, `dialog`, `sheet`, `dropdown-menu`, `select`,
`table`, `tabs`, `form`, `input`, `textarea`, `label`, `checkbox`, `radio-group`,
`switch`, `slider`, `tooltip`, `popover`, `hover-card`, `accordion`, `carousel`,
`command`, `calendar`, `sonner`, `toast`, `toaster`, `badge`, `avatar`, `skeleton`,
`separator`, `scroll-area`, `progress`, `alert`, `alert-dialog`, `aspect-ratio`,
`breadcrumb`, `collapsible`, `context-menu`, `drawer`, `input-otp`, `menubar`,
`navigation-menu`, `pagination`, `resizable`, `sidebar`, `toggle`, `toggle-group`, and
`chart` (Recharts wrapper).

Configured via `components.json`:
```json
{ "style": "new-york", "baseColor": "neutral", "cssVariables": true, "iconLibrary": "lucide" }
```

---

## `src/lib/`

Core, framework-agnostic logic shared by client and server.

| File         | Description |
| ------------ | ----------- |
| `db.ts`      | The Prisma client singleton. Caches the instance on `globalThis` to survive hot-reload in dev. Exports `db`. |
| `auth.ts`    | Password hashing (`hashPassword`/`verifyPassword` with bcrypt + legacy scrypt fallback), JWT signing/verification (`signToken`/`verifyToken` — HS256, 12h expiry, `timingSafeEqual`), `getTokenFromRequest` (Bearer header → cookie fallback), and `requireAdmin(req)`. Exports the `AUTH_COOKIE` name (`bo_admin_token`). |
| `api.ts`     | Client-side typed fetch helpers: `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`, `apiUpload`. Each injects the admin JWT from the Zustand store as a `Bearer` header. `apiUpload` POSTs multipart form-data to `/api/upload`. |
| `store.ts`   | The Zustand store (`useApp`). Holds the current `view` (with hash sync) and the admin session (`adminToken`, `adminUser`, persisted to localStorage). Exports `hydrateAdmin()` to restore the session + apply the URL hash on mount. |
| `types.ts`   | Shared TypeScript types matching the Prisma models (`MenuCategory`, `MenuItem`, `GalleryImage`, `Reservation`, `Testimonial`, `EventItem`, `CateringPackage`, `SiteSettings`, `Stats`). Used by both client and API routes. |
| `images.ts`  | The curated image registry (`IMAGES` object grouping the 44 WebP paths by category) plus `HERO_IMAGE`, `ABOUT_IMAGE`, `BANQUET_IMAGE` constants. Used by components and the seed script. |
| `utils.ts`   | The `cn()` classname merge helper (`clsx` + `tailwind-merge`). |

---

## `src/hooks/`

| File           | Description |
| -------------- | ----------- |
| `use-mobile.ts`  | `useIsMobile()` — returns `true` when `window.innerWidth < 768`, reactive to resize. |
| `use-toast.ts`   | The Radix toast hook (used by the `Toaster` in the root layout). |

---

## `examples/`

| File            | Description |
| --------------- | ----------- |
| `websocket/server.ts`   | Reference WebSocket (Socket.io) mini-service. |
| `websocket/frontend.tsx`| Reference frontend client for the WebSocket demo. |

> The gateway requires cross-port requests to include `?XTransformPort=<port>` in the
> URL query. See `Caddyfile`.

---

## Configuration Files

| File                | Description |
| ------------------- | ----------- |
| `next.config.ts`    | Sets `output: "standalone"`, `typescript.ignoreBuildErrors: true`, `reactStrictMode: false`. |
| `tsconfig.json`     | TypeScript config with the `@/*` path alias → `./src/*`. |
| `eslint.config.mjs` | ESLint config extending `eslint-config-next`. |
| `tailwind.config.ts`| Tailwind config (CSS variables are defined in `globals.css`). |
| `postcss.config.mjs`| PostCSS with `@tailwindcss/postcss`. |
| `components.json`   | shadcn/ui config (New York style, neutral base, Lucide icons). |
| `Caddyfile`         | The gateway config exposing a single external port. |
| `.env`              | `DATABASE_URL=file:/home/z/my-project/db/custom.db` (and `ADMIN_JWT_SECRET` in production). |
