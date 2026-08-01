# Known Issues

Documented quirks, limitations, and benign warnings in Black Orchid. Each entry explains **what**, **why**, **severity**, and **workaround/fix**.

> **Severity legend**
> - 🟢 **Benign** — cosmetic console output, no functional impact
> - 🟡 **Limitation** — works but with caveats; not a bug
> - 🔴 **Bug** — incorrect behaviour that should be fixed

---

## 1. Framer Motion "container has non-static position" warning 🟢

### Symptom

The browser console shows:

```
Warning: A container with non-static positioning has been detected.
```

This appears when `useScroll({ target: ref, offset: [...] })` from Framer Motion is attached to a section whose ancestor has `position: relative/absolute/fixed/sticky`.

### Where it happens

`src/components/site/Home.tsx` — the `Hero` component uses `useScroll` on a `<section>` that's nested inside `<div className="overflow-hidden">`. Several other views use the same pattern for parallax effects.

### Why it's benign

The warning is informational. Framer Motion emits it to help developers catch scroll-tracking bugs, but the actual scroll tracking works correctly. The animations (parallax, fade-on-scroll) play as intended.

### Fix (if desired)

Wrap each `useScroll` target in a `position: static` container, or suppress the warning with a `// eslint-disable-next-line` comment. Not worth the layout risk.

---

## 2. GSAP "target not found" warnings on HMR 🟢

### Symptom

After saving a file (triggering Fast Refresh), the console may show:

```
GSAP target not found. https://greensock.com/docs/v3/GSAP/CoreMethods/...
```

### Why it happens

The dev server hot-reloads a component, but the GSAP tween created in the previous render is still trying to animate an element that has been removed from the DOM. The tween fires before the new element mounts.

### Why it's benign

- The orphaned tween does nothing (no element to animate).
- The new component mounts with a fresh GSAP context via `gsap.context()` and `ctx.revert()` cleanup.
- A hard browser refresh (`Cmd+R` / `Ctrl+R`) clears all stale contexts.

### Workaround

Hard-refresh the browser after significant HMR changes. This is a known GSAP + React Fast Refresh interaction, not a code bug.

---

## 3. Dev server needs restart after Prisma schema changes 🟡

### Symptom

You edit `prisma/schema.prisma` (e.g. add a field to a model), run `bun run db:push`, but the TypeScript compiler in your IDE and the dev server still see the old types. Calling `db.model.findMany({ select: { newField: true } })` throws a type error or runtime error.

### Why it happens

The Prisma Client is generated once at `bun install` time (via the `postinstall` hook) and cached in `node_modules/.prisma/client`. The Next.js dev server imports this client once at startup and doesn't watch for changes.

### Workaround

After editing `schema.prisma`:

```bash
bun run db:push       # update the SQLite file
bun run db:generate   # regenerate the Prisma Client (optional — db:push does this)
# Then restart the dev server:
# Ctrl+C, then:
bun run dev
```

The TypeScript language server in your editor may also need a restart (`Cmd+Shift+P` → "TypeScript: Restart TS Server" in VS Code).

### Permanent fix (roadmap)

Use `prisma migrate dev` with watch mode, or a `concurrently` script that regenerates the client on schema file changes. Not yet implemented.

---

## 4. Role-based access not enforced per-route 🟡

### Symptom

The Prisma schema defines `AdminUser.role` with three values:

```prisma
model AdminUser {
  role String @default("ADMIN") // ADMIN | MANAGER | EDITOR
}
```

But all admin API routes call `requireAdmin(req)` which only checks **whether the token is valid** — it doesn't check the role. Any authenticated admin (ADMIN, MANAGER, or EDITOR) can perform any write operation.

### Why it's a limitation

The role field was added to the schema for future use, but the route handlers were never updated to enforce role-based permissions. The current single-admin workflow doesn't need it.

### Impact

- If you create additional admin users with `MANAGER` or `EDITOR` roles, they will have full admin access.
- There is no admin UI for creating additional admins anyway (the seed creates only one).

### Fix (when needed)

In `src/lib/auth.ts`, extend `requireAdmin` to accept a role:

```ts
export async function requireAdmin(req: Request, allowedRoles: string[] = ["ADMIN", "MANAGER", "EDITOR"]) {
  const payload = getTokenFromRequest(req) ? verifyToken(getTokenFromRequest(req)!) : null;
  if (!payload) return null;
  if (!allowedRoles.includes(payload.role)) return null;
  return payload;
}
```

Then call `requireAdmin(req, ["ADMIN"])` on sensitive routes (e.g. settings, delete operations).

---

## 5. No sitemap.xml or schema.org structured data 🟡

### Symptom

- `/sitemap.xml` returns 404.
- No `<script type="application/ld+json">` blocks in the HTML.
- Google Search Console can't discover pages efficiently.

### Why it's missing

The public site uses hash-based routing (`/#menu`, `/#gallery`) on a single `/` route. Hash fragments are not indexed as separate URLs by search engines, so a sitemap of hash URLs has limited value.

### Impact

- SEO is functional (the homepage is indexed) but not optimal.
- No rich results (Restaurant schema, Menu schema, Event schema) in Google Search.

### Fix (roadmap)

See [SEO.md](./SEO.md) §5–6 for the implementation plan. The proper long-term fix is to promote each view to its own route (`/menu`, `/gallery`, …), which would make sitemap and structured data meaningful.

---

## 6. No automated tests 🟡

### Symptom

- No `test` script in `package.json`.
- No test files in the codebase.
- No CI pipeline.

### Why it's missing

The project prioritised feature delivery. Manual testing via the browser (and Agent Browser for smoke tests) has been the workflow.

### Impact

- Regressions can slip through if the manual checklist isn't followed.
- Refactors are riskier than they should be.

### Fix (roadmap)

See [TESTING.md](./TESTING.md) §6 — Vitest for unit/integration, Playwright for E2E.

---

## 7. No Docker setup 🟡

### Symptom

- No `Dockerfile`.
- No `docker-compose.yml`.
- Deployment is manual (copy `.next/standalone/` to the server).

### Why it's missing

The standalone build is already self-contained; Dockerising it is a convenience, not a necessity for single-server deployment.

### Impact

- No reproducible build artifact.
- Environment drift between dev and prod is possible.
- No easy way to spin up a preview instance.

### Fix (roadmap)

See [DEPLOYMENT.md](./DEPLOYMENT.md) §7 for a sample `Dockerfile`. The roadmap includes Docker + docker-compose with a mounted volume for the SQLite database and uploads.

---

## 8. SQLite not suitable for high-concurrency production 🟡

### Symptom

Under high write concurrency (many simultaneous reservations), SQLite may return `SQLITE_BUSY` errors. Writes are serialised at the file level.

### Why it's a limitation

SQLite is a file-based database with a single writer at a time. It's perfect for a single-server restaurant site with modest traffic, but not for a high-traffic booking platform.

### Impact

- For typical restaurant traffic (< 100 reservations/day), this is a non-issue.
- For a multi-tenant SaaS or a viral campaign, writes will queue and may time out.

### Workaround

Prisma sets a default busy timeout of 5s on SQLite. If you hit `SQLITE_BUSY`, increase it:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // Note: Prisma doesn't expose busy_timeout directly — set via PRISMA_QUERY_ENGINE_BINARY or a connection URL parameter
}
```

Or use WAL mode (Write-Ahead Logging) for better concurrent read performance:

```sql
PRAGMA journal_mode=WAL;
```

### Fix (roadmap)

Migrate to PostgreSQL — see [ROADMAP.md](./ROADMAP.md). The Prisma schema change is small (`provider = "postgresql"`), but the `String @default("[]")` JSON-array fields should become `String[]` native arrays, requiring seed + API updates.

---

## 9. No email sending for reservation confirmations 🟡

### Symptom

The reservation success screen says:

> "A confirmation email is on its way"

But **no email is actually sent**. The text is purely cosmetic.

### Where it happens

`src/components/site/ReservationView.tsx` — the success screen hardcodes the "email is on its way" message. The `POST /api/reservations` route creates the DB row but doesn't trigger any email.

### Why it's a limitation

There is no email service integration (no SendGrid, Mailgun, AWS SES, Postmark, Resend). Adding one requires:
1. An email service account + API key.
2. A server-side email helper (`src/lib/email.ts`).
3. A call from `POST /api/reservations` after the row is created.
4. An HTML email template matching the Black Orchid brand.

### Workaround

The admin sees new reservations in the Admin → Reservations dashboard and can manually contact the guest. The success message is misleading and should either be removed or made true.

### Fix (roadmap)

- Remove the "email is on its way" text until email is implemented, OR
- Integrate Resend (or similar) and send a branded confirmation email.

---

## 10. No pagination on public menu/gallery 🔴

### Symptom

`GET /api/menu` returns **all 6 categories with all 24 items** in a single response. `GET /api/gallery` returns **all 16 images**. There is no `?page=1&limit=12` pagination.

### Where it happens

- `src/app/api/menu/route.ts` — `db.menuCategory.findMany({ include: { items: ... } })` with no `take`/`skip`.
- `src/app/api/gallery/route.ts` — `db.galleryImage.findMany({ orderBy: { order: "asc" } })` with no limit.
- The client renders all items at once.

### Why it's a limitation

The seed data is small (24 menu items, 16 gallery images), so loading all at once is fast (< 100ms). But as the admin adds more items, the initial page load will grow linearly.

### Impact

- For the current seed size: no perceptible impact.
- At 100+ menu items or 50+ gallery images: noticeable load delay, especially on mobile.
- The `GalleryView` has a client-side "Load More" button that increments `visible` by 12 — but all images are already loaded in memory, just hidden.

### Fix (roadmap)

Add server-side pagination:

```ts
// GET /api/gallery?page=1&limit=12
const page = Number(req.nextUrl.searchParams.get("page") || "1");
const limit = Number(req.nextUrl.searchParams.get("limit") || "12");
const images = await db.galleryImage.findMany({
  orderBy: { order: "asc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

The client "Load More" button would then fetch the next page instead of just revealing hidden items.

---

## 11. (Bonus) `next.config.ts` ignores TypeScript build errors 🟡

### Symptom

```ts
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
};
```

`bun run build` will **not fail** on TypeScript errors. This can hide real bugs in production.

### Why it's set

Some third-party type mismatches (in `@dnd-kit`, `lenis`, etc.) would otherwise block the build. The setting is a pragmatic choice for the sandbox dev environment.

### Fix (when needed)

Set `ignoreBuildErrors: false` and resolve all type errors. Run `bun run lint` (which does type-check) to find them before changing the config.

---

## 12. (Bonus) `/api/upload` route file may be missing 🟡

### Symptom

The client code (`apiUpload` in `src/lib/api.ts`, `ImageUploader` / `MultiImageUploader` in `src/components/admin/`) calls `POST /api/upload` and expects `{ url: string }` back. A sample uploaded file (`public/uploads/1783576002865-ae5e6ef2fc0d.png`) confirms the flow has worked.

However, the route handler file `src/app/api/upload/route.ts` is **not present** in the current checkout.

### Impact

- If the route file is missing, admin image uploads will 404 with "Upload failed".
- The 19 documented REST routes under `/api/` (see [API_REFERENCE.md](./API_REFERENCE.md)) do **not** include `/api/upload` — the upload endpoint is treated as an auxiliary route used only by the admin image uploaders.

### Verification

```bash
ls src/app/api/upload/route.ts
# If the file exists, uploads work. If not, the route needs to be created.
```

### Fix (if missing)

Create `src/app/api/upload/route.ts` with a `POST` handler that:
1. Calls `requireAdmin(req)` (admin-only).
2. Reads the `file` field from the `FormData`.
3. Generates a filename: `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`.
4. Writes the file to `public/uploads/`.
5. Returns `{ url: "/uploads/<filename>" }`.

See [IMAGE_STORAGE.md](./IMAGE_STORAGE.md) §1 for the full spec.

---

## Summary Table

| # | Issue | Severity | Status |
| --- | --- | --- | --- |
| 1 | Framer Motion non-static position warning | 🟢 Benign | Won't fix |
| 2 | GSAP target not found on HMR | 🟢 Benign | Won't fix |
| 3 | Dev server restart after schema changes | 🟡 Limitation | Workaround documented |
| 4 | Role-based access not enforced per-route | 🟡 Limitation | Roadmap |
| 5 | No sitemap.xml / schema.org | 🟡 Limitation | Roadmap |
| 6 | No automated tests | 🟡 Limitation | Roadmap |
| 7 | No Docker setup | 🟡 Limitation | Roadmap |
| 8 | SQLite concurrency ceiling | 🟡 Limitation | Roadmap (PostgreSQL) |
| 9 | No reservation confirmation emails | 🟡 Limitation | Roadmap |
| 10 | No pagination on menu/gallery | 🔴 Bug (at scale) | Roadmap |
| 11 | `ignoreBuildErrors: true` | 🟡 Limitation | Pragmatic; revisit later |
| 12 | `/api/upload` route file may be missing | 🟡 Verify | Check `src/app/api/upload/route.ts` |

---

## Related Documentation

- [ROADMAP.md](./ROADMAP.md) — When each limitation will be addressed
- [TESTING.md](./TESTING.md) — Manual test checklist (covers workarounds)
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker, PostgreSQL migration
- [SEO.md](./SEO.md) — Sitemap + structured data roadmap
- [DATABASE.md](./DATABASE.md) — SQLite vs PostgreSQL
- [API_REFERENCE.md](./API_REFERENCE.md) — Full route documentation
