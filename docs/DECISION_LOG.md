# Decision Log

This document records **why** each major technical decision was made for the
Black Orchid project. It exists so future agents and maintainers don't undo a
decision without understanding the reasoning behind it.

Every entry follows the same format:

> **Decision:** what was chosen.
> **Alternatives considered:** what was on the table.
> **Reasoning:** why this won.
> **Trade-offs / known limitations:** what we gave up.
> **Roadmap:** if there's a plan to revisit, when.

---

## 1. Framework: Next.js 16 App Router

**Decision:** Next.js 16 with the App Router.

**Alternatives considered:**
- Next.js Pages Router (legacy)
- Remix
- Plain Vite + React + a separate Express API

**Reasoning:**
- App Router gives us SSR, API routes, and static export in one framework —
  no separate backend to deploy.
- App Router (over Pages) for modern patterns: nested layouts, server
  components, streaming. Next.js 16 is the current stable line and gets the
  newest React features.
- `output: "standalone"` produces a self-contained `.next/standalone/` folder
  that bundles `node_modules`, the Prisma client, and the DB file — trivial to
  ship as a single deployable.

**Trade-offs:** App Router is still newer than Pages; some third-party libs
have rough edges. We work around this by marking client-only code with
`"use client"`.

**Roadmap:** None. This is foundational.

---

## 2. Language: TypeScript 5

**Decision:** TypeScript throughout, strict mode.

**Alternatives considered:** Plain JavaScript.

**Reasoning:**
- Type safety catches a large class of runtime errors at compile time.
- Editor autocomplete and inline documentation are dramatically better.
- Required for Prisma — the generated client is fully typed and we'd be
  throwing away its main benefit by using JS.
- The shared types in `src/lib/types.ts` form a contract between the API and
  the admin UI; without TS this contract is implicit and brittle.

**Trade-offs:** Slightly more verbose; type definitions must be maintained.

**Roadmap:** None.

---

## 3. Styling: Tailwind CSS 4

**Decision:** Tailwind CSS 4 with shadcn/ui (New York style).

**Alternatives considered:**
- Tailwind 3
- CSS Modules
- Styled Components / Emotion

**Reasoning:**
- Utility-first = fast iteration. No context-switching between JSX and CSS
  files; the styling lives next to the markup.
- Tailwind 4 has native CSS variables (no `tailwind.config.js` needed for
  theming), faster builds, and a smaller dev footprint.
- shadcn/ui gives us copy-pasteable, accessible, Radix-based components we
  fully own — no library to be abandoned by its maintainer.
- Consistent design tokens (`bg-background`, `text-gold`, `border`) enforced
  by the theme — designers and AIs produce visually consistent output.

**Trade-offs:** Class strings get long. We mitigate with the `cn()` helper
and component extraction.

**Roadmap:** None.

---

## 4. ORM: Prisma

**Decision:** Prisma Client + `prisma db push` for schema sync.

**Alternatives considered:**
- Drizzle
- Raw `better-sqlite3`
- Sequelize

**Reasoning:**
- Schema-first design: the `schema.prisma` file is the single source of
  truth. Easy to read, easy to diff.
- Fully typed client generated from the schema — no manual type defs.
- `db:push` applies schema changes instantly without writing migration files,
  which suits the rapid-iteration phase we're in.
- Excellent DX: autocomplete on every model, relation, and field.

**Trade-offs:** `db:push` is not safe for production data preservation —
destructive changes drop columns. For production we should switch to
`prisma migrate`.

**Roadmap:** Adopt `prisma migrate` before production launch.

---

## 5. Database: SQLite (not PostgreSQL)

**Decision:** SQLite via `prisma/sqlite` provider, file at `db/custom.db`.

**Alternatives considered:**
- PostgreSQL (via Prisma)
- MySQL
- MongoDB

**Reasoning:**
- **Simplicity.** No external DB server to install, configure, or keep
  alive. The DB is a single file on disk.
- **Portability.** The file ships inside `.next/standalone/` after build, so
  the production server is a single self-contained artifact.
- **Adequate for the workload.** A restaurant website has low write
  concurrency — mostly reads (menu, gallery) with occasional writes
  (reservations, admin edits). SQLite handles this easily.
- **Zero ops.** No backups of a separate DB server to worry about; just copy
  the file.

**Trade-offs:**
- Not suitable for high-concurrency writes (single writer at a time).
  Acceptable today; would not be acceptable for, say, a ticketing platform.
- No built-in replication / failover.
- Prisma's SQLite support lacks some Postgres features (e.g. JSON columns —
  we work around this by storing JSON as strings, see `MenuItem.images`,
  `MenuItem.ingredients`, `MenuItem.allergens`).

**Roadmap:** Migrate to PostgreSQL before scaling beyond a single restaurant
location or adding multi-tenant features.

---

## 6. State Management: Zustand (not Redux)

**Decision:** Zustand for client state (view routing, admin auth).
TanStack Query is available but not yet heavily used.

**Alternatives considered:**
- Redux Toolkit
- Jotai
- React Context only

**Reasoning:**
- Zustand is ~1 KB, has no boilerplate, and the API is trivial:
  `create((set) => ({ ... }))`.
- Our client state is genuinely small: current view + admin user/token. Redux
  would be overkill.
- The store lives in `src/lib/store.ts` — a single file, easy to reason about.

**Trade-offs:**
- No built-in devtools middleware (Redux Toolkit has this). Acceptable for
  our scope.
- No time-travel debugging. Acceptable.

**Roadmap:** None. If server state grows (caching, optimistic updates),
adopt TanStack Query more broadly — it's already a dependency.

---

## 7. Animation: GSAP + Framer Motion (not pure Framer)

**Decision:** GSAP for scroll-triggered and timeline animations;
Framer Motion kept for component-level animations (AnimatePresence, layout,
hover).

**Alternatives considered:**
- Pure Framer Motion
- Pure GSAP
- Anime.js

**Reasoning:**
- GSAP's `ScrollTrigger` API is significantly more capable than Framer
  Motion's `useScroll` / `useTransform`. Scrub animations, pinning, and
  snapping are first-class.
- GSAP timelines give precise control over multi-step sequences (the liquid
  glass transition is a 7-step timeline).
- Framer Motion is better at React-idiomatic component transitions
  (`AnimatePresence` for mount/unmount, `layout` for reflows). Trying to do
  these in GSAP is awkward.
- Using both = best of both worlds. They don't conflict if scoped correctly
  (`gsap.context()` + Framer's `motion.div`).

**Trade-offs:** Two animation libs = larger bundle (~50 KB gzipped combined).
Worth it for a luxury site where motion is the brand.

**Roadmap:** None.

---

## 8. Smooth Scroll: Lenis

**Decision:** Lenis for momentum-based smooth scrolling, synced with GSAP
ScrollTrigger.

**Alternatives considered:**
- Native CSS `scroll-behavior: smooth`
- No smooth scroll
- Locomotive Scroll

**Reasoning:**
- Native smooth scroll feels janky on luxury sites — instant and robotic.
- Lenis provides buttery momentum-based scrolling without hijacking the
  scroll (anchor links, keyboard, and touch all still work).
- Lenis has a tiny API and explicit integration with GSAP ScrollTrigger via
  `lenis.on("scroll", ScrollTrigger.update)` + the GSAP ticker.
- Locomotive Scroll is heavier and its ScrollTrigger integration is more
  fragile.

**Trade-offs:** Adds ~5 KB. Disabled on `prefers-reduced-motion`.

**Roadmap:** None.

---

## 9. Auth: Custom JWT (not next-auth)

**Decision:** Custom JWT implementation (HS256, 12h expiry) in
`src/lib/auth.ts`. httpOnly cookie + `Authorization` header + localStorage.

**Alternatives considered:**
- NextAuth.js v4 (already a dependency)
- Lucia
- Clerk / Auth0 (managed)

**Reasoning:**
- **Simpler.** NextAuth is powerful but its configuration surface is large
  and its session strategy opaque. For a single admin user with no OAuth
  providers, a 60-line JWT helper is enough.
- **Full control.** We control the token payload (`sub`, `email`, `role`,
  `exp`), the cookie name, the expiry, and the verification logic. No
  surprises.
- **No OAuth complexity.** The restaurant has one admin. There is no
  user-facing account system. OAuth would be dead weight.

**Trade-offs:**
- No built-in session management (we hand-roll cookie + localStorage).
- No refresh tokens — when the 12h JWT expires, the user re-logs in.
  Acceptable for an admin tool.
- No built-in CSRF protection on the cookie path. We rely on `SameSite=Lax`
  + the fact that all writes also check the `Authorization` header (which a
  CSRF attacker cannot read).

**Roadmap:** If user accounts are added (e.g. customer reservations with
login), evaluate NextAuth at that point.

---

## 10. Password Hashing: bcrypt (not scrypt / argon2)

**Decision:** bcrypt with 12 rounds (`BCRYPT_ROUNDS = 12` in
`src/lib/auth.ts`). scrypt kept for backward compatibility.

**Alternatives considered:**
- scrypt (the project's original choice)
- argon2id (the current OWASP recommendation)

**Reasoning:**
- The user explicitly requested bcrypt during the auth refactor.
- 12 rounds is a good balance: ~250 ms to verify on commodity hardware, well
  above OWASP's minimum of 10.
- `bcryptjs` is a pure-JS implementation — no native compilation, works in
  any environment (including serverless).
- Backward compatibility: `verifyPassword()` detects legacy scrypt hashes
  (format `salt:hexhash`) and falls back to `verifyScryptLegacy()`. Existing
  admins aren't locked out.

**Trade-offs:**
- argon2id would be marginally more resistant to GPU attacks. For an admin
  tool with one user, this is academic.
- Legacy scrypt hashes are NOT auto-upgraded to bcrypt on login. They keep
  verifying via scrypt until the user changes their password.

**Roadmap:** Auto-upgrade scrypt hashes to bcrypt on next successful login
(low priority — only the seeded admin uses scrypt, and the password is
known).

---

## 11. Image Storage: Disk (not Base64 / cloud)

**Decision:** Uploaded files are written to `public/uploads/` on disk. Only
the URL string is stored in the database.

**Alternatives considered:**
- Base64 in the DB
- S3 / Cloudflare R2 / Vercel Blob
- Base64 in localStorage (yikes)

**Reasoning:**
- The user explicitly required "no Base64 in the database" — Base64 bloats
  the DB, can't be indexed, and makes dumps unwieldy.
- Disk is the simplest possible solution: no SDK, no credentials, no network
  failures. The file path IS the URL.
- Next.js serves `public/` statically, so the uploaded image is immediately
  accessible at `/uploads/<filename>` with no extra config.

**Trade-offs:**
- **No CDN.** Images are served from the origin server. Fine for a single
  restaurant; bad at scale.
- **Files lost on serverless redeploy.** Vercel / Netlify ephemeral
  filesystems wipe `public/uploads/` on every deploy. This project is
  designed to run on a persistent VM (see `start-dev.sh` and the standalone
  build), so this is acceptable.
- **No image processing on upload.** Files are saved as-is. If an admin
  uploads a 10 MB photo, it stays 10 MB. The static seed images are
  pre-compressed to WebP (see §13), but user uploads are not.

**Roadmap:** Add cloud storage (R2 / S3) before production launch. The
`apiUpload()` contract can stay the same — only the server-side
implementation changes.

---

## 12. Page Transitions: Liquid Glass

**Decision:** A custom 7-layer "liquid glass" page transition with gold
bloom, a logo moment, and a dynamic origin point based on the clicked
element.

**Alternatives considered:**
- Framer Motion `AnimatePresence` with a simple fade
- Next.js View Transitions API
- No transition (instant view swap)

**Reasoning:**
- **Brand identity.** The transition IS the Black Orchid experience. The
  client wanted the website itself to feel like walking through the
  restaurant's doors. A fade is forgettable; the liquid glass is
  unforgettable.
- The transition uses GSAP timelines for precise control over the 7 layers
  (glass shards, gold bloom, logo, content fade, etc.).
- The origin point is computed from the clicked element's bounding rect, so
  the transition feels like it emanates from the user's action — not a
  generic screen-wide effect.

**Trade-offs:**
- Adds ~600 ms to every navigation. Acceptable for a luxury site; would be
  unacceptable for, say, an e-commerce catalog.
- The 7-layer stack is GPU-intensive on low-end devices. We disable it on
  `prefers-reduced-motion` and on small viewports if needed.

**Roadmap:** None — this is core to the brand.

---

## 13. ScrollStack Removal

**Decision:** Removed the `ScrollStack` component (pin-based card stacking)
and replaced it with a simple GSAP fade-up grid.

**Alternatives considered:**
- Keep ScrollStack and fix the bugs
- Replace with a different pin library

**Reasoning:**
- ScrollStack used GSAP `ScrollTrigger.pin` to stack cards on top of each
  other as the user scrolled. On paper this looks cinematic.
- In practice it caused three showstopping bugs:
  1. Large blank sections appeared between cards on short-content pages
     (the pin created dead scroll distance).
  2. Layout was inconsistent across viewports — what stacked beautifully on
     desktop broke on tablet and was unusable on mobile.
  3. Debugging was nearly impossible because the pin logic fought with
     Lenis's scroll position and React's render cycle.
- The simple fade-up grid is stable, predictable, and looks 90% as good with
  10% of the complexity.

**Trade-offs:** Less "wow" than pin-stacking. Acceptable.

**Roadmap:** None. If a cinematic stacking effect is desired in the future,
build it as a bespoke full-viewport section (not a reusable component) so
the layout is fully controlled.

---

## 14. Static Images: Local WebP (not remote CDN)

**Decision:** All seed/static images are downloaded from the CDN, compressed
to WebP via `sharp`, and served locally from `public/img/`.

**Alternatives considered:**
- Reference the CDN URLs directly
- Use `next/image` with remote loader

**Reasoning:**
- The CDN had 1.2 s TTFB and ~1.9 MB per file. On a luxury site, that's a
  brand-killing load time.
- Local WebP files: 2 ms TTFB and ~50 KB per file. **~1000× faster, ~40×
  smaller.**
- `sharp` compression: max dimension 1200 px, quality 78. Visually
  indistinguishable from the originals at typical viewing sizes.
- No dependency on the CDN's uptime.

**Trade-offs:**
- 44 WebP files (~2 MB total) ship in the repo. Acceptable for a single-site
  project; would not be acceptable for a multi-tenant platform.
- Re-compressing requires running the script manually if CDN originals
  change. Not a common operation.

**Roadmap:** User-uploaded images (in `public/uploads/`) are NOT currently
compressed. Add an on-upload `sharp` pass before persistence.

---

## 15. Admin Buttons: Always-Visible (not hover-only)

**Decision:** Admin "Edit" / "Delete" buttons are always visible on every
card in the admin panel, not revealed on hover.

**Alternatives considered:**
- Hover to reveal (more "designy")

**Reasoning:**
- The original hover-only implementation caused a flood of "Edit does
  nothing" bug reports from the restaurant staff. The buttons were
  invisible on touch devices (no hover state) and easy to miss on desktop.
- Making them always-visible is a 10% visual cost for a 100% usability gain.
  The admin panel is a tool, not a showcase — clarity beats minimalism here.

**Trade-offs:** Slightly more visual clutter in the admin UI. Acceptable.

**Roadmap:** None.

---

## 16. `ignoreBuildErrors: true` in `next.config.ts`

**Decision:** `typescript: { ignoreBuildErrors: true }` is set in
`next.config.ts`.

**Alternatives considered:**
- `false` (fail build on any TS error)
- `true` only in dev, `false` in production via env

**Reasoning:**
- During rapid development (multiple agents touching the codebase), type
  errors are common and often non-fatal (a missing prop on an internal
  component, an `any` leak). Failing the build on every error slows
  iteration to a crawl.
- `ignoreBuildErrors: true` lets the build succeed so we can ship and test
  the runtime behavior, then fix types in a dedicated pass.

**Trade-offs:**
- Real type errors are not caught at build time. They surface at runtime as
  `undefined is not a function` or silently broken behavior.
- This is a **deliberate dev-mode trade-off**, not a permanent stance.

**Roadmap:** Set to `false` (or env-gated) before production launch. Run
`bunx tsc --noEmit` in CI to catch type errors outside the build.

---

## Related

- [TECH_STACK.md](./TECH_STACK.md) — the full stack at a glance.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the pieces fit together.
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — unresolved problems (not decisions).
- [ROADMAP.md](./ROADMAP.md) — what's planned next.
