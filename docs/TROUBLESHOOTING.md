# Troubleshooting

Common issues, root causes, and fixes for the Black Orchid project.

> **Always start here:** check `dev.log` for the most recent server output
> before reading anything else. Most errors leave a clear stack trace there.

---

## 1. Image Upload Fails

**Symptom:** `ImageUploader` shows "Upload failed", or `apiUpload()` throws,
or a 400/401/500 appears in the browser network tab for `POST /api/upload`.

**Checklist (in order):**

1. **Route exists** — `src/app/api/upload/route.ts` must be present.
   ```bash
   ls src/app/api/upload/route.ts
   ```
2. **`public/uploads/` exists and is writable** — the route creates it if
   missing, but if the parent `public/` is read-only the `mkdir` will throw.
   ```bash
   ls -ld public/uploads
   # If missing or read-only:
   mkdir -p public/uploads && chmod 755 public/uploads
   ```
3. **File type is allowed** — only `image/jpeg`, `image/jpg`, `image/png`,
   `image/webp`, `image/gif`, `image/avif`. Anything else returns `400`.
4. **File size ≤ 6 MB** — the route checks `file.size > 6 * 1024 * 1024`.
   Compress the image first (the project uses `sharp` for this — see
   `download/` and `public/img/`).
5. **Admin is authenticated** — `requireAdmin(req)` reads the JWT from the
   `Authorization: Bearer <token>` header OR the `bo_admin_token` cookie.
   If neither is present or valid → `401 Unauthorized`.
   - Check `localStorage.getItem("bo_admin_token")` in the browser console.
   - If empty, log in again at `/#admin`.
6. **Network tab** — open DevTools → Network → click the failed `/api/upload`
   request:
   - `401` → auth issue, see §2.
   - `400` → bad file (wrong type, too large, or empty).
   - `500` → server error; check `dev.log` for the stack trace.
   - `PayloadTooLargeError` → Next.js body limit hit (shouldn't happen at 6 MB,
     but if you raised the limit elsewhere, check `next.config.ts`).

**Common gotcha:** setting `Content-Type: multipart/form-data` manually in
`fetch`. The browser must set the boundary automatically. `apiUpload()` in
`src/lib/api.ts` deliberately omits `Content-Type` from the headers — keep it
that way.

---

## 2. JWT / Auth Issues

**Symptom:** admin pages redirect to login loop, API returns `401` on every
write, or `verifyToken()` returns `null`.

**Checklist:**

1. **`ADMIN_JWT_SECRET` env var** — defined in `.env`. If missing, the code
   falls back to `"black-orchid-dev-secret-change-me"` (a loud warning sign in
   production).
   ```bash
   grep ADMIN_JWT_SECRET .env
   ```
2. **Token expiry (12 h)** — `signToken(payload, expiresInSeconds = 60*60*12)`.
   If the token was issued > 12 h ago, `verifyToken` returns `null` → `401`.
   Fix: log out and back in.
3. **`localStorage` has `bo_admin_token`** —
   ```js
   localStorage.getItem("bo_admin_token");
   ```
   Should be a 3-part dot-separated JWT (`header.payload.signature`).
4. **Cookie `bo_admin_token`** — DevTools → Application → Cookies →
   `http://localhost:3000`. Should be present, `HttpOnly`, `SameSite=Lax`.
   If only `localStorage` has it (e.g. you logged in via API directly), the
   cookie-based fallback won't work for SSR routes — but our admin uses
   `Authorization` header via `authHeaders()` so this is fine.
5. **Clear and re-login** — if the token is corrupted or the secret rotated:
   ```js
   localStorage.removeItem("bo_admin_token");
   localStorage.removeItem("bo_admin_user");
   document.cookie = "bo_admin_token=; Max-Age=0; path=/";
   location.href = "/#admin";
   ```
6. **Bcrypt hash format** — stored passwords must start with `$2b$12$` (12
   rounds). If a hash starts with `$2a$` or `$2y$`, it still verifies (bcryptjs
   accepts these) but the round count may differ. If a hash looks like
   `salt:hexhash` (no `$`), it's a legacy scrypt hash — `verifyPassword()`
   handles this automatically via `verifyScryptLegacy()`.
7. **Server clock skew** — JWT `exp` is compared to `Date.now()`. If the
   server clock is wrong, tokens may be instantly expired. Run `date` and
   verify NTP is healthy.

---

## 3. Database Issues

**Symptom:** `PrismaClientInitializationError`, "no such table", or
`Error: Cannot find module '.prisma/client/default'`.

**Checklist:**

1. **`DATABASE_URL` in `.env`** —
   ```
   DATABASE_URL="file:./db/custom.db"
   ```
   The path is relative to the `prisma/` folder, so this resolves to
   `<project>/db/custom.db`.
2. **`db/custom.db` exists** —
   ```bash
   ls -la db/custom.db
   ```
   If missing, the schema hasn't been pushed yet — see step 3.
3. **Push the schema** —
   ```bash
   bun run db:push
   ```
   This creates tables (and the SQLite file if missing) without generating a
   migration. Idempotent.
4. **Regenerate the Prisma client** —
   ```bash
   bun run db:generate
   ```
   Required after editing `prisma/schema.prisma`. Also runs automatically on
   `postinstall` and `prebuild`.
5. **Restart the dev server after schema changes** — Next.js caches the
   Prisma client in `node_modules/.prisma/client/`. The running dev server
   won't pick up a regenerated client until you Ctrl-C and restart
   `bun run dev`. **This is the #1 cause of "no such column" errors.**
6. **Verify the client is generated** —
   ```bash
   ls node_modules/.prisma/client/
   ```
   Should contain `default.js`, `schema.prisma`, etc.
7. **Re-seed if data is missing** —
   ```bash
   bun prisma/seed.ts
   ```
8. **Locked DB / `SQLITE_BUSY`** — happens when two processes hold a write
   lock. Kill stale `bun` processes:
   ```bash
   pkill -f "bun.*dev" ; pkill -f "next dev"
   ```

---

## 4. GSAP Issues

**Symptom:** "target not found" warning in console, animation doesn't play,
or scroll-triggered sections stack incorrectly.

**Checklist:**

1. **"target not found"** — usually benign. GSAP runs before the element is
   mounted (common during HMR). If it persists outside HMR:
   - Wrap animations in `gsap.context()` and call from inside `useEffect`
     (after mount).
   - Use `useLayoutEffect` if measuring layout before paint.
2. **`gsap.context()` scoping** — every component that uses GSAP should:
   ```ts
   useEffect(() => {
     const ctx = gsap.context(() => {
       gsap.to(".my-el", { ... });
     }, ref); // scope to a ref, not document
     return () => ctx.revert();
   }, []);
   ```
   The `ref` scope prevents selectors from leaking outside the component.
3. **`useEffect` cleanup** — always return `ctx.revert()` to kill animations
   on unmount. Otherwise HMR accumulates stale tweens.
4. **`ScrollTrigger.refresh()` after dynamic content** — if list items are
   fetched async, call `ScrollTrigger.refresh()` once they render:
   ```ts
   useEffect(() => {
     if (data) ScrollTrigger.refresh();
   }, [data]);
   ```
5. **`prefers-reduced-motion`** — respect users who opt out:
   ```ts
   const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if (reduce) return; // skip the animation entirely
   ```
6. **Lenis + ScrollTrigger sync** — Lenis must drive ScrollTrigger:
   ```ts
   lenis.on("scroll", ScrollTrigger.update);
   gsap.ticker.add((time) => lenis.raf(time * 1000));
   gsap.ticker.lagSmoothing(0);
   ```
   If scroll-triggered animations stutter, this wiring is missing.

---

## 5. Build Issues

**Symptom:** `bun run build` fails, or the standalone server crashes on boot.

**Checklist:**

1. **Read the build output** — `bun run build` pipes through `next build`
   then copies static assets, `public/`, `db/`, `prisma/`, `.env` into
   `.next/standalone/`. If the copy step fails (missing folder, permissions),
   the build script aborts.
2. **`.next/standalone/` contents** — after a successful build:
   ```bash
   ls .next/standalone/
   # Should contain: server.js, .next/, public/, db/, prisma/, .env
   ```
3. **`postinstall` / `prebuild` ran** — both run `prisma generate`. If you
   see `PrismaClientInitializationError` at boot, the client wasn't generated.
   Run `bun run db:generate` manually.
4. **TypeScript errors** — `next.config.ts` has
   `typescript: { ignoreBuildErrors: true }`. This lets the build succeed
   despite TS warnings, but it also hides real type errors. To audit:
   ```bash
   bunx tsc --noEmit
   ```
5. **ESLint** —
   ```bash
   bun run lint
   ```
   Lint errors are NOT fatal to the build (Next 16 doesn't fail on lint by
   default), but they should be fixed.
6. **Standalone server boot** —
   ```bash
   bun run start
   # Equivalent to: NODE_ENV=production bun .next/standalone/server.js
   ```
   Check `server.log` for runtime errors.

---

## 6. Dev Server Issues

**Symptom:** `bun run dev` won't start, or the page hangs.

**Checklist:**

1. **Port 3000 in use** — the dev server is hard-coded to `3000` in
   `package.json` (`next dev -p 3000`). If another process holds the port:
   ```bash
   lsof -i :3000      # macOS / Linux
   # or:
   ss -ltnp | grep :3000
   # Then kill the offending PID.
   ```
2. **Read `dev.log`** — the dev script pipes output here:
   `next dev -p 3000 2>&1 | tee dev.log`. Tail the last 100 lines:
   ```bash
   tail -n 100 dev.log
   ```
3. **Import errors** — common ones:
   - `Cannot find module '@/lib/db'` → check `tsconfig.json` `paths` mapping
     (`@/*` → `./src/*`).
   - `Module not found: 'lenis'` → run `bun install`.
4. **Restart after schema changes** — see §3.5. Always.
5. **Hot reload not picking up changes** — HMR can get confused after
   editing `prisma/schema.prisma` or `next.config.ts`. Full restart:
   ```bash
   # Kill, then:
   bun run dev
   ```
6. **Caddy gateway** — the project is fronted by Caddy (see `Caddyfile`).
   If the public preview shows 502, the dev server probably crashed — check
   `dev.log`.

---

## 7. Animation Glitches

**Symptom:** elements flicker, jump, or animate at the wrong speed.

**Checklist:**

1. **Framer Motion duration units** — durations are in **seconds**, not
   milliseconds. `duration: 0.2` is correct; `duration: 200` is a 200-second
   animation (looks frozen).
2. **z-index conflicts** — animated elements with `position: fixed` or
   `absolute` need explicit `z-index`. The loader uses `z-[9999]`, the
   cursor uses `z-[9998]`, the navbar uses `z-50`. Pick a value that doesn't
   collide.
3. **`overflow: hidden` on containers** — child elements that translate
   outside the parent will be clipped. Either remove the overflow, add
   padding, or move the animated element outside the container.
4. **Sticky positioning** — `position: sticky` requires the parent to have a
   height greater than the sticky element. If the parent has
   `overflow: hidden`, sticky breaks silently.
5. **`prefers-reduced-motion`** — see §4.5. Some users will see no motion at
   all; design must still work without animation.
6. **Framer Motion "container non-static position" warning** — benign but
   noisy. Caused by animating `layout` on an element whose parent has
   `position: relative`. Wrap with a `position: static` parent or accept the
   warning.

---

## 8. Layout Issues

**Symptom:** horizontal scrollbar appears, content overflows on mobile, or
images look squished.

**Checklist:**

1. **Horizontal overflow** —
   ```js
   // In the browser console:
   document.documentElement.scrollWidth - document.documentElement.clientWidth
   ```
   If > 0, something is wider than the viewport. Common culprits:
   - Negative margins without `overflow-x: hidden` on the parent.
   - `vw` units on elements inside a scroll container.
   - Fixed-width children inside a flex row.
2. **Responsive breakpoints** — Tailwind 4 default breakpoints:
   `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`. Test at each.
3. **Image aspect ratios** — use `<AspectRatio>` from `@/components/ui/aspect-ratio`
   or `style={{ aspectRatio: "16/10" }}` rather than fixed `width/height`.
4. **Flex / grid layouts** — if children don't wrap, add `flex-wrap` or
   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. If a flex child grows
   unexpectedly, check `flex-1` vs `flex-none`.
5. **Mobile safe area** — iOS notch / home indicator can overlap the
   footer. Use `pb-[env(safe-area-inset-bottom)]` on the footer.
6. **Sticky footer** — the root layout uses
   `min-h-screen flex flex-col` with `mt-auto` on the `<footer>`. If the
   footer floats mid-screen, the parent is missing `flex flex-col`.

---

## 9. Quick Diagnostic Commands

```bash
# Dev server health
tail -n 100 dev.log

# Lint
bun run lint

# Type-check (slower, but catches what ignoreBuildErrors hides)
bunx tsc --noEmit

# Prisma
bun run db:generate      # regenerate client
bun run db:push          # apply schema
bun prisma/seed.ts       # re-seed data

# Standalone build sanity
ls .next/standalone/     # should have server.js, .next/, public/, db/, prisma/, .env

# Find stale processes holding port 3000
lsof -i :3000
```

---

## Related

- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — documented but unresolved issues.
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — initial setup.
- [PERFORMANCE.md](./PERFORMANCE.md) — performance tuning.
- [GSAP_GUIDE.md](./GSAP_GUIDE.md) — GSAP patterns used in this project.
