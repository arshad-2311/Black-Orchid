# Routing

Black Orchid uses **three distinct routing mechanisms** that coexist in a single Next.js
application:

1. **Client-side view routing** for the public site (Zustand + hash navigation).
2. **Next.js App Router routes** for the admin dashboard and the 404 page.
3. **Next.js Route Handlers** for the REST API.

This document explains each.

---

## 1. Public Site — Client-Side View Routing

The public site is a **single-page application**. There is exactly one Next.js route —
`/` (`src/app/page.tsx`) — and all "pages" (Menu, Gallery, About, Reservation, …) are
**views** swapped client-side via a Zustand store. This keeps transitions instant and
choreographed (the liquid-glass bloom) without full page reloads.

### The View Store

```ts
// src/lib/store.ts
export type ViewKey =
  | "home" | "about" | "menu" | "banquet" | "gallery" | "catering"
  | "contact" | "hours" | "reservation" | "privacy" | "terms" | "admin";

export const useApp = create<State>((set) => ({
  view: "home",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
      history.replaceState(null, "", v === "home" ? "#" : `#${v}`);
    }
  },
  // …admin session state
}));
```

### Hash Navigation

When `setView("menu")` is called:

1. The `view` state updates to `"menu"`.
2. `window.scrollTo(0)` resets scroll.
3. `history.replaceState` updates the URL to `#menu` (or `#` for home) — **without** a
   page reload or a new history entry.

This makes views **shareable** (`https://site/#gallery` opens the gallery) and respects
the browser's back/forward buttons (a `hashchange` listener in `hydrateAdmin()` applies
the hash to the store).

### View → Component Mapping

`src/app/page.tsx` reads `view` (via `useApp()`) and renders the matching component.
Because the page-transition animation swaps content mid-transition, a `displayedView`
state lags behind `view` until the transition completes:

```tsx
const { view } = useApp();
const [displayedView, setDisplayedView] = useState(view);
const { transition } = usePageTransition();

useEffect(() => {
  if (view === displayedView) return;
  transition(() => {
    setDisplayedView(view);
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}, [view, displayedView, transition]);

return (
  <>
    {displayedView === "home" && <Home settings={settings} />}
    {displayedView === "menu" && <MenuView />}
    {displayedView === "gallery" && <GalleryView />}
    {/* …all 11 views */}
  </>
);
```

### The 11 Public Views

| View          | Hash         | Component           | Fetches from API |
| ------------- | ------------ | ------------------- | ----------------- |
| Home          | `#`          | `Home`              | `/api/menu`, `/api/gallery`, `/api/testimonials?featured=1` |
| About         | `#about`     | `AboutView`         | — (static imagery) |
| Menu          | `#menu`      | `MenuView`          | `/api/menu` |
| Banquet       | `#banquet`   | `BanquetView`       | — (settings prop) |
| Gallery       | `#gallery`   | `GalleryView`       | `/api/gallery` |
| Catering      | `#catering`  | `CateringView`      | `/api/catering` |
| Hours         | `#hours`     | `HoursView`         | — (settings prop) |
| Contact       | `#contact`   | `ContactView`       | — (settings prop) |
| Reservation   | `#reservation` | `ReservationView` | POST `/api/reservations` |
| Privacy       | `#privacy`   | `LegalView kind="privacy"` | — |
| Terms         | `#terms`     | `LegalView kind="terms"`   | — |

> The `"admin"` view key is a redirect shim: when `view === "admin"`, `page.tsx` calls
> `router.replace("/admin")` to send the user to the real Next.js admin route.

### Navigation Triggers

Visitors navigate via:

- **`PillNav`** — the floating glass pill. Desktop: inline buttons with a sliding gold
  active indicator. Mobile: a hamburger that opens a fullscreen staggered overlay.
- **`LuxuryButton` / `TextLink`** CTAs throughout the content (e.g. "Explore Menu",
  "View Full Gallery", "Read Our Story").
- **`Footer`** quick links.
- **`StickyReserve`** — the floating "Book" orb (desktop) and bottom bar (mobile),
  always routing to `#reservation`.
- **Direct URL** — visiting `/#menu` applies the hash on mount via `hydrateAdmin()`.

### Page Transitions (Liquid-Glass Bloom)

Every view change is wrapped in the `usePageTransition` hook (`premium-motion.ts`). When
a navigation trigger is clicked:

1. The click origin (x, y) and a destination "variant" are captured (e.g. clicking
   "Menu" → variant `"menu"`).
2. A multi-layer overlay is built: a smoked-glass circle expands from the click point,
   a gold radial bloom, a moving reflection streak, a film-grain layer, and a brief
   "Black Orchid" wordmark.
3. At the midpoint, the callback swaps `displayedView` (the new view mounts behind the
   overlay).
4. The glass retracts upward, revealing the new page.
5. `ScrollTrigger.refresh()` is called so GSAP scroll animations recalculate.

The transition is skipped entirely under `prefers-reduced-motion` (the callback runs
immediately). Variant tints give each destination a subtly different mood (e.g.
reservation = warmer gold bloom).

---

## 2. Next.js App Router Routes

These are real server-rendered routes (separate HTML documents).

### `/` — Public Site
**File:** `src/app/page.tsx`

The single-page public application described above. Despite being one route, it serves
all 11 views via client-side switching.

### `/admin` — Admin Dashboard
**File:** `src/app/admin/page.tsx`

A dedicated Next.js route for the CMS. It is a client component that:

1. Calls `hydrateAdmin()` on mount (restores the admin session from localStorage).
2. Renders `ScrollProgress` + `AdminApp`.

`AdminApp` internally manages its own "section" state (`overview` | `reservations` |
`menu` | `gallery` | `testimonials` | `events` | `catering` | `settings`) — this is
**not** URL-routed, so the admin URL is always `/admin` regardless of the active
section. The section switch is instant (no transition overlay) with a simple
`AnimatePresence` fade.

If no admin token is present, `AdminApp` renders the `LoginScreen` instead of the
dashboard.

### 404 — Not Found
**File:** `src/app/not-found.tsx`

A cinematic 404 page with a gold "404" gradient, an `OrnamentDivider`, and buttons to
return home or open the admin. Notably, it **auto-redirects admin URL typos**:

```ts
const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
if (/^\/admi(n|n-.*)?$/.test(path) || path.includes("admin") || path === "/admi") {
  if (path !== "/admin") router.replace("/admin");
}
```

This catches `/admi`, `/admin-panel`, `/admin/xyz`, etc., and sends the user to the real
`/admin` route.

### Layout
**File:** `src/app/layout.tsx`

The root `RootLayout` applies the three font CSS variables, sets metadata (title,
description, OpenGraph, Twitter card), renders the global film-grain overlay, and mounts
both toast providers (`Toaster` + `SonnerToaster`). It wraps every route.

---

## 3. API Routes

All API endpoints live under `src/app/api/` as Next.js Route Handlers. They are
**RESTful** and use the standard `GET` / `POST` / `PATCH` / `PUT` / `DELETE` exports.

### Route Tree

```
/api
├── /                           GET     Health check
│
├── /admin
│   ├── /login                  POST    Authenticate → JWT + cookie
│   ├── /logout                 POST    Clear auth cookie
│   └── /change-password        POST    Admin-protected password change
│
├── /categories/[id]            PATCH / DELETE   Menu category (admin)
│
├── /catering
│   ├── /                       GET (public) / POST (admin)
│   └── /[id]                   PATCH / DELETE (admin)
│
├── /events
│   ├── /                       GET (public) / POST (admin)
│   └── /[id]                   PATCH / DELETE (admin)
│
├── /gallery
│   ├── /                       GET (public) / POST (admin)
│   └── /[id]                   PATCH / DELETE (admin)
│
├── /menu
│   ├── /                       GET (public) categories+items / POST (admin) item|category
│   └── /[id]                   PATCH / DELETE (admin) item
│
├── /reservations
│   ├── /                       POST (public, creates PENDING) / GET (admin list)
│   └── /[id]                   PATCH (status) / DELETE (admin)
│
├── /settings                   GET (public) / PUT (admin) singleton
├── /stats                      GET (admin) dashboard aggregates
│
├── /testimonials
│   ├── /                       GET (public, ?featured=1) / POST (admin)
│   └── /[id]                   PATCH / DELETE (admin)
│
└── /upload                     POST (admin) image → /uploads/
```

### Auth Rules

| Route category | Auth requirement |
| --- | --- |
| Public reads (`GET /api/menu`, `/api/gallery`, `/api/testimonials`, `/api/events`, `/api/catering`, `/api/settings`) | **None** — open to all. |
| Public writes (`POST /api/reservations`) | **None** — visitors can book a table. |
| Admin reads (`GET /api/reservations`, `GET /api/stats`) | **JWT required** via `requireAdmin(req)`. |
| Admin writes (all `POST`/`PATCH`/`PUT`/`DELETE` except reservation creation) | **JWT required** via `requireAdmin(req)`. |
| Image upload (`POST /api/upload`) | **JWT required**. |

`requireAdmin` checks the `Authorization: Bearer <token>` header first, then falls back
to the `bo_admin_token` cookie. Invalid or expired tokens → `401 Unauthorized`.

### Dynamic Segments

Next.js App Router dynamic segments (`[id]`) are used for item-level operations. The
`id` is the Prisma `cuid()`. For example:

- `PATCH /api/menu/clk...abc` — update a menu item.
- `DELETE /api/gallery/clk...xyz` — delete a gallery image.

### Client Access

All client-side API access goes through `src/lib/api.ts`, which provides typed wrappers
that automatically inject the admin JWT from the Zustand store:

```ts
apiGet<T>(path)            // GET with Accept: application/json
apiPost<T>(path, body)     // POST JSON
apiPatch<T>(path, body)    // PATCH JSON
apiPut<T>(path, body)      // PUT JSON
apiDelete(path)            // DELETE
apiUpload(file)            // POST multipart/form-data to /api/upload
```

All paths are **relative** (e.g. `"/api/menu"`) so the Caddy gateway can route them.

---

## Routing Summary Table

| Mechanism | Scope | Example | Implementation |
| --- | --- | --- | --- |
| Client view router | Public site views | `#menu` → `MenuView` | Zustand `useApp` + `history.replaceState` |
| App Router route | Admin, 404, layout | `/admin` | `src/app/admin/page.tsx` |
| Route Handler | REST API | `GET /api/menu` | `src/app/api/menu/route.ts` |

---

## Gateway Considerations

A single external port is exposed via a Caddy gateway (`Caddyfile`). Implications:

- **All requests use relative paths.** The client never references `localhost:3000` or
  any direct port. `apiGet("/api/menu")` resolves relative to the current origin.
- **Cross-port requests** (e.g. to a WebSocket mini-service on port 3003) must include
  `?XTransformPort=<port>` in the URL query. The gateway strips it and forwards.
- **WebSocket connections** use `io("/?XTransformPort=3003")` — never a direct
  `http://localhost:3003` URL. (See `examples/websocket/` for the reference demo.)

This design means the application is portable across deployment targets without code
changes — only the gateway config adapts.
