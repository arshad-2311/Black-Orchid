# Project Memory

The important decisions that shaped Black Orchid, and the lessons learned from each.
**Read this before changing anything documented here** — the decision was made on purpose.

> Each entry follows the pattern: **Decision → Why → Trade-off → Status**.

---

## 1. SQLite chosen for simplicity (roadmap: PostgreSQL)

### Decision
Use SQLite (via Prisma) as the database, stored as a single file at `db/custom.db`.

### Why
- **No external database server to install, configure, or operate.** The whole data layer is one file.
- **Zero-cost local development.** No Docker, no Postgres binary, no connection string to manage.
- **Trivial backups.** Copy the file.
- **Sufficient for a single-server restaurant website** with modest traffic (< 100 reservations/day).

### Trade-off
- **Write concurrency is serialised.** Under high write load, SQLite returns `SQLITE_BUSY`.
- **No horizontal scaling.** Multiple app servers can't share a file-based DB.
- **No native array type.** The schema uses `String @default("[]")` for JSON arrays, requiring `JSON.parse`/`JSON.stringify` in the API routes.

### Status
✅ Final for the current scope. 📋 PostgreSQL migration is on the [roadmap](./ROADMAP.md) for when concurrency or multi-instance deployment becomes a real need.

---

## 2. Zustand for client state (lighter than Redux)

### Decision
Use **Zustand** (`src/lib/store.ts`) for all client-side state: the current view, admin session, etc.

### Why
- **Minimal boilerplate.** A store is defined in ~10 lines vs. Redux's actions/reducers/selectors.
- **Sufficient for this app.** The state is tiny: `view` (string), `adminUser` (object), `adminToken` (string).
- **No provider wrapper needed.** `useApp()` can be called from anywhere.
- **SSR-safe.** Zustand handles hydration gracefully.

### Trade-off
- **No built-in devtools** (Redux DevTools is more powerful). Zustand has a devtools middleware, but it's not enabled here.
- **No opinionated patterns.** Team discipline is required to keep the store clean.

### Status
✅ Final. TanStack Query is installed for server state (cache, invalidation) but is not yet wired up — the current `apiGet`/`apiPost` helpers in `src/lib/api.ts` are sufficient.

---

## 3. GSAP over pure Framer Motion for scroll animations

### Decision
Use **GSAP + ScrollTrigger** for scroll-driven animations (fade-up, parallax, image reveal, text split). Use **Framer Motion** only for component-level animations (modals, list transitions, layout animations).

### Why
- **ScrollTrigger is best-in-class.** Pinning, scrubbing, snap points, container tracking — Framer Motion's `useScroll` is a weaker subset.
- **`gsap.context()` enables clean cleanup.** One `revert()` call kills all tweens and ScrollTriggers created within the context.
- **SplitType + GSAP** is the standard recipe for word-by-word text reveals.
- **Performance.** GSAP is highly optimised for transform/opacity animations.

### Trade-off
- **Two animation libraries** = larger bundle. Both are tree-shakeable, but the combined weight is ~80KB gzipped.
- **Two mental models.** Developers must learn when to use which. (Rule of thumb: scroll = GSAP, component lifecycle = Framer Motion.)
- **HMR warnings.** GSAP "target not found" on Fast Refresh is benign but noisy. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §2.

### Status
✅ Final. The split is documented in [CODING_STANDARDS.md](./CODING_STANDARDS.md) §6.

---

## 4. ScrollStack removed, replaced with simple GSAP fade-up grid

### Decision
An earlier "ScrollStack" component (a pinned, scroll-driven horizontal card stack on the Home page) was **removed** and replaced with a simple grid of `useFadeUp` reveals.

### Why
- **Layout bugs.** ScrollTrigger pinning caused layout shifts, overlap with the footer, and broken scroll positions on mobile Safari.
- **Mobile UX.** The pinned-stack pattern is janky on touch devices — the scroll hijacking fights the user's gesture.
- **Maintenance cost.** The component was complex, fragile, and the source of repeated bug reports.

### Trade-off
- **Less "wow" factor.** The fade-up grid is more conventional.
- **Gained reliability.** The Home page now scrolls predictably on every device.

### Lesson learned
> **Pin-based scroll animations cause layout bugs.** Avoid `ScrollTrigger.create({ pin: true })` on long pages. Use scrub-based parallax (`scrub: true` without pin) instead — it moves elements without trapping the scroll position.

### Status
✅ Final. The ScrollStack pattern is not to be reintroduced. If a cinematic horizontal section is desired, use `CircularGallery` (which is a self-contained horizontal scroller, not a pinned ScrollTrigger).

---

## 5. Images compressed to local WebP (not served from a CDN)

### Decision
Compress all curated images to WebP (max 1200px, quality 78) using Sharp, and store them locally in `public/img/`. Do not use a CDN.

### Why
- **~40× smaller** than the original CDN-sourced images (per the comment in `src/lib/images.ts`).
- **~1000× faster TTFB** vs. fetching from a remote CDN on every page load.
- **No external dependency.** The site works offline (once cached).
- **No CDN bill.**
- **Cacheable by the browser** as static assets with `Cache-Control: immutable`.

### Trade-off
- **Larger git repository.** 44 WebP files (~2–3 MB total) are version-controlled.
- **No responsive `srcset`.** Each image is one size (1200px max). On a 320px phone, the browser downscales. Acceptable for this design.
- **Manual compression step.** New images must be compressed before being added. (Could be automated via a pre-commit hook — not yet done.)

### Status
✅ Final. The 44 static WebP files + 2.4 MB hero video are the asset budget. New images follow the same pipeline.

---

## 6. Liquid glass page transition chosen over simple fade

### Decision
The view-to-view transition is a multi-phase "liquid glass bloom" — a dark glass circle expands from the click origin, a gold radial bloom + reflection streak sweep across, a brief "Black Orchid" wordmark appears, then the glass retracts to reveal the new view.

### Why
- **Brand identity.** The transition *is* the brand. It signals "you are entering a curated space" — the same feeling as a maître d' drawing a curtain.
- **Context-aware.** The transition's tint and bloom colour shift based on the destination view (menu = warm brown, gallery = cooler, reservation = warmer gold).
- **Origin-aware.** The bloom expands from where the user clicked, tying the interaction to the visual response.

### Trade-off
- **~0.85s per transition.** Slower than a 200ms fade. This is intentional — the transition is a moment, not a delay.
- **DOM manipulation.** The transition creates and removes 5 absolutely-positioned divs per navigation. Cleanup is critical (handled by `gsap.timeline().onComplete` → `container.remove()`).
- **Reduced-motion fallback.** If `prefers-reduced-motion: reduce`, the transition is skipped entirely and the callback fires immediately.

### Status
✅ Final. Do not replace with a simple fade. Do not remove the wordmark moment. Refinements to timing/easing are OK; structural changes are not.

---

## 7. bcrypt over scrypt (scrypt kept for backward compat)

### Decision
Use **bcryptjs** (12 rounds) for password hashing. Keep the legacy scrypt verification path for hashes created before the migration.

### Why
- **User requested bcrypt.** (The original implementation used Node's `scryptSync`.)
- **bcrypt is the industry standard** for password hashing — well-audited, widely supported.
- **12 rounds** gives ~250ms hash time, a reasonable balance of security and UX.

### Trade-off
- **Two verification paths.** `verifyPassword()` in `src/lib/auth.ts` checks for the `$2` prefix (bcrypt) and falls back to scrypt for legacy hashes. This adds complexity but is necessary to avoid locking out existing admins.
- **bcryptjs is pure JS** (not native). Slower than `bcrypt` (native bindings) but no compilation step. Acceptable for the admin login volume.

### Status
✅ Final. New passwords are always bcrypt. Legacy scrypt hashes (if any exist) are transparently migrated on next successful login (the change-password flow writes a bcrypt hash).

---

## 8. Custom JWT over next-auth

### Decision
Implement a **custom JWT** (HS256, 12h expiry) in `src/lib/auth.ts` instead of using NextAuth.js (which is installed but unused).

### Why
- **Simpler.** A 60-line `signToken`/`verifyToken` pair vs. NextAuth's configuration providers, session strategy, adapter setup.
- **Fewer dependencies.** NextAuth pulls in `jose`, cookie handling, OAuth providers, etc. We only need HS256.
- **Full control.** The token payload is exactly what we need (`sub`, `email`, `role`, `exp`). No abstraction layer.
- **Cookie + header support.** `getTokenFromRequest()` checks both `Authorization: Bearer` and the `bo_admin_token` cookie.

### Trade-off
- **No OAuth.** No "Sign in with Google" etc. Acceptable for a single-admin restaurant CMS.
- **No session management UI.** No "log out all devices" feature. A stolen token is valid for 12h.
- **Manual cookie setting.** The login route sets the cookie manually (`res.cookies.set(...)`).

### Status
✅ Final. `next-auth` remains in `package.json` but is unused. Removing it is on the cleanup backlog.

---

## 9. ImageUploader uploads to disk (not Base64)

### Decision
The `ImageUploader` and `MultiImageUploader` components upload files to `public/uploads/` via `POST /api/upload` (multipart/form-data). Only the resulting URL string is stored in the database.

### Why
- **User requirement.** Explicitly requested that images be stored on disk, not as Base64 in the DB.
- **DB stays small.** A 1 MB image as Base64 is ~1.3 MB of text in the DB; as a file, it's 0 bytes in the DB.
- **Browser-cacheable.** Files in `public/` are served as static assets with cache headers.
- **Replaceable.** The admin can swap an image without touching the DB row.

### Trade-off
- **Single-server only.** Uploads on server A aren't visible to server B. (Acceptable for the current single-server deployment.)
- **Backups must include `public/uploads/`.** The DB alone is not enough.
- **No server-side image optimisation.** Uploaded files keep their original format/size. (Sharp-based optimisation on upload is on the roadmap.)

### Status
✅ Final. The "no Base64 in the database" rule is hard-enforced by design. See [IMAGE_STORAGE.md](./IMAGE_STORAGE.md) §8.

---

## 10. Admin edit buttons made always-visible (were hover-only)

### Decision
In the admin CMS, the "Edit" / "Delete" action buttons on list rows (menu items, gallery images, testimonials, etc.) are **always visible**, not revealed on hover.

### Why
- **Bug reports.** When the buttons were hover-only, users reported "the admin does nothing" — they couldn't discover the actions.
- **Mobile usability.** Hover doesn't exist on touch devices. Always-visible is the only pattern that works everywhere.
- **Discoverability > minimalism.** The admin is a tool, not a showcase. Clarity beats elegance.

### Trade-off
- **More visual noise.** Each row has visible action buttons instead of a clean hover reveal.
- **Acceptable.** The admin is for the operator, not the guest.

### Status
✅ Final. Do not revert to hover-only.

---

## Lessons Learned (Distilled)

These are the heuristics the project has earned through past pain. Honour them.

1. **Always test on mobile.** A layout that works on desktop can be broken on 375px. Use the Preview Panel's responsive mode or Agent Browser.
2. **Always respect `prefers-reduced-motion`.** It's an accessibility requirement, not a nicety. Every animation must degrade to "content visible immediately."
3. **Always clean up GSAP contexts.** `gsap.context()` + `return () => ctx.revert()` is the only correct pattern. Stale tweens cause jank and memory leaks.
4. **Pin-based scroll animations cause layout bugs.** Avoid `ScrollTrigger.create({ pin: true })` on long pages. Use `scrub: true` (no pin) for parallax.
5. **The dev server caches the Prisma Client.** After editing `schema.prisma`, restart `bun run dev`. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §3.
6. **Lint rule `react-hooks/set-state-in-effect` is enforced.** Use lazy `useState(() => ...)` initializers or call `setState` inside async `.then()` callbacks. Never synchronously in an effect body.
7. **Use relative API paths only.** The gateway requires it. `fetch("/api/menu")`, never `fetch("http://localhost:3000/api/menu")`.
8. **Don't trust HMR for animation changes.** Hard-refresh the browser (`Cmd+R`) after touching `premium-motion.ts`, `gsap-utils.ts`, or any GSAP-using component.
9. **The standalone build needs every runtime file.** If you add a new directory that the server reads at runtime (e.g. `emails/`, `invoices/`), add it to the `cp` commands in `package.json`'s `build` script.
10. **Append to `worklog.md` after every task.** Future agents (human or AI) depend on the record. A task without a worklog entry is a task that never happened.
11. **The admin CMS was declared FINALIZED.** Changes to admin must be additive (new fields, new sections) — not redesigns. Read `worklog.md` before touching admin.
12. **`GoldButton` is gone.** Use `LuxuryButton`. Searching for `GoldButton` should return zero results.
13. **One gold accent, not five.** If a section already has a gold headline + gold border + gold button, don't add a gold icon. Restraint.
14. **`ignoreBuildErrors: true` is a pragmatic choice, not a permanent one.** The build doesn't fail on TS errors, but `bun run lint` does type-check. Run lint.
15. **The `/api/upload` route is expected by client code but may not exist as a file.** Verify `src/app/api/upload/route.ts` is present. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §12.

---

## Decision Log (Quick Reference)

| # | Decision | Status | Doc |
| --- | --- | --- | --- |
| 1 | SQLite (not Postgres) | ✅ Final, roadmap for Postgres | This file §1 |
| 2 | Zustand (not Redux) | ✅ Final | This file §2 |
| 3 | GSAP for scroll, Framer Motion for components | ✅ Final | This file §3 |
| 4 | ScrollStack removed → fade-up grid | ✅ Final, do not revert | This file §4 |
| 5 | Local WebP (not CDN) | ✅ Final | This file §5 |
| 6 | Liquid glass page transition (not fade) | ✅ Final, do not replace | This file §6 |
| 7 | bcrypt (not scrypt) — scrypt kept for compat | ✅ Final | This file §7 |
| 8 | Custom JWT (not next-auth) | ✅ Final | This file §8 |
| 9 | ImageUploader to disk (not Base64) | ✅ Final, hard rule | This file §9 |
| 10 | Admin buttons always-visible (not hover) | ✅ Final, do not revert | This file §10 |

---

## Related Documentation

- [AI_CONTEXT.md](./AI_CONTEXT.md) — The rules derived from these decisions
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — How to implement within these constraints
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — The known consequences of these decisions
- [ROADMAP.md](./ROADMAP.md) — What might change in the future
- [CHANGELOG.md](./CHANGELOG.md) — When these decisions were made
