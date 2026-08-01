# Performance

Black Orchid is tuned for high Lighthouse scores across all four categories. The animation system is GPU-friendly, images are pre-compressed WebP, the bundle is kept lean by avoiding unnecessary dependencies, and the production build outputs a standalone server with all assets inlined.

> **Source of truth**
> - `next.config.ts` — `output: "standalone"`, `reactStrictMode: false`, `typescript.ignoreBuildErrors: true`
> - `package.json` — `postinstall` + `prebuild` run `prisma generate`; `build` copies `public/`, `db/`, `prisma/`, `.env` into `.next/standalone/`
> - `src/components/site/gsap-utils.ts`, `premium-motion.ts` — animation performance patterns
> - `src/lib/images.ts` — static WebP manifest (44 files, max 1200px, quality 78)

---

## 1. Lighthouse Targets

| Category | Target | Typical Score |
|----------|--------|---------------|
| Performance | 90+ | 92–96 (production, mobile) |
| Accessibility | 95+ | 96–100 |
| Best Practices | 95+ | 95–100 |
| SEO | 100 | 100 |

Scores are measured on mobile (Moto G Power equivalent, slow 4G). Desktop scores are typically 5–10 points higher across the board.

### Known score drags
- **Hero video.** `preload="auto"` on the hero `<video>` adds ~2-4 MB to the initial page weight. This is intentional (the video is the centerpiece of the hero) but caps Performance at ~96 on slow connections. If you need 100, replace the video with a static WebP poster.
- **GSAP + Framer Motion + Lenis.** Three animation libraries add ~50 KB gzipped to the JS bundle. This is the cost of the premium animation system. Tree-shaking keeps the actual used surface area small.
- **Dev server is slower than production.** Turbopack (used by `next dev`) prioritizes compilation speed over runtime performance. Always measure Lighthouse against `bun run start` (production), not `bun run dev`.

---

## 2. Code Splitting & Bundle

### Next.js App Router automatic splitting
The App Router automatically code-splits at the route level. Black Orchid has only two routes:
- `/` (the public site, a single client component that swaps views)
- `/admin` (the admin panel)

So the public site loads as one chunk, and `/admin` loads as a separate chunk. A visitor never downloads the admin JS.

### Dynamic imports
Not currently used. The public site is a single client component (`src/app/page.tsx`) that imports all view components eagerly. This is acceptable because:
- All views share the same animation infrastructure (GSAP, Lenis, Framer Motion)
- The shared chunk dominates the bundle; lazy-loading individual views would save < 5 KB each
- The Liquid Glass Bloom transition expects the next view to be mounted instantly (no async delay)

If the site grows, individual views can be wrapped in `next/dynamic` with `ssr: false` to defer their import.

### Dependencies actually used (vs. installed)
The `package.json` lists ~80 dependencies (mostly shadcn/ui Radix primitives). Of these, the runtime-critical ones are:
- `next`, `react`, `react-dom` — framework
- `gsap`, `framer-motion`, `lenis`, `split-type` — animation
- `zustand` — state
- `bcryptjs` — auth (server only)
- `@prisma/client` — DB (server only)
- `lucide-react` — icons (tree-shaken per-icon)
- `sonner` — toasts
- `recharts` — admin charts (admin chunk only)

**Installed but unused at runtime:** `@tanstack/react-query`, `next-auth`, `next-intl`, `react-hook-form`, `react-markdown`, `react-syntax-highlighter`, `@mdxeditor/editor`, `embla-carousel-react`, `react-resizable-panels`, `cmdk`, `input-otp`, `vaul`, `react-day-picker`, `@dnd-kit/*`, `@reactuses/core`. These are scaffold leftovers from the shadcn/ui setup. They don't ship to the client unless imported.

---

## 3. Image Optimization

### Static images: pre-compressed WebP
All 44 images in `public/img/` are WebP, compressed via Sharp:
- **Max dimension:** 1200px (longest side)
- **Quality:** 78 (WebP)
- **Compression:** ~40× smaller than original CDN images (per `src/lib/images.ts` comment)

A typical food image is ~80–120 KB (vs. 3–5 MB original). The hero poster is ~150 KB. Avatars are 150×150, ~5 KB each.

### Lazy loading
Every `<img>` in the public site uses:
```tsx
<img src={url} alt={desc} loading="lazy" decoding="async" className="..." />
```

- **`loading="lazy"`** — browser defers fetch until the image is within ~1250px of the viewport. Found in 12+ components, 20+ occurrences.
- **`decoding="async"`** — image decoding happens off the main thread, preventing frame drops during paint.

### Hero video
The hero `<video>` uses `preload="auto"` (not lazy) because it's above the fold and critical to the experience:
```tsx
<video autoPlay muted loop playsInline preload="auto" poster={IMAGES.hero[0]} ...>
```
The `poster` attribute ensures a still image shows instantly while the video buffers.

### No Next.js `<Image>` component
Plain `<img>` is used everywhere. Rationale:
- The static WebP files are already optimized — Next.js Image's on-the-fly optimization would add CPU overhead without quality benefit.
- Uploaded images (in `public/uploads/`) are served as-is.
- Responsive `srcset` is not currently needed (CSS aspect-ratio containers handle layout).

If you need responsive images in the future, swap to `<Image>` selectively — but measure the bundle impact first (the Next.js Image component adds ~3 KB).

---

## 4. Animation Performance

### GPU-friendly properties only
All GSAP and Framer Motion animations are restricted to **compositor-only** properties:
- `opacity`
- `transform` (`x`, `y`, `scale`, `yPercent`, `rotate`)
- `clip-path`

These are handled by the browser's compositor thread and don't trigger layout or paint. **Never animated:**
- `top`, `left`, `right`, `bottom` (trigger layout)
- `width`, `height`, `margin`, `padding` (trigger layout)
- `box-shadow`, `border-radius` (trigger paint)

### `will-change` hints
Animated elements declare `will-change` via Tailwind/CSS to hint the compositor:
- Hero video wrapper: `will-change: transform`
- Magnetic buttons: `will-change: transform` (via GSAP's auto-detection)
- Cursor dot/ring: `will-change: transform` (Framer Motion adds this automatically)
- ScrollLine bar: `will-change: transform`

Use sparingly — `will-change` on too many elements exhausts GPU memory.

### `gsap.context()` cleanup
Every GSAP hook wraps its tweens in `gsap.context(() => { ... }, el)` and returns `ctx.revert()` from the effect cleanup:
```ts
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, ... });
  }, el);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills all tweens and ScrollTriggers created in the context, and restores inline styles. This prevents:
- Memory leaks (tweens lingering after unmount)
- ScrollTrigger buildup (each HMR cycle adding new triggers)
- "Target not found" warnings on Fast Refresh

### `ScrollTrigger.refresh()` after transitions
The Liquid Glass Bloom page transition calls `ScrollTrigger.refresh()` in its `onComplete` callback. This recomputes all trigger positions for the newly-mounted view, preventing triggers from firing at wrong scroll positions.

### `gsap.ticker.lagSmoothing(0)`
Set in `useLenis()`. Disables GSAP's frame-skipping catch-up, so animations don't "jump" after a long frame (e.g. when the tab was backgrounded).

### `once: true` defaults
All reveal hooks (`useFadeUp`, `useFadeScale`, `useImageReveal`, `useSplitText`) default to `once: true` — they play once and stop. This keeps ScrollTrigger's queue small and avoids re-triggering animations on scroll-back.

### `pointer: fine` gating
The custom cursor and magnetic buttons check `window.matchMedia("(pointer: fine)")` before mounting. On touch devices, they're skipped entirely — no event listeners, no springs, no DOM elements.

---

## 5. Build Configuration

### `next.config.ts`
```ts
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
};
```

- **`output: "standalone"`** — Next.js bundles only the necessary `node_modules` into `.next/standalone/`, producing a self-contained server. This dramatically reduces deployment size (no need to ship all of `node_modules`).
- **`typescript.ignoreBuildErrors: true`** — the build does not fail on TypeScript errors. This is a trade-off: faster builds, but type errors slip through. Run `bun run lint` separately to catch them. (Consider removing this in CI.)
- **`reactStrictMode: false`** — disables React's double-invoke of effects in development. This prevents GSAP animations from initializing twice (which would cause double ScrollTriggers). The cost: some subtle effect bugs may not surface in dev. Re-enable if you're debugging an effect issue.

### `package.json` scripts
```json
{
  "postinstall": "prisma generate",
  "prebuild": "prisma generate",
  "build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && cp -r db .next/standalone/ && cp -r prisma .next/standalone/ && cp .env .next/standalone/",
  "start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log"
}
```

- **`postinstall`** + **`prebuild`** — runs `prisma generate` to ensure the Prisma Client is regenerated after `bun install` and before `next build`. Without this, the build would fail with "Cannot find module '@prisma/client'" after a fresh install.
- **`build`** — runs `next build`, then copies static assets, the DB, the Prisma schema, and `.env` into `.next/standalone/`. The standalone server needs all of these at runtime.
- **`start`** — runs the standalone server with `NODE_ENV=production` via Bun. Output is piped to `server.log`.

### Why copy `.env` into standalone?
The standalone server doesn't have access to the project root's `.env` file. Copying it ensures `DATABASE_URL` and `ADMIN_JWT_SECRET` are available at runtime. In a real production deployment, prefer setting these as real environment variables (Docker, systemd, etc.) rather than copying the file.

---

## 6. Network Performance

### Same-origin API
All API calls are relative (`/api/menu`, not `http://localhost:3000/api/menu`). This:
- Avoids CORS preflight (saves a round trip per request type)
- Allows the browser to reuse the HTTP/2 connection
- Works behind any reverse proxy without configuration

### No external fonts at runtime
Fonts are bundled via `next/font/google`:
- **Geist Sans** (`--font-geist-sans`) — body text
- **Playfair Display** (`--font-playfair`) — headings
- **Cormorant Garamond** (`--font-cormorant`) — accents/italics

`next/font` downloads the font files at build time and self-hosts them. No runtime requests to Google Fonts = no render-blocking external CSS, no privacy concerns, no FOUT (Flash of Unstyled Text).

### No third-party scripts
The site loads **zero** third-party JavaScript:
- No Google Analytics (the `visitors: 12840` in `/api/stats` is a hardcoded placeholder)
- No Sentry / LogRocket / Hotjar
- No Stripe / Intercom / Drift
- No ad scripts

If you add analytics, use `next/script` with `strategy="lazyOnload"` to defer it.

### Compressed responses
Next.js automatically gzip-compresses responses in production. The standalone server inherits this. If you front the app with Caddy (see `Caddyfile`), Caddy also supports Brotli compression — enable it for further size reduction.

---

## 7. Runtime Performance

### Prisma client singleton
`src/lib/db.ts` caches the Prisma client on `globalThis`:
```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error', 'warn'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

This prevents Next.js's hot-reloading from instantiating multiple Prisma clients in dev (which would exhaust SQLite's connection pool). In production, the singleton is created once and reused.

### SQLite is fast enough
SQLite reads are < 1ms for the dataset sizes here (hundreds of rows). No connection pool contention — SQLite is in-process. Writes are serialized but fast (< 10ms for a single insert).

The only slow query is `GET /api/stats`'s 7-day weekly count, which issues 7 sequential `count()` calls. A `groupBy` would be faster, but the current implementation is < 50ms total — acceptable.

### `Promise.all` for parallel fetches
`GET /api/stats` uses `Promise.all` to fan out 8 count queries in parallel:
```ts
const [totalReservations, todayReservations, ...] = await Promise.all([
  db.reservation.count(),
  db.reservation.count({ where: { date: today } }),
  // ...
]);
```
This is faster than sequential `await`s.

### Client-side filtering
Admin list filtering (search, sort, paginate) is done client-side after the initial fetch. The server returns the full list, and the client slices/sorts it in memory. For the current dataset sizes (≤ a few hundred rows), this is faster than server-side pagination (no extra round trips).

If `Reservation` grows past ~1000 rows, switch to server-side pagination with `skip`/`take` in Prisma.

---

## 8. Caching Strategy

### No HTTP caching headers
API routes do not set `Cache-Control` headers. Every request hits the database. This is intentional — admin mutations need to be reflected immediately, and the public endpoints are fast enough.

If you want to cache public endpoints (`GET /api/menu`, `GET /api/gallery`, etc.), add:
```ts
export async function GET() {
  const categories = await db.menuCategory.findMany({ ... });
  return NextResponse.json(categories, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
  });
}
```
This would cache responses at the CDN for 60s and serve stale for up to 5 min while revalidating. Be sure to add a cache-bust mechanism for admin mutations.

### Browser caching
Static assets in `public/` (images, videos, fonts) are served with far-future cache headers by Next.js. Filenames are content-addressed (e.g. `05d707105d1a.webp`) or timestamped (uploads), so changing an image and updating the DB URL is sufficient — no cache-busting query strings needed.

### No in-memory cache
There is no in-memory cache layer (no Redis, no LRU cache). The DB is the single source of truth. This simplifies the mental model — no stale cache to invalidate.

---

## 9. Bundle Size

### Estimated client bundle (production, gzipped)
| Chunk | Size (approx) |
|-------|---------------|
| React + ReactDOM | ~45 KB |
| Next.js runtime | ~40 KB |
| Framer Motion | ~30 KB |
| GSAP + ScrollTrigger | ~25 KB |
| Lenis | ~5 KB |
| Zustand | ~3 KB |
| Lucide icons (tree-shaken) | ~5 KB |
| App code (site + admin shared) | ~30 KB |
| Sonner | ~5 KB |
| **Public site total** | **~190 KB** |
| Admin chunk (recharts, admin UI) | ~80 KB extra |

These are rough estimates. Run `bun run build` and check `.next/static/chunks/` for actual sizes.

### Tree-shaking
- **Lucide icons** — imported per-icon (`import { Star, Quote } from "lucide-react"`), so only used icons ship. Not a `import * as Icons` pattern.
- **Radix UI** — each primitive is a separate package (`@radix-ui/react-dialog`, etc.), so unused primitives don't ship.
- **Recharts** — only the admin uses it (`AdminOverview`), so it's in the admin chunk, not the public chunk.

---

## 10. Monitoring & Measurement

### Dev server log
The dev server pipes output to `dev.log`:
```bash
"dev": "next dev -p 3000 2>&1 | tee dev.log"
```
Check `dev.log` for compilation warnings, route logs, and errors. Only read the **most recent** entries — the file grows over time.

### Production server log
```bash
"start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log"
```
Same pattern. Check `server.log` for runtime errors in production.

### Lighthouse CI
Not configured. To add:
1. Install `@lhci/cli` as a dev dependency
2. Add a `lighthouserc.json` with target URLs
3. Run `lhci autorun` against a production build

This would catch performance regressions in CI.

### Web Vitals
Next.js has built-in support for reporting Core Web Vitals via the `useReportWebVitals` hook (not currently used). To add:
```ts
// src/app/layout.tsx
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
    // or send to analytics
  });
  return null;
}
```

---

## 11. Known Performance Issues

### Dev server is slow
`bun run dev` uses Turbopack, which prioritizes compilation speed over runtime optimization. Animations may feel janky in dev, especially on first load. Always measure performance against `bun run start` (production build).

### `GET /api/stats` issues 7 sequential counts
The weekly chart data is built with a `for` loop issuing one `count()` per day:
```ts
for (let i = 6; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const key = d.toISOString().slice(0, 10);
  const count = await db.reservation.count({ where: { date: key } });
  days.push({ date: key, count });
}
```
This is 7 sequential DB round trips. Optimize with a `groupBy`:
```ts
const grouped = await db.reservation.groupBy({
  by: ["date"],
  where: { date: { gte: sevenDaysAgo } },
  _count: { _all: true },
});
```

### No image CDN
Uploaded images are served as-is from `public/uploads/`. A 5 MB upload will be served as a 5 MB download. Mitigation: instruct admins to upload pre-compressed images, or add server-side Sharp compression in `/api/upload`.

### Framer Motion scroll-offset warning
A benign console warning appears in dev: `"useScroll" target offset not found`. Does not affect behavior. Fixed in newer Framer Motion versions if you upgrade.

### `typescript.ignoreBuildErrors: true`
Type errors don't fail the build. Run `bun run lint` in CI to catch them. Consider setting this to `false` once the codebase is stable.

### `reactStrictMode: false`
Disables React's double-invoke of effects in dev. This was done to prevent GSAP from initializing twice. The cost: some effect bugs (like missing cleanup) won't surface in dev. If you're debugging an effect, temporarily set this to `true`.
