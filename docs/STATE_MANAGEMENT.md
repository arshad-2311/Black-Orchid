# State Management

Black Orchid uses a deliberately small state layer: a single **Zustand** store for cross-cutting client state (current view + admin session), a thin **fetch wrapper** (`api.ts`) for all server communication, and **local `useState`** inside each component for ephemeral form/UI state. There is **no Redux**, and although `@tanstack/react-query` is installed, it is **not used for data fetching** in this project — every list refresh is a manual `load()` call.

> **Source of truth**
> - `src/lib/store.ts` — Zustand store + `hydrateAdmin()`
> - `src/lib/api.ts` — `apiGet` / `apiPost` / `apiPatch` / `apiPut` / `apiDelete` / `apiUpload`
> - `src/lib/types.ts` — shared TypeScript types matching Prisma models

---

## 1. Why This Shape

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Cross-component client state | Zustand | Minimal API, no boilerplate, works outside React (the `api.ts` helper reads the token via `useApp.getState()`) |
| Server state | Direct `fetch` via `api.ts` + manual `load()` | The dataset is small (single restaurant's CMS); React Query's machinery is overkill and adds bundle weight |
| Form state | Local `useState` in each modal | Forms are short-lived and modal-scoped; lifting them to a global store would couples modals to each other |
| Optimistic updates | **None** — always re-fetch after mutation | Data integrity over perceived speed; admin sees the truth immediately after save |

---

## 2. Zustand Store (`src/lib/store.ts`)

### Shape

```ts
type State = {
  // ---- Public site ----
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // ---- Admin auth (client-side gating only; API does the real protection) ----
  adminUser: { name: string; email: string; role: string } | null;
  adminToken: string | null;
  setAdmin: (token: string, user: { name: string; email: string; role: string }) => void;
  clearAdmin: () => void;
};
```

### `ViewKey` union (12 views)

```ts
type ViewKey =
  | "home" | "about" | "menu" | "banquet" | "gallery" | "catering"
  | "contact" | "hours" | "reservation" | "privacy" | "terms" | "admin";
```

These are **not Next.js routes** — the public site is a single `/` route (defined in `src/app/page.tsx`) that swaps between view components based on `view`. The admin panel lives at the dedicated `/admin` route (`src/app/admin/page.tsx`).

### `setView(v)`
- Sets `view` in the store
- Scrolls `window` to top with `behavior: "auto"` (so the new view starts at the top, not animated)
- Updates `window.location.hash` via `history.replaceState` (no extra routes, no scroll jump). Home is `#`, others are `#menu`, `#gallery`, etc.
- The page transition (Liquid Glass Bloom) is handled by `page.tsx`'s `useEffect` on `view`, **not** by `setView` itself — `setView` is purely a state mutation

### `setAdmin(token, user)`
- Sets `adminToken` + `adminUser` in the store
- Persists both to `localStorage`:
  - `bo_admin_token` — the JWT string
  - `bo_admin_user` — JSON-serialized `{ name, email, role }`
- Does **not** set the httpOnly cookie — that's the server's job (see `POST /api/admin/login`)

### `clearAdmin()`
- Nulls `adminToken` + `adminUser`
- Removes both `localStorage` keys
- Does **not** clear the httpOnly cookie — that's `POST /api/admin/logout`'s job. (In practice, `AdminApp.signOut()` calls both `clearAdmin()` and the route pushes the user back to `/`, and the cookie is cleared on the next logout API call.)

### `hydrateAdmin()` — called once on mount
```ts
// Called from src/app/page.tsx on mount:
useEffect(() => { hydrateAdmin(); ... }, []);
```

It does three things:
1. Reads `bo_admin_token` and `bo_admin_user` from `localStorage`. If both exist (and the user JSON parses), it calls `useApp.setState({ adminToken, adminUser })`. This restores the admin session across reloads.
2. Reads `window.location.hash` and, if it matches a valid `ViewKey`, sets the store's `view` so deep links like `/about#menu` work.
3. Adds a `hashchange` listener so manual URL edits (or back/forward) keep the view in sync.

### Why a function instead of doing it in the store initializer?
Zustand store initializers run once at module load, which on Next.js happens on the **server** during SSR. `localStorage` and `window.location.hash` don't exist there. `hydrateAdmin()` is called inside `useEffect`, which only runs on the client.

---

## 3. API Helpers (`src/lib/api.ts`)

All six helpers share three behaviors:

1. **Auth header injection.** A private `authHeaders()` reads `useApp.getState().adminToken` and returns `{ Authorization: "Bearer <token>" }` if present, or `{}` if not. Because Zustand stores are readable outside React, this works in any client function — no hooks required.
2. **JSON by default.** `apiGet`/`apiPost`/`apiPatch`/`apiPut` send `Content-Type: application/json` and `JSON.stringify(body)`. `apiUpload` sends `FormData` and **deliberately does not** set `Content-Type` (the browser sets the multipart boundary).
3. **Error surface.** Non-2xx responses throw an `Error` whose `message` is the server's `error` field (if present) or a fallback like `"GET /api/menu failed"`. Callers `try/catch` and `toast.error(err.message)`.

### `apiGet<T>(path)` → `Promise<T>`
```ts
const res = await fetch(path, { headers: { Accept: "application/json", ...authHeaders } });
if (!res.ok) throw new Error(`GET ${path} failed`);
return res.json();
```

### `apiPost<T>(path, body)` → `Promise<T>`
Sends `POST` with JSON body. Parses the response JSON (or `{}` if non-JSON) and throws `Error(data.error || "POST ${path} failed")` on failure.

### `apiPatch<T>(path, body)` → `Promise<T>`
Same as `apiPost` but with `PATCH`. Used for partial updates (e.g. updating a reservation's status, toggling a menu item's `featured` flag).

### `apiPut<T>(path, body)` → `Promise<T>`
Same as `apiPost` but with `PUT`. Used for full-replace endpoints — currently only `/api/settings`.

### `apiDelete(path)` → `Promise<void>`
```ts
const res = await fetch(path, { method: "DELETE", headers: await authHeaders() });
if (!res.ok) throw new Error(`DELETE ${path} failed`);
```
Returns `void`. The server may return `{ ok: true }` but the helper doesn't parse it.

### `apiUpload(file)` → `Promise<string>`
```ts
const formData = new FormData();
formData.append("file", file);
const res = await fetch("/api/upload", {
  method: "POST",
  headers: await authHeaders(), // NOTE: no Content-Type — browser sets boundary
  body: formData,
});
// returns { url: string } on success
return (await res.json()).url;
```

Used by `ImageUploader` and `MultiImageUploader` (admin UI). The returned URL is stored in the DB as a string (e.g. in `MenuItem.image` or appended to `MenuItem.images` JSON), never as Base64.

### Query string convention
Two endpoints accept query params:
- `GET /api/testimonials?featured=1` — returns only featured testimonials (Home page)
- `GET /api/reservations?status=PENDING` — admin filter (AdminReservations)

Query strings are constructed inline in the caller, e.g. `` apiGet(`/api/reservations${status !== "ALL" ? `?status=${status}` : ""}`) ``.

---

## 4. Component Data Flow

### Public site components
Each view component (`Home`, `MenuView`, `GalleryView`, etc.) does its own fetching in `useEffect` and stores results in local `useState`. Example from `Home.tsx`:

```tsx
const [categories, setCategories] = useState<MenuCategory[]>([]);
const [gallery, setGallery] = useState<GalleryImage[]>([]);
const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

useEffect(() => {
  apiGet<MenuCategory[]>("/api/menu").then(setCategories).catch(() => {});
  apiGet<GalleryImage[]>("/api/gallery").then(setGallery).catch(() => {});
  apiGet<Testimonial[]>("/api/testimonials?featured=1").then(setTestimonials).catch(() => {});
}, []);
```

Pattern notes:
- **No loading flag.** Components render with empty arrays (or `null` if explicitly typed) and let the UI show skeletons or empty states. `AdminOverview` and the admin list views **do** use a `null` sentinel to distinguish "loading" from "loaded empty": `useState<T[] | null>(null)`.
- **No error state.** `.catch(() => {})` swallows errors silently on the public site. The admin sections use `.catch(() => setList([]))` and `toast.error`.
- **No cleanup flag.** Most effects don't guard against setState-on-unmounted, because the views are mounted once and stay mounted. `AdminOverview` and `AdminReservations` do use a `cancelled` flag because they refetch on filter changes.

### Admin list components
Every admin section (`AdminMenu`, `AdminGallery`, `AdminReservations`, `AdminTestimonials`, `AdminEvents`, `AdminCatering`) follows the same pattern:

```tsx
const [list, setList] = useState<T[] | null>(null);

useEffect(() => {
  let cancelled = false;
  apiGet<T[]>("/api/...").then((d) => { if (!cancelled) setList(d); })
                         .catch(() => { if (!cancelled) setList([]); });
  return () => { cancelled = true; };
}, []);

const load = () => apiGet<T[]>("/api/...").then(setList).catch(() => {});
```

`list === null` → render `<Skeleton />`. `list === []` → render `<EmptyState />`. Otherwise render the list.

### `load()` is the refresh strategy
There is no global cache invalidation. After every successful mutation (create/update/delete), the component calls `load()` to refetch the full list. Example from `AdminGallery`:

```tsx
const remove = (img) => {
  apiDelete(`/api/gallery/${img.id}`)
    .then(() => { toast.success("Image deleted"); load(); })
    .catch(() => toast.error("Delete failed"));
};
```

This is the **only** refresh mechanism. No optimistic updates, no client-side cache patching. Trade-off: one extra round trip per mutation, but the UI always reflects the DB.

---

## 5. Form State

Each modal manages its own form state with local `useState`. Example from `AdminApp.tsx` (Change Password modal):

```tsx
const [current, setCurrent] = useState("");
const [next, setNext] = useState("");
const [confirm, setConfirm] = useState("");
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
```

There is no shared form library (no `react-hook-form` usage in admin, though it is installed for the shadcn `Form` component). Validation runs inline before submit:

```tsx
if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
if (next !== confirm) { setError("New passwords do not match"); return; }
```

`AdminSettings` is the exception — it loads the entire `SiteSettings` object into a single `useState<SiteSettings | null>` and edits fields via a `set(key, value)` helper:

```tsx
const set = (k: keyof SiteSettings, v: string) =>
  setForm((s) => (s ? { ...s, [k]: v } : s));
```

The whole form is saved at once via `PUT /api/settings` (the sticky bottom "Save All Changes" bar).

---

## 6. Why No React Query?

`@tanstack/react-query` is in `package.json` (a transitive expectation of the shadcn/ui scaffold), but no component imports it. Reasons:

1. **Dataset is small and slow-changing.** A restaurant CMS has hundreds of rows, not millions. Manual `load()` after mutation is fine.
2. **Bundle weight.** React Query adds ~13 KB gzipped. Skipping it keeps the client leaner.
3. **Mental model.** Every admin component already has a clear `load()` function. Adding a `useQuery` layer would duplicate the existing pattern without clear benefit.
4. **Auth header injection.** The current `authHeaders()` pattern reads from Zustand synchronously. React Query would require a `queryFn` that does the same thing — no net win.

If the app grew to need background refetching, retry logic, or optimistic updates, React Query would be the right addition. As of this writing, it is unused.

---

## 7. State Persistence Summary

| What | Where | Lifetime |
|------|-------|----------|
| `view` | Zustand (in-memory) + `window.location.hash` | Survives reload (hash is read by `hydrateAdmin`) |
| `adminToken` | Zustand + `localStorage.bo_admin_token` + httpOnly cookie `bo_admin_token` | 12 hours (JWT expiry); localStorage survives reload; cookie cleared on logout |
| `adminUser` | Zustand + `localStorage.bo_admin_user` | Same as token |
| Sidebar collapse | `localStorage.bo_admin_sidebar_collapsed` ("1"/"0") | Persists across sessions |
| Form drafts | Local `useState` | Lost on unmount/refresh (intentional) |
| List data | Local `useState` | Refetched on mount and after every mutation |

---

## 8. Concurrency & Race Conditions

- **`cancelled` flag pattern.** Admin list effects set `let cancelled = false` and check before `setList`. This prevents a stale fetch (e.g. from a previous filter value) from overwriting a newer one. Example: `AdminReservations` filters by status; if the user clicks `PENDING` then `CONFIRMED` quickly, the second fetch wins.
- **Bulk operations are sequential.** `AdminReservations.bulkUpdate` loops over selected IDs and awaits each `apiPatch` individually. Failures are silently skipped, and a single toast reports the count. This is intentionally simple — parallel `Promise.all` would complicate error reporting.
- **No debounce on search.** `AdminReservations` filters client-side after fetch (the search box filters the already-loaded list), so there's no fetch-on-keystroke to debounce.

---

## 9. Anti-Patterns Avoided

- ❌ **No `useEffect` with `setState` in the body.** All effects either return a cleanup function or guard with `cancelled`.
- ❌ **No prop drilling for auth.** `api.ts` reads the token from the store directly; components don't need to pass it down.
- ❌ **No global error boundary for fetches.** Each `.catch` is local and surfaces a toast. A global boundary would hide actionable errors from the admin.
- ❌ **No SSR for admin data.** The admin panel is fully client-rendered (the `/admin` route is a client component). No server components fetch admin data — the API enforces auth via `requireAdmin()`.
