# Admin CMS

The Black Orchid admin panel is a single-page React app served at `/admin` (`src/app/admin/page.tsx`). It mounts `AdminApp` (`src/components/admin/AdminApp.tsx`), which manages the sidebar, topbar, section routing, login screen, and change-password modal. Eight section components handle the actual CRUD work.

> **Source of truth**
> - `src/app/admin/page.tsx` — Next.js route (client component)
> - `src/components/admin/AdminApp.tsx` — shell + login + change password
> - `src/components/admin/AdminOverview.tsx` — dashboard
> - `src/components/admin/AdminReservations.tsx` — reservation management
> - `src/components/admin/AdminMenu.tsx` — menu items + categories
> - `src/components/admin/AdminGallery.tsx` — gallery images
> - `src/components/admin/AdminTestimonials.tsx` — testimonials
> - `src/components/admin/AdminEvents.tsx` — events
> - `src/components/admin/AdminCatering.tsx` — catering packages
> - `src/components/admin/AdminSettings.tsx` — site settings
> - `src/components/admin/ui.tsx` — shared admin UI primitives (Modal, ImageUploader, etc.)

---

## 1. Shell (`AdminApp`)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                     Sticky Topbar (h-14)                     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │              Section Content                     │
│ (sticky, │              (scrolls, max-w-[1600px])           │
│ h-screen)│                                                  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  Footer (sidebar footer: user card + Change Password + Sign Out) │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar
- **Desktop (`lg:block`):** sticky, full-height, width 256px expanded / 72px collapsed. Collapse state persists in `localStorage.bo_admin_sidebar_collapsed` (`"1"` / `"0"`). A small `ChevronLeft` button on the right edge toggles collapse; the icon rotates 180° when collapsed.
- **Mobile (`lg:hidden`):** hidden by default. A hamburger button in the topbar opens a drawer (`motion.aside` sliding in from the left, 288px wide). A backdrop (`bg-black/60 backdrop-blur-sm`) covers the rest. Tap backdrop or X to close.
- **Active section indicator:** uses Framer Motion `layoutId` for a smooth sliding gold bar (`bo-active-bg` + `bo-active-bar`). The `layoutId` is prefixed with `ds-` (desktop) or `ms-` (mobile) so the two sidebars animate independently.

### Sidebar nav (8 items)
| Key | Label | Icon |
|-----|-------|------|
| `overview` | Overview | `LayoutDashboard` |
| `reservations` | Reservations | `CalendarCheck` |
| `menu` | Menu | `UtensilsCrossed` |
| `gallery` | Gallery | `Images` |
| `testimonials` | Testimonials | `Star` |
| `events` | Events | `CalendarHeart` |
| `catering` | Catering | `Package` |
| `settings` | Settings | `Settings` |

### Sidebar footer
- **User card:** gold circular avatar with the user's first initial, name, email, and a role badge (`ADMIN` / `MANAGER` / `EDITOR`). When collapsed, only the avatar shows.
- **Change Password** button (with `KeyRound` icon) — opens the modal
- **Sign Out** button (with `LogOut` icon, red text)

### Topbar
- Hamburger (mobile only)
- Section title (Playfair font) — pulled from `SECTION_TITLES`
- "View Site" link (opens `/` in a new tab, gold text, hidden on mobile)
- "Back to site" button (ghost variant, navigates to `/`)

### Section transitions
Uses `<AnimatePresence mode="wait">` with `key={section}` so changing sections fades the old one out (opacity + y) before fading the new one in. Duration: 250ms.

### Auth gate
```tsx
if (!adminToken || !adminUser) {
  return <LoginScreen onSuccess={(token, user) => setAdmin(token, user)} onBack={goHome} />;
}
```
If either `adminToken` or `adminUser` is missing from the Zustand store, the LoginScreen renders instead of the shell. This is **client-side gating only** — the real protection is on the API routes via `requireAdmin()`.

---

## 2. Login Screen

A centered card with:
- Lock icon in a gold circle
- "Admin Access" heading (Playfair)
- "Sign in to manage Black Orchid" subtitle (Cormorant italic)
- Email field (with `Mail` icon, `autoComplete="username"`)
- Password field (with `Lock` icon, `autoComplete="current-password"`, error display)
- "Sign In" button (full-width, gold solid)
- Demo credentials banner: `admin@blackorchid.com · admin123`
- "Back to website" button (ghost)

Defaults pre-fill the demo credentials (`admin@blackorchid.com` / `admin123`) for convenience. On submit:
1. `apiPost("/api/admin/login", { email, password })`
2. On success: `onSuccess(res.token, res.user)` → `setAdmin(token, user)` → store + localStorage updated → shell renders
3. On failure: error message shown under the password field
4. Loading state: button shows "Signing in…" and is disabled

---

## 3. Change Password Modal

Opened from the sidebar footer. Modal with three fields:
- **Current Password** (with `Lock` icon, `autoComplete="current-password"`)
- **New Password** (with `KeyRound` icon, hint "Minimum 8 characters", `autoComplete="new-password"`)
- **Confirm New Password** (with `KeyRound` icon, `autoComplete="new-password"`)

### Client-side validation
- All three fields required
- `newPassword.length >= 8`
- `newPassword === confirm`
- `newPassword !== current`

### Submit flow
1. `apiPost("/api/admin/change-password", { currentPassword, newPassword })`
2. On success: toast "Password changed successfully. Please sign in again.", reset fields, close modal, call `onSignOut()` (which clears the session and redirects to `/`)
3. On failure: error message shown in a red callout at the bottom of the modal

### Note
The old JWT token remains technically valid for up to 12 hours after the password change (JWTs are stateless). Forcing re-login ensures the admin confirms the new password and any other sessions eventually fail.

---

## 4. Overview (`AdminOverview`)

The dashboard. Fetches `GET /api/stats` and `GET /api/menu` on mount.

### Layout
1. **Section title** — "Dashboard" with subtitle and an "Export Report" button (just shows a toast "Report queued" — no actual export yet)
2. **KPI row** (4 `StatCard`s in a 1/2/4-column grid):
   - Total Reservations (with sparkline + "+12% wow" delta)
   - Today's Reservations (with sparkline)
   - Pending Approval (icon switches to `AlertTriangle` if > 0, with "needs review" delta)
   - Revenue (mo) — hardcoded `$48,250` with "+8%" delta (placeholder, not from the API)
3. **7-day chart + Quick Actions** (2/1 column grid):
   - Left: Bar chart (Recharts) of daily reservation counts for the last 7 days. Gold gradient bars, custom tooltip with dark theme.
   - Right: Quick Actions list — 4 buttons that navigate to other sections (New Menu Item, Add Gallery Image, View Reservations, Site Settings)
4. **Recent Reservations + Activity feed** (2/1 column grid):
   - Left: Premium table (sticky header, zebra rows, hover highlight) showing the 6 most recent reservations. Columns: Guest (name + phone), Date/Time, Pax, Status. "View all" link jumps to Reservations.
   - Right: Activity timeline with gold dots on a vertical line, showing "New reservation from {name}" with relative time + status badge.
5. **Popular Dishes** — grid of featured menu items (up to 6). Each card has a 64px thumbnail, name, "Featured" badge, and price in gold.

### StatCard component
A premium KPI card with:
- Label (uppercase, muted)
- Large value (Playfair, 3xl)
- Optional delta (green ▲ or red ▼)
- Gold icon in a rounded square
- Optional **sparkline** (inline SVG with gold gradient fill)

### Loading state
Skeletons: 1 wide bar, 4 card skeletons, 2 grid skeletons.

---

## 5. Reservations (`AdminReservations`)

The most feature-rich section. Fetches `GET /api/reservations?status=...`.

### Premium table features
- **Sticky header** (`sticky top-0 z-10 bg-admin-card`)
- **Zebra rows** (odd rows `bg-white/[0.02]`)
- **Hover highlight** (`hover:bg-admin-gold/5`)
- **Sortable columns** — click a header to cycle `asc → desc → reset (createdAt desc)`. Indicators: `ArrowUp`, `ArrowDown`, `ChevronsUpDown`. Sortable keys: `date`, `guests`, `status`, `createdAt`.
- **Bulk selection** — checkbox column. "Select all on page" header checkbox (indeterminate state when some selected). Bulk actions bar appears when ≥ 1 selected: bulk confirm/cancel/complete/delete.
- **Pagination** — client-side, 10 per page (`PAGE_SIZE = 10`). Shows "Page X of Y" and a numbered button row.
- **Search/filter** — search box (filters by name/email/phone/date, client-side) + status dropdown (`ALL | PENDING | CONFIRMED | CANCELLED | COMPLETED`)
- **CSV export** — downloads `reservations-YYYY-MM-DD.csv` with all filtered rows. Headers: Name, Phone, Email, Date, Time, Guests, Status, Special.

### Detail modal
Clicking a row opens a modal with:
- Full reservation details (name, contact, date/time, guests, special requests, status, createdAt)
- Status action buttons: Confirm, Cancel, Complete (each calls `PATCH /api/reservations/:id` with the new status)
- Delete button (with confirm)

### Mutations
- `update(id, status)` — single status change
- `remove(id)` — single delete
- `bulkUpdate(status)` — sequential `PATCH`es over selected IDs, counts successes
- `bulkDelete()` — sequential `DELETE`s over selected IDs

All mutations end with `fetchList(status)` to refresh the table.

### Empty/loading states
- Loading (`list === null`): skeleton table
- Empty: `EmptyState` ("No reservations yet" / "New booking requests will appear here.")

---

## 6. Menu (`AdminMenu`)

The largest section by code. Manages both **categories** and **menu items** in one UI.

### Layout
- **Section title** — "Menu" with item count and "Add Item" / "Add Category" buttons
- **Category tabs** — horizontal pill row of categories. Clicking switches the active category filter. Each tab shows item count.
- **Item grid** — cards in a responsive grid (1/2/3 columns). Each card shows:
  - Thumbnail (with `featured` gold star badge and `chef` hat badge if applicable)
  - Name, tagline, price (gold)
  - Spice dots (0-3 flames)
  - Veg badge (if veg)
  - Available/Unavailable toggle (inline)
  - Edit / Delete buttons (on hover)

### Item modal (create/edit)
A large modal (`size="xl"`) with multiple sections divided by `SectionLabel`:

1. **Basics:** Name, Tagline, Price, Category (`SearchableSelect`), Short Description, Description (textarea)
2. **Dish Images:** `<MultiImageUploader>` — grid of thumbnails with cover badge on index 0, hover actions (Replace, Delete, Move Left/Right), and an "Add Image" tile. Paste URL fallback.
3. **Properties:** Spice level (`SearchableSelect`: None/Mild/Medium/Hot), Serving size, plus toggles:
   - Available (gold)
   - Vegetarian (green)
   - Featured (gold)
   - Chef Recommended (gold)
4. **Ingredients:** Tag input — free-text chips with add/remove. Comma or Enter to add.
5. **Allergens:** Tag input with quick-pick chips for common allergens (Gluten, Dairy, Eggs, Peanuts, Tree Nuts, Shellfish, Fish, Soy, Sesame, Mustard). Selected allergens show as gold chips.

### Category modal (create/edit)
Smaller modal with Name, Slug (auto-derived if empty), and Order.

### Mutations
- Create item: `POST /api/menu` (with all fields; `images`/`ingredients`/`allergens` arrays)
- Update item: `PATCH /api/menu/:id`
- Delete item: `DELETE /api/menu/:id`
- Create category: `POST /api/menu` with `body._type === "category"`
- Update category: `PATCH /api/categories/:id`
- Delete category: `DELETE /api/categories/:id` (cascade-deletes items)

After every mutation: `load()` refetches `/api/menu`.

### `MultiImageUploader` (in `AdminMenu.tsx`, not shared)
Grid of square thumbnails with:
- **Cover badge** on index 0 (gold star + "Cover")
- **Number badge** (top-right, "1", "2", ...)
- **Hover overlay** with: Replace (upload icon), Delete (trash icon), Move Left, Move Right
- **Add Image tile** at the end (opens file picker)
- **Paste URL fallback** (text input + "Add" button)

Validation: `image/*` types only, max 6 MB. Calls `apiUpload(file)` per image, then appends the returned URL to the `images` array.

---

## 7. Gallery (`AdminGallery`)

### Layout
- Section title with image count and "Add Image" button
- Bulk-add textarea — paste multiple URLs (one per line), each becomes a gallery image with default title "Gallery Image" and category "Interior"
- Image grid (responsive 2/3/4 columns). Each card shows:
  - The image (with hover overlay: Edit, Delete)
  - Title, category badge
  - Click to open edit modal

### Edit modal
- Title
- `<ImageUploader>` (single image)
- Caption
- Category (`SearchableSelect`: Food, Drinks, Interior, Events, Banquet)
- Order

### Mutations
- Create: `POST /api/gallery`
- Update: `PATCH /api/gallery/:id`
- Delete: `DELETE /api/gallery/:id` (with confirm)

---

## 8. Testimonials (`AdminTestimonials`)

### Layout
- Section title with count and "Add Testimonial" button
- Card grid (1/2/3 columns). Each card shows:
  - Avatar + name + role
  - 5-star rating (gold filled, muted empty)
  - Message (clamped to a few lines)
  - Featured badge (if featured)
  - Edit / Delete buttons (top-right, on hover)

### Edit modal
- Name, Role (optional)
- `<ImageUploader>` for avatar
- Rating (`SearchableSelect`: 1-5 stars)
- Message (textarea)
- Featured toggle (gold)

### Mutations
Standard CRUD. `featured` toggle is a `PATCH` with just `{ featured: boolean }`.

---

## 9. Events (`AdminEvents`)

### Layout
- Section title with count (and published count) + "Add Event" button
- Card grid (1/2/3 columns). Each card shows:
  - Event image (with publish/unpublish eye toggle on hover)
  - Title, formatted date (e.g. "22 Mar 2025")
  - Description (clamped)
  - Published/Unpublished badge
  - Edit / Delete buttons

### Edit modal
- Title, Date (`<input type="date">`)
- `<ImageUploader>` for event image
- Description (textarea)
- Published toggle

### Mutations
Standard CRUD. `togglePublish` is a `PATCH` with `{ published: !e.published }` — fires a toast "Event hidden" or "Event published".

### Note
The public `GET /api/events` only returns published events. Unpublished events are visible only in the admin UI (which fetches the same endpoint and relies on the local list — there's no separate admin-only list endpoint).

---

## 10. Catering (`AdminCatering`)

### Layout
- Section title with count and "Add Package" button
- Card grid (1/2/3 columns). Each card shows:
  - Package image
  - Name, guest range (with `Users` icon)
  - Description (clamped)
  - Price (gold, large)
  - Features list (split on `|`, each with a gold check icon)
  - Edit / Delete buttons

### Edit modal
- Name, Description (textarea)
- Price, Guests (e.g. "100–250 guests")
- `<ImageUploader>` for package image
- Features (textarea, pipe-separated — one feature per line, converted to `|`-joined string on save)
- Order

### Mutations
Standard CRUD. `features` is stored as a `|`-separated string in the DB; the modal uses a textarea with one feature per line for editing convenience.

---

## 11. Settings (`AdminSettings`)

The only section that uses `PUT` (full update) instead of `PATCH`. Loads `GET /api/settings` into a single `useState<SiteSettings | null>` and edits fields via a `set(key, value)` helper.

### Layout — 8 section cards in a 2-column grid:

| # | Section | Fields |
|---|---------|--------|
| 1 | **Branding** (`Sparkles` icon) | Restaurant Name, Tagline |
| 2 | **Hero Section** (`ImageIcon`) | Hero Title, Hero Subtitle (textarea) |
| 3 | **About Section** (`BookOpen`) | About Title, About Body (textarea, 4 rows) |
| 4 | **Banquet Section** (`GlassWater`) | Banquet Capacity, Banquet Description (textarea, 3 rows) |
| 5 | **Contact Information** (`Phone`) | Phone, Email, Address, WhatsApp Number (2-column sub-grid for Phone/Email) |
| 6 | **Business Hours** (`Clock`) | Weekday Hours, Weekend Hours (2-column sub-grid) |
| 7 | **Social Media** (`Share2`) | Instagram, Facebook, Twitter / X |
| 8 | **SEO Settings** (`Search`) | Meta Title, Meta Description (textarea, 3 rows) |

### Sticky save bar
A sticky bottom bar (z-30) with:
- "Changes are not live until you save." hint
- "Save All Changes" button (gold solid)

The entire form is saved at once via `PUT /api/settings` (the whole `form` object is sent; the API filters to the allowlist on the server side).

### Loading state
6 skeleton cards (2-column grid).

---

## 12. Shared UI Primitives (`ui.tsx`)

### Surfaces
- `<AdminCard>` — base card with optional `hover` (lift + shadow) and `elevated` (deeper surface) variants
- `<StatCard>` — KPI card with label, value, delta, icon, and optional sparkline
- `<Sparkline>` — inline SVG sparkline with gold gradient fill

### Modal (`<Modal>`)
A premium accessible modal:
- **Size variants:** `sm`, `md`, `lg`, `xl` (or `wide` for max-w-2xl)
- **Animation:** 150ms fade + scale (Framer Motion)
- **Overlay:** 70% black + `backdrop-blur-md`
- **z-index:** `z-[100]` (above everything except the page transition's 9998)
- **Body scroll lock:** `document.body.style.overflow = "hidden"` while open
- **Escape to close**
- **Focus trap:** Tab cycles within the modal; Shift+Tab wraps to the last focusable; Escape closes
- **Focus restoration:** saves `document.activeElement` on open, restores it on close
- **Auto-focus:** focuses the first focusable element 50ms after open
- **ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- **Sticky footer:** optional `footer` prop renders a sticky bottom bar (Cancel/Save pattern)

### Form fields
- `<AdminInput>` — labeled input with optional icon (left-aligned), error (red border + message), hint
- `<AdminTextarea>` — labeled textarea, same error/hint pattern
- `<SearchableSelect>` — premium dropdown with:
  - Search input (filters options by label)
  - Keyboard navigation: ArrowDown/ArrowUp to move, Enter to select, Escape to close
  - Active option highlighted in gold
  - Check icon on the selected option
  - Click-outside to close
  - Animated open/close (Framer Motion, 160ms)
- `<Toggle>` — animated switch with gold/green/blue variants and a spring-animated thumb

### `<AdminButton>`
Five variants: `solid` (gold gradient + glow), `outline` (border + subtle bg), `danger` (red), `ghost` (text only), `subtle` (low-contrast bg). Three sizes: `sm`, `md`, `lg`. Supports a `confirm` prop that shows a `window.confirm()` dialog before calling `onConfirm`.

### `<StatusBadge>`
Color-coded badge for reservation statuses:
- `PENDING` — amber
- `CONFIRMED` — emerald
- `CANCELLED` — red
- `COMPLETED` — sky blue

### `<Badge>`
Generic badge with tones: `gold`, `green`, `red`, `blue`, `neutral`.

### `<ImageUploader>`
Single-image uploader with:
- **Drag & drop** zone (with drag-over gold highlight)
- **Click to browse** (hidden file input)
- **Validation:** `image/*` types only, max 6 MB
- **Upload:** calls `apiUpload(file)` → returns URL → calls `onChange(url)`
- **Progress bar** (gold, animated)
- **Preview** with hover overlay: Replace / Remove
- **Paste URL** fallback (toggle between upload and URL input)

### `<MultiImageUploader>` (in `AdminMenu.tsx`)
Multi-image variant for menu items. See §6.

### `<Skeleton>`, `<EmptyState>`, `<Pagination>`
Standard loading/empty/pagination primitives.

---

## 13. Refresh Strategy

Every admin list section uses the same pattern:

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

After every successful mutation (create/update/delete), the component calls `load()` to refetch the full list. **No optimistic updates** — the UI always reflects the DB after the round trip.

This is intentionally simple. Trade-off: one extra request per mutation, but zero risk of UI/DB desync.

---

## 14. Toast Notifications

All success/error feedback uses `sonner` (imported as `toast`):

```tsx
toast.success("Reservation marked confirmed");
toast.error("Update failed");
```

Two `<Toaster>` instances are mounted in `src/app/layout.tsx`:
- `<Toaster />` from `@/components/ui/toaster` (Radix-based, legacy)
- `<SonnerToaster />` from `@/components/ui/sonner` (Sonner, the active one)

The legacy Toaster is mounted for compatibility with shadcn components that might use it; in practice, all admin code uses Sonner.

---

## 15. Accessibility in the Admin

- **Modals:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, focus restoration, Escape to close, body scroll lock (see §12)
- **SearchableSelect:** full keyboard nav (ArrowUp/Down/Enter/Escape)
- **Buttons:** all have `aria-label` when icon-only (e.g. close X, delete trash)
- **Toggles:** real `<button>` elements with `onClick` (not divs)
- **Tables:** semantic `<table>`/`<thead>`/`<tbody>`/`<th>`/`<td>`, sticky headers
- **Forms:** every input has a `<label>` (via `<AdminInput>` / `<AdminTextarea>`)
- **Color contrast:** the admin palette (`#0b0b0f` bg, `#f4f4f6` text, `#d4af37` gold) exceeds WCAG AA for normal text
- **Touch targets:** most buttons are 32-40px; some icon buttons are 32px (slightly under the 44px recommendation — a known minor gap on mobile)

---

## 16. Known Limitations

- **No drag-and-drop reordering** for menu items, gallery images, or features. The `@dnd-kit` packages are installed but not used in admin. Reordering is done via `order` field edits in the modal.
- **No undo.** Deletes are immediate. A confirmation dialog (`AdminButton`'s `confirm` prop or `window.confirm`) is the only safeguard.
- **No live preview.** Settings changes go live after "Save All" — there's no preview mode.
- **No draft/publish workflow** for menu items or gallery images (only Events have a `published` toggle). Menu items have `available` (visibility) but no draft state.
- **No multi-user editing.** Two admins editing the same menu item would race; the last save wins.
- **`POST /api/upload` route file** is referenced by `apiUpload()` and used by the uploaders, but the route handler file may need to exist at `src/app/api/upload/route.ts` for uploads to work in a fresh checkout. Verify the file is present after cloning.
