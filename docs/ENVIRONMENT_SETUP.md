# Environment Setup

Everything a new contributor needs to install, configure, and run Black Orchid locally.

> **Source of truth**
> - `package.json` — scripts, dependencies, Node/Bun version expectations
> - `.env` — environment variables
> - `prisma/schema.prisma` — database schema + datasource
> - `prisma/seed.ts` — seed script
> - `next.config.ts` — Next.js 16 standalone build configuration
> - `tsconfig.json` — TypeScript strict mode + `@/*` alias

---

## 1. Prerequisites

| Tool         | Version           | Required for                                   |
| ------------ | ----------------- | ---------------------------------------------- |
| **Bun**      | 1.0+              | Package manager, dev runtime, script runner   |
| **Node.js**  | 18+               | Next.js 16 runtime requirement                 |
| **OS**       | macOS / Linux / Windows (WSL recommended) | Dev & build host                |

> The project is tested with Bun as the primary runtime. `npm` / `yarn` / `pnpm` will also work because `package.json` uses standard scripts, but **all documentation commands use `bun`**.

### Verify your versions

```bash
bun --version    # >= 1.0
node --version   # >= 18
```

---

## 2. Installation

Clone the repository (if you haven't already) and install dependencies:

```bash
git clone <repo-url> black-orchid
cd black-orchid
bun install
```

The `postinstall` script (defined in `package.json`) automatically runs `prisma generate`, which creates the Prisma Client. You don't need to run it manually after install.

---

## 3. Environment Variables

Create a `.env` file at the project root. The minimum required content:

```env
# SQLite database file location.
# Relative path (recommended for portability):
DATABASE_URL=file:./db/custom.db
# OR absolute path (used in the current sandbox checkout):
# DATABASE_URL=file:/home/z/my-project/db/custom.db
```

### Required

| Variable        | Example                              | Purpose                                  |
| --------------- | ------------------------------------ | ---------------------------------------- |
| `DATABASE_URL`  | `file:./db/custom.db`                | Prisma datasource URL — points Prisma at the SQLite file |

### Optional

| Variable             | Example                       | Purpose                                                       |
| -------------------- | ----------------------------- | ------------------------------------------------------------- |
| `ADMIN_JWT_SECRET`   | `a-long-random-32-char-string` | HS256 signing secret for admin JWTs. **Set in production.**   |

> If `ADMIN_JWT_SECRET` is unset, `src/lib/auth.ts` falls back to a hard-coded dev secret:
> ```ts
> const SECRET = process.env.ADMIN_JWT_SECRET || "black-orchid-dev-secret-change-me";
> ```
> The dev secret is fine for local development but **must be replaced** for any production deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

### Generating a secure secret

```bash
openssl rand -base64 32
# → e.g. "K7vQ9xZ3bN1pY8wL2rT6sF4hJ0mC5dG8"
```

---

## 4. Database Setup

The database is **SQLite**, stored as a single file at `db/custom.db`. There is no database server to install or start.

### 4.1 Push the schema

```bash
bun run db:push
```

This runs `prisma db push`, which reads `prisma/schema.prisma` and creates/updates the SQLite file's tables to match the 9 models. It is idempotent — safe to re-run after schema changes.

> ⚠️ **Important:** After editing `prisma/schema.prisma`, you **must restart the dev server**. The Prisma Client is generated once at install time and cached; the dev server holds a stale reference until restarted. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §3.

### 4.2 Seed the database

```bash
bun prisma/seed.ts
```

This runs `prisma/seed.ts`, which seeds:

| Resource            | Count | Notes                                                                 |
| ------------------- | ----- | --------------------------------------------------------------------- |
| `AdminUser`         | 1     | `admin@blackorchid.com` / `admin123` (bcrypt, 12 rounds)              |
| `SiteSettings`      | 1     | Singleton row (`id: "singleton"`) with hero copy, contact info, hours |
| `MenuCategory`      | 6     | Starters, Main Course, Chinese, Indian, Desserts, Cocktails           |
| `MenuItem`          | 24    | Rich fields: tagline, ingredients, allergens, images, spice level     |
| `GalleryImage`      | 16    | Across 5 categories (Food, Drinks, Interior, Events, Banquet)         |
| `Testimonial`       | 6     | 4 featured, with avatar photos                                        |
| `EventItem`         | 4     | Truffle Gala, Valentine's, Mixology, Diwali                           |
| `CateringPackage`   | 3     | Silver Soirée, Golden Gala, Platinum Royal                            |

The seed script is **idempotent** for `AdminUser` and `SiteSettings` (uses `upsert` / `findUnique`), but **destructive** for the content tables (`deleteMany({})` then re-create). Re-running it will reset menu items, gallery, testimonials, events, and catering packages to the seeded defaults — any admin edits will be lost.

### 4.3 Verify

```bash
# Quick sanity check — query the admin user count
bun -e "const {db}=require('./src/lib/db'); db.adminUser.count().then(c=>{console.log('admins:',c); process.exit(0);})"
```

Expected output: `admins: 1`.

---

## 5. Development Server

```bash
bun run dev
```

This runs `next dev -p 3000 2>&1 | tee dev.log`, which:

1. Starts the Next.js 16 dev server on **port 3000**.
2. Tees the server log to `dev.log` at the project root.

> ⚠️ The application **must** run on port 3000. The sandbox gateway (see `Caddyfile`) only forwards external traffic to that port. Do not run `next dev` on any other port.

### Reading logs

The dev server log is at `/home/z/my-project/dev.log`. To check recent output:

```bash
tail -n 100 dev.log
```

Watch this file for compile errors, runtime exceptions, and benign warnings (see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)).

### Accessing the app

- **Public site:** `/` — the cinematic single-page experience
- **Admin CMS:** `/admin` — login with `admin@blackorchid.com` / `admin123`
- **404 page:** `/anything-else` — auto-redirects common admin typos to `/admin`

> This project runs in a cloud sandbox. Preview it through the **Preview Panel** — do not navigate to `http://localhost:3000` directly.

### Hot reload / Fast Refresh

Next.js 16 supports Fast Refresh out of the box. Edits to most files trigger an instant hot reload without losing component state.

Known HMR quirks (all benign):
- GSAP "target not found" warnings — elements not yet mounted after a refresh. Resolve with a hard reload (`Cmd+R` / `Ctrl+R`).
- See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §1–2.

---

## 6. Production Build

```bash
bun run build
```

The `build` script in `package.json` runs:

```bash
next build \
  && cp -r .next/static .next/standalone/.next/ \
  && cp -r public .next/standalone/ \
  && cp -r db .next/standalone/ \
  && cp -r prisma .next/standalone/ \
  && cp .env .next/standalone/
```

The `prebuild` hook automatically runs `prisma generate` before `next build`, ensuring the Prisma Client is fresh.

### Why the `cp` commands?

`next.config.ts` sets `output: "standalone"`. This tells Next.js to bundle a minimal Node.js server (`.next/standalone/server.js`) that includes only the code needed to run the app. **However**, the standalone bundle does **not** include:

- `.next/static/` — the client JS chunks, CSS, fonts
- `public/` — static assets (images, hero video, uploads, robots.txt)
- `db/` — the SQLite database file
- `prisma/` — the schema (needed if you re-run migrations on the server)
- `.env` — environment variables

The `cp` commands copy each of these into `.next/standalone/` so the standalone server can run as a fully self-contained deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment story.

---

## 7. Production Server

```bash
bun run start
```

This runs `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log`, which:

1. Sets `NODE_ENV=production`.
2. Runs the standalone Node.js server bundled by `next build`.
3. Tees the server log to `server.log`.

The production server listens on port 3000 by default. To change the port, set `PORT=4000` (or your preferred port) before running:

```bash
PORT=4000 bun run start
```

> The default `bun run start` script does not set `PORT`. In the sandbox, the gateway expects port 3000.

---

## 8. Scripts Reference

All scripts defined in `package.json`:

| Script              | Command                                                      | Description                                                              |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `dev`               | `next dev -p 3000 2>&1 \| tee dev.log`                       | Dev server on port 3000, logs to `dev.log`                               |
| `build`             | `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && cp -r db .next/standalone/ && cp -r prisma .next/standalone/ && cp .env .next/standalone/` | Production build + standalone bundle                                     |
| `start`             | `NODE_ENV=production bun .next/standalone/server.js 2>&1 \| tee server.log` | Run the standalone production server                                     |
| `lint`              | `eslint .`                                                   | Run ESLint (Next.js + TypeScript rules)                                  |
| `db:push`           | `prisma db push`                                             | Push schema to SQLite (creates/updates tables)                           |
| `db:generate`       | `prisma generate`                                            | Regenerate the Prisma Client (rarely needed — `postinstall` does this)   |
| `db:migrate`        | `prisma migrate dev`                                         | Create a new Prisma migration (dev environment)                          |
| `db:reset`          | `prisma migrate reset`                                       | Drop and recreate the database (re-runs all migrations + seed)           |
| `postinstall`       | `prisma generate`                                            | Auto-runs after `bun install`                                            |
| `prebuild`          | `prisma generate`                                            | Auto-runs before `bun run build`                                         |

### Manual seed

There is **no `seed` script** in `package.json`. Run the seed directly with Bun:

```bash
bun prisma/seed.ts
```

This is intentional — the seed is destructive for content tables and should be a deliberate action, not chained into `db:push` or `db:reset`.

---

## 9. Linting

```bash
bun run lint
```

Runs ESLint with the Next.js 16 + TypeScript config (`eslint.config.mjs`). The config has `react-hooks/exhaustive-deps` and most stylistic rules off, but **`react-hooks/set-state-in-effect`** is enforced — see [CODING_STANDARDS.md](./CODING_STANDARDS.md) for the lint-safe data-fetching pattern.

Resolve all errors before committing. Warnings should be reviewed but are not blocking.

---

## 10. Common Setup Issues

### "Cannot find module '@prisma/client'"

The Prisma Client wasn't generated. Run:

```bash
bun run db:generate
```

Or just re-run `bun install` (the `postinstall` hook will generate it).

### "Database does not exist" / "no such table"

The SQLite file exists but tables haven't been pushed. Run:

```bash
bun run db:push
```

### "Admin login fails with 401"

Either the database hasn't been seeded (no `AdminUser` row), or you've changed the admin password. Re-seed:

```bash
bun prisma/seed.ts
```

This resets the admin password back to `admin123` (the seed uses `findUnique` + `update` on the existing admin row).

### "Port 3000 is already in use"

The dev server must run on 3000. Kill any process holding the port:

```bash
lsof -ti:3000 | xargs kill -9   # macOS/Linux
```

### Prisma schema changes don't appear

After editing `prisma/schema.prisma`:

1. Run `bun run db:push` to update the SQLite file.
2. Run `bun run db:generate` to regenerate the Prisma Client.
3. **Restart the dev server** (`Ctrl+C` then `bun run dev`). The dev server caches the Prisma Client and won't pick up the new types until restarted.

This is a known Prisma limitation — see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §3.

### GSAP "target not found" warnings after Fast Refresh

Benign — the element being animated hasn't mounted yet after a hot reload. Hard-refresh the browser (`Cmd+R` / `Ctrl+R`) to clear the stale GSAP context. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) §2.

---

## 11. Quick Start (TL;DR)

```bash
# 1. Install
bun install

# 2. Configure
echo "DATABASE_URL=file:./db/custom.db" > .env

# 3. Database
bun run db:push
bun prisma/seed.ts

# 4. Run
bun run dev    # → http://localhost:3000
```

Login to `/admin` with `admin@blackorchid.com` / `admin123`.

---

## 12. Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production build, deployment, reverse proxy
- [DATABASE.md](./DATABASE.md) — Prisma schema, models, migrations
- [AUTHENTICATION.md](./AUTHENTICATION.md) — JWT auth, bcrypt, the `requireAdmin()` helper
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Known quirks and their workarounds
- [README.md](./README.md) — High-level project overview
