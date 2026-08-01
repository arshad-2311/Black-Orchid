# Black Orchid — Luxury Restaurant & Banquet

> A cinematic, single-page luxury dining experience with a full CMS admin dashboard.

Black Orchid is a production-grade restaurant website built to feel like an editorial film
rather than a template. The public site is a single-page application that switches between
cinematic views through hash navigation, while a separate `/admin` route provides a complete
content management system for menus, gallery, reservations, testimonials, events, catering
packages, and site settings.

---

## Highlights

- **Cinematic public site** — hero video, GSAP ScrollTrigger reveals, Lenis smooth scroll,
  SplitType text animations, liquid-glass page transitions, magnetic buttons, and a
  context-aware custom cursor.
- **Full CMS dashboard** — manage every piece of content from a polished admin panel at
  `/admin` with sidebar navigation, charts, and an image uploader.
- **Type-safe full stack** — Next.js 16 App Router + TypeScript + Prisma (SQLite) with
  REST API routes and JWT-protected write operations.
- **Premium design system** — dark + gold palette, Playfair Display / Cormorant Garamond /
  Geist typography, glassmorphism, animated gold border glow, and a film-grain overlay.
- **44 compressed WebP images** served locally from `public/img/` plus a 2.4 MB hero video.

---

## Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router) + React 19                                    |
| Language         | TypeScript 5                                                          |
| Styling          | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons                  |
| Database         | Prisma 6 ORM + SQLite (`db/custom.db`)                                |
| Animation        | GSAP + ScrollTrigger, Lenis, Framer Motion, SplitType                 |
| State            | Zustand (client view + admin session)                                 |
| Auth             | bcryptjs (12 rounds) + custom JWT (HS256, 12h) in httpOnly cookies    |
| Charts           | Recharts (admin dashboard)                                            |
| Toasts           | Sonner + Radix toast                                                  |
| Image processing | Sharp                                                                 |

See [TECH_STACK.md](./TECH_STACK.md) for the rationale behind each choice.

---

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (recommended runtime & package manager)
- Node.js 18+ (Bun is still required for the install scripts)

### Steps

```bash
# 1. Install dependencies
bun install

# 2. Create the database file and push the Prisma schema
bun run db:push

# 3. Seed the database with default admin, menu, gallery, testimonials, etc.
bun prisma/seed.ts

# 4. Start the dev server (port 3000)
bun run dev
```

> The dev server writes logs to `dev.log` at the project root. The application is served
> exclusively on **port 3000** — do not run `next dev` on any other port.

### Environment

A single environment variable is required (already present in `.env`):

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

For production deployments, also set:

```env
ADMIN_JWT_SECRET=<a-long-random-string>
```

If unset, a dev-only secret is used (`src/lib/auth.ts`).

### Default Admin Credentials

```
Email:    admin@blackorchid.com
Password: admin123
```

Change the password immediately from **Admin → Change Password** in production.

---

## Folder Overview

```
black-orchid/
├── docs/                 # ← this documentation
├── prisma/
│   ├── schema.prisma     # 9 models (AdminUser, MenuCategory, MenuItem, …)
│   └── seed.ts           # seeds admin + sample content
├── public/
│   ├── img/              # 44 compressed WebP images
│   ├── uploads/          # admin-uploaded images (runtime)
│   ├── hero-video.mp4    # cinematic hero background
│   ├── logo.svg
│   └── robots.txt
├── db/
│   └── custom.db         # SQLite database file
├── src/
│   ├── app/              # routes, layout, globals.css, API handlers
│   ├── components/
│   │   ├── site/         # public site components (Home, PillNav, Cursor, …)
│   │   ├── admin/        # admin dashboard (AdminApp, AdminMenu, ui.tsx, …)
│   │   └── ui/           # shadcn/ui component library
│   ├── hooks/            # use-mobile, use-toast
│   └── lib/              # db, auth, api, store, types, images, utils
├── next.config.ts        # output: "standalone"
├── package.json
└── Caddyfile             # gateway config (single external port)
```

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for a complete file-by-file reference.

---

## Scripts

| Script              | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `bun run dev`       | Start the Next.js dev server on port 3000 (logs to `dev.log`).               |
| `bun run build`     | Production build (`output: "standalone"`) + copies `db/`, `prisma/`, `public/`, `.env` into `.next/standalone/`. |
| `bun run start`     | Run the standalone production server.                                        |
| `bun run lint`      | Run ESLint (Next.js + TypeScript rules).                                     |
| `bun run db:push`   | Push the Prisma schema to SQLite (creates/updates tables).                   |
| `bun run db:generate` | Regenerate the Prisma Client.                                              |
| `bun run db:migrate`  | Create a new Prisma migration (dev).                                       |
| `bun run db:reset`    | Drop and recreate the database (re-runs migrations).                       |
| `bun prisma/seed.ts`  | Seed the database with the default admin + sample content.                |

> `postinstall` automatically runs `prisma generate`, and `prebuild` re-generates the
> client before building — so you rarely need to run `db:generate` manually.

---

## Deployment Notes

### Standalone Build

`next.config.ts` sets `output: "standalone"`. The `build` script then bundles
everything the server needs into `.next/standalone/`:

```bash
next build \
  && cp -r .next/static .next/standalone/.next/ \
  && cp -r public .next/standalone/ \
  && cp -r db .next/standalone/ \
  && cp -r prisma .next/standalone/ \
  && cp .env .next/standalone/
```

Run the production server with:

```bash
bun .next/standalone/server.js
```

### SQLite Considerations

- The database is a single file (`db/custom.db`) — back it up by copying the file.
- Because it is file-based, there is no database server to provision.
- For horizontal scaling or multi-instance deployments, swap the datasource in
  `prisma/schema.prisma` to PostgreSQL/MySQL and re-run `db:push`.

### Gateway

A single external port is exposed via a Caddy gateway (see `Caddyfile`). All API and
asset requests use **relative paths** so the gateway can route them correctly.

---

## Accessing the Site

- **Public site**: `/` — the single-page cinematic experience.
- **Admin dashboard**: `/admin` — the CMS (login required).
- **404**: `src/app/not-found.tsx` — auto-redirects common admin URL typos to `/admin`.

> This project runs in a cloud sandbox. Preview it through the **Preview Panel** on the
> right side of the interface — do not navigate to `localhost:3000` directly.

---

## Contribution Guide

1. **Read the worklog.** `worklog.md` at the project root tracks every change; append a
   `---` section after finishing your work.
2. **Follow the design system.** Public-site styling lives in `src/app/globals.css` and
   `src/components/site/primitives.tsx`. Admin styling is scoped to `.admin-root` — do
   not leak admin classes into the public site (or vice-versa).
3. **Use the existing primitives.** Prefer `LuxuryButton`, `Eyebrow`, `SectionHeading`,
   `OrnamentDivider`, and the motion hooks (`useFadeUp`, `useSplitText`, etc.) over
   one-off implementations.
4. **Respect the API contract.** All write operations must go through `requireAdmin()`.
  Public reads are open; admin reads/writes require a valid JWT.
5. **No Base64 in the database.** Images are uploaded to `public/uploads/` via `/api/upload`
   and only the URL string is stored.
6. **Lint before committing.** Run `bun run lint` and resolve all errors.
7. **Update the docs** in `docs/` if you add or change a public-facing feature.

---

## Related Documentation

| Document                 | Contents                                                      |
| ------------------------ | ------------------------------------------------------------ |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Business goals, audience, customer journey, design philosophy |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | System layers, data flow, Mermaid diagram                     |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Every folder and file explained                               |
| [TECH_STACK.md](./TECH_STACK.md)             | Why each technology was chosen                                |
| [ROUTING.md](./ROUTING.md)                   | View routing, hash navigation, API routes                     |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)       | Colors, typography, components, motion timing                 |
| [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md)   | Component-by-component reference                              |

---

© Black Orchid. Crafted with intention.
