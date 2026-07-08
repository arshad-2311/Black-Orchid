# Task 6 — full-stack-developer (CRUD pages)

## Files edited
- `src/components/admin/AdminMenu.tsx`
- `src/components/admin/AdminGallery.tsx`
- `src/components/admin/AdminTestimonials.tsx`
- `src/components/admin/AdminEvents.tsx`
- `src/components/admin/AdminCatering.tsx`
- `src/components/admin/AdminSettings.tsx`

## Design-system primitives used (all from `@/components/admin/ui`)
`AdminCard`, `AdminButton`, `AdminInput`, `AdminTextarea`, `SearchableSelect`,
`Toggle`, `Modal`, `AdminSectionTitle`, `Badge`, `ImageUploader`, `Skeleton`,
`EmptyState`.

## Patterns applied (consistent across all 6 files)
1. **Loading pattern** — every list page uses `useState<T[] | null>(null)` and
   shows `Skeleton` placeholders shaped like the final layout while `null`.
   Effects use a `cancelled` flag guard and only call `setState` inside the
   async `.then()` / `.catch()` callbacks — never synchronously in the body
   (lint-safe for `react-hooks/set-state-in-effect`).
2. **Modal form pattern** — to avoid `useEffect(() => setForm(...), [item])`
   (which trips `react-hooks/set-state-in-effect`), each modal form component
   is conditionally mounted only when its modal is open:
   ```tsx
   {modal.open && (
     <XModal key={modal.x?.id ?? "new"} x={modal.x} onClose={...} onSaved={...} />
   )}
   ```
   Inside, `useState(() => deriveForm(x))` is a lazy initializer that reads
   the `x` prop exactly once on mount. A `key` based on the entity id forces
   a remount whenever the user opens a different entity. `Modal open` is
   always `true` (the form is only rendered when the modal is meant to be
   shown), and closing sets the parent state to `open: false` which
   unmounts the form + Modal together. Trade-off: the Modal exit animation
   does not play (the modal disappears instantly), but the enter animation
   still runs (AnimatePresence detects the new motion.div child).
3. **Footer-as-prop** — every Modal uses the `footer` prop for its sticky
   action bar (`Cancel` ghost + `Save` solid), keeping the body focused on
   form fields.
4. **ImageUploader everywhere** — menu dish image (4/3), gallery image (1/1),
   testimonial photo (1/1), event poster (16/10), catering package image
   (16/10). All accept either a data URL (drag&drop) or a pasted URL via the
   built-in "Paste URL" toggle.
5. **Icon-only action buttons** — raw `<button>` with
   `flex h-9 w-9 items-center justify-center rounded-lg border` for
   edit/delete/feature/publish toggles. ≥40px target, ARIA labels on every
   icon-only button. Confirm before destructive actions via `window.confirm`
   inside the click handler (kept the existing contract — `AdminButton`
   `confirm` prop is also available but raw buttons matched the icon-row
   styling better).
6. **Admin tokens** — `text-admin-text`, `text-admin-muted`, `text-admin-gold`,
   `bg-admin-bg`, `bg-admin-card`, `border-admin-border` everywhere.
   Headings `font-[family-name:var(--font-playfair)]`, quotes
   `font-[family-name:var(--font-cormorant)] italic`. Gold gradient text/bg
   classes (`admin-gold-text` / `admin-gold-bg`) used on the existing
   `AdminButton` / `Badge` components.

## Per-file notes

### AdminMenu.tsx
- `AdminSectionTitle` "Menu Management" subtitle "{n} categories · {m} items",
  action = `outline sm "Add Category"` + `solid sm "Add Item"` (disabled while
  loading or when there are no categories yet).
- Each category is an `AdminCard p-0` with a translucent header row
  (grip icon + Playfair name + `Badge tone="gold"` item count + inline
  rename/delete icon buttons) and a divided list of item rows.
- Item row: 56×56 rounded-xl thumbnail (or `UtensilsCrossed` placeholder),
  Playfair name + badges row (`Featured` gold star pill, `Veg`/`NV` Badge
  green/red, `SpiceDots` 0–3 `Flame` icons orange, `Sold Out` red Badge when
  `!available`), description in muted xs, gold Playfair `$price`, edit/delete
  icon buttons revealed on hover/focus. Row hover `hover:bg-admin-gold/5`.
- Item modal (`Modal size="xl"`): two-col Name + Price, Description textarea,
  two-col Category (SearchableSelect) + Spice Level (SearchableSelect,
  `searchable={false}`), Dish Image (ImageUploader 4/3), and a Toggles row
  in a tinted box: Veg (gold), Featured (gold), Available (green). Sticky
  footer Cancel (ghost) + Save Item (solid).
- Category modal (`Modal size="sm"`): single Name input, footer Cancel + Create.
- Category rename kept via `window.prompt` (cleaner than embedding a tiny
  rename modal), delete via `window.confirm`.
- Removed the local `Toggle` definition — now uses the shared animated
  `Toggle` from `ui.tsx`.
- Loading: 2 skeleton category cards with skeleton header + 3 skeleton item
  rows each. Empty state: `EmptyState` with "Add Category" CTA when no
  categories exist.
- APIs kept: `GET /api/menu`, `POST /api/menu` (with `_type:"category"` for
  categories), `PATCH /api/menu/:id`, `DELETE /api/menu/:id`,
  `PATCH /api/categories/:id` (rename), `DELETE /api/categories/:id`.

### AdminGallery.tsx
- `AdminSectionTitle` "Gallery" subtitle "{n} images", action `solid sm "Add Image"`.
- **Bulk upload card** at top: `AdminCard p-5` with a gold `Upload` icon chip,
  Playfair "Bulk Upload" heading, muted helper text, a raw `<textarea>` styled
  with `admin-input h-auto resize-none py-3` for pasting URLs (one per line),
  and an outline "Add All" button. Iterates URLs, POSTs each, toasts the
  success count, refetches.
- **Image grid**: 2/3/4 cols responsive, each tile is a square
  `group relative overflow-hidden rounded-xl border border-admin-border`.
  On hover: dark gradient overlay with edit/delete icon buttons top-right and
  Playfair title + `Badge tone="gold"` category bottom-left.
- Image modal (`Modal size="md"`): ImageUploader (1/1), Title (required),
  Caption, Category (SearchableSelect, `searchable={false}`). Sticky footer
  Cancel + Save.
- Loading: 8 skeleton square tiles. Empty state with "Add Image" CTA.
- APIs kept: `GET/POST/PATCH/DELETE /api/gallery`.

### AdminTestimonials.tsx
- `AdminSectionTitle` "Testimonials" subtitle "{n} testimonials · {m} featured",
  action `solid sm "Add"`.
- Grid (sm:2) of `AdminCard` (flex-col, p-5). Header row: 48px avatar (image
  or initial-letter fallback in a gold-tinted circle, `ring-2 ring-admin-gold/30`)
  + Playfair name + gold-xs role + `Featured` Badge if featured. Star rating
  row (`Stars` component renders 5 `Star` icons, filled gold for `rating`
  count, muted outline for the rest). Quote in Cormorant italic with curly
  quotes. Footer (border-top): featured-toggle star button (filled gold if
  featured, muted outline if not — calls `apiPatch {featured}`), edit, delete.
- Modal (`Modal size="lg"`): Name + Role (two-col), Photo (ImageUploader 1/1),
  Message (AdminTextarea rows 3, required), Rating (SearchableSelect 5/4/3/2/1
  stars, `searchable={false}`) + Featured (Toggle gold) in a two-col row with
  the toggle in a tinted box. Sticky footer Cancel + Save.
- Loading: 4 skeleton cards. Empty state with "Add Testimonial" CTA.
- APIs kept: `GET/POST/PATCH/DELETE /api/testimonials`.

### AdminEvents.tsx
- `AdminSectionTitle` "Events" subtitle "{n} events · {m} published", action
  `solid sm "Add Event"`.
- Grid (sm:2, lg:3) of `AdminCard p-0` (flex-col). Poster image 16/10 (or
  `CalendarDays` placeholder), `Hidden` Badge overlay if `!published`. Body:
  gold `Badge` with `CalendarDays` + formatted date, Playfair title,
  line-clamp-2 description. Footer (border-top): publish toggle button
  (emerald when published with `Eye`, muted when hidden with `EyeOff`),
  edit, delete (ml-auto).
- Modal (`Modal size="lg"`): Title (required), Description (AdminTextarea
  rows 3), Date (AdminInput type date, required) + Published (Toggle green)
  in a two-col row with toggle in a tinted box, Poster Image (ImageUploader
  16/10). Sticky footer Cancel + Save Event.
- `formatDate` helper for `toLocaleDateString` "10 Nov 2025" style.
- Loading: 3 skeleton cards. Empty state with "Add Event" CTA.
- APIs kept: `GET/POST/PATCH/DELETE /api/events`.
- Pre-existing data note (NOT introduced by this task): `GET /api/events`
  filters `published: true` only, so the admin page will only ever show
  published events. The publish toggle still works (PATCH), but hidden
  events disappear from the list on next refetch. Flagging for the main
  agent; out of scope to fix here.

### AdminCatering.tsx
- `AdminSectionTitle` "Catering Packages" subtitle "{n} packages", action
  `solid sm "Add Package"`.
- Grid (lg:3) of `AdminCard p-0` (flex-col). Image 16/10 (or `Package`
  placeholder). Body (p-5): Playfair name, gold-xs guests with `Users` icon,
  gold Playfair `$price` + `/guest` muted, line-clamp-2 description, features
  list (`splitFeatures` splits on `|`, shows up to 4 with `Check` emerald
  icons, "+N more" overflow). Footer (border-top): Edit outline button +
  delete icon (ml-auto).
- Modal (`Modal size="lg"`): Name (required), Description (AdminTextarea
  rows 2), Price (number, required) + Guests (two-col), Package Image
  (ImageUploader 16/10), Features (AdminTextarea rows 3 with manual hint
  paragraph below — `AdminTextarea` doesn't accept `hint` prop, so the hint
  is rendered as a separate `<p className="mt-1.5 text-xs text-admin-muted">`
  matching the `AdminInput` hint styling). Sticky footer Cancel + Save
  Package.
- Loading: 3 skeleton cards. Empty state with "Add Package" CTA.
- APIs kept: `GET/POST/PATCH/DELETE /api/catering`.

### AdminSettings.tsx
- `AdminSectionTitle` "Website Settings" subtitle "Manage all public-facing
  content from one place.", action `solid sm "Save All"` with `Save` icon
  (disabled while loading or saving).
- 2-col grid (lg) of 8 `AdminCard p-6` sections, each with a gold icon chip +
  Playfair gold heading: Branding (`Sparkles`), Hero Section (`ImageIcon`),
  About Section (`BookOpen`), Banquet Section (`GlassWater`), Contact
  Information (`Phone`), Business Hours (`Clock`), Social Media (`Share2`),
  SEO Settings (`Search`).
- Each section's fields use `AdminInput`/`AdminTextarea`. Contact groups
  Phone+Email in a two-col sub-grid; Business Hours groups Weekday+Weekend.
- `set(k, v)` helper uses functional `setForm((s) => s ? {...s, [k]: v} : s)`
  so the `null` loading state is type-safe.
- Loading: 6 skeleton section cards (skeleton heading + 3 skeleton inputs).
- **Sticky bottom save bar** added (`sticky bottom-4 z-30` +
  `admin-surface-elevated shadow-soft-lg`) with "Changes are not live until
  you save." text + a solid "Save All Changes" button — feels like Linear /
  Notion settings pages. The top action button is also kept for parity.
- Single `save()` PUTs the whole form to `/api/settings` via `apiPut`. The
  API still whitelists known fields server-side.
- APIs kept: `GET /api/settings`, `PUT /api/settings`.

## Lint / type-check result
- `cd /home/z/my-project && bun run lint` → **0 errors, 0 warnings**.
- `bunx tsc --noEmit` → 0 errors in my 6 files. (Pre-existing errors in
  `examples/`, `skills/`, and `src/app/api/settings/route.ts` are NOT mine —
  the settings route error is a Prisma `create` typing issue from before
  this task.)
- Verified that none of my effects call `setState` synchronously in the
  body — all `setCategories`/`setImages`/`setList`/`setForm` calls happen
  inside `.then()` / `.catch()` callbacks or event handlers. Lazy
  `useState(() => deriveForm(...))` initializers are used in every modal
  form to avoid the `react-hooks/set-state-in-effect` trap.

## Dev server
Did NOT restart. The dev server (port 3000) was already running and compiled
the project successfully before and after my edits.
