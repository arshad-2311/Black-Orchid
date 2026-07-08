# Black Orchid Admin Redesign — Worklog

This file tracks all agent work for the premium admin dashboard redesign.
Each agent MUST read this before starting and append a `---` section after finishing.

---
Task ID: 1+2
Agent: main
Task: Build admin design-system foundation (theme tokens + shared UI primitives)

Work Log:
- Added admin palette to globals.css: --admin-bg #0B0B0F, --admin-card #141418, --admin-elevated #1a1a20, --admin-border rgba(255,255,255,0.08), --admin-gold #D4AF37, --admin-text #f4f4f6, --admin-muted #8a8a96; registered as --color-admin-* tokens in @theme inline.
- Added admin utility classes scoped to .admin-root: .admin-surface / .admin-surface-elevated (translucent cards w/ soft shadows, 14px radius), .admin-glass, .shadow-soft / .shadow-soft-lg / .shadow-gold-glow, .admin-gold-bg / .admin-gold-text (gold gradient), .admin-input (50px height, 12px radius, premium focus ring w/ gold glow), .admin-label, admin scrollbar styling, .admin-fade-up entrance, .admin-skeleton shimmer.
- Rewrote src/components/admin/ui.tsx with the full premium component library:
  - AdminCard (hover/elevated variants)
  - StatCard (icon, value, delta, mini Sparkline svg)
  - Sparkline helper
  - AdminSectionTitle
  - Modal (scale+fade, 32-40px padding, sticky footer via `footer` prop, size sm/md/lg/xl, header subtitle)
  - AdminInput (50px, label w/ required indicator, error/hint, leading icon)
  - AdminTextarea
  - SearchableSelect (custom dropdown: keyboard nav, search filter, animated open/close, rounded menu, check mark)
  - Toggle (animated spring thumb, gold/green/blue colors)
  - AdminButton (solid gold glow+lift / outline glass / danger / ghost / subtle; sizes sm/md/lg; built-in `confirm` prop for confirmation dialog)
  - StatusBadge (with status dot)
  - Badge (gold/green/red/blue/neutral tones)
  - ImageUploader (drag&drop + click to browse, FileReader→dataURL, progress bar, replace/remove on hover, file type+size validation, URL paste fallback, aspect ratio control)
  - Skeleton, EmptyState, Pagination

Stage Summary:
- Design system is ready. All admin pages should import from "@/components/admin/ui".
- IMPORTANT API notes for downstream agents:
  - `AdminButton` no longer takes `variant` only; signature: `({variant?: "solid"|"outline"|"danger"|"ghost"|"subtle", size?: "sm"|"md"|"lg", confirm?, onConfirm?, ...buttonProps})`. Use `confirm="Are you sure?" onConfirm={fn}` for danger actions (shows window.confirm). For plain danger without confirm, just use variant="danger".
  - `Modal` now uses `size` (sm/md/lg/xl) or `wide` (legacy=lg). Pass `footer={<><AdminButton.../></>}` for sticky footer actions. Header can take `subtitle`.
  - `AdminInput`/`AdminTextarea` take optional `label`, `required`, `error`, `hint`, `icon`. They render their own label — do NOT wrap in a separate label.
  - `SearchableSelect` props: `{label, required, options:[{value,label}], value, onChange, placeholder, error, searchable}`. Replaces the old `AdminSelect`.
  - `Toggle` props: `{checked, onChange, label, color}`.
  - `ImageUploader` props: `{value, onChange, label, aspect}` — use instead of plain image URL inputs everywhere (menu items, gallery, events, catering, testimonials photo). value is a string (data URL or http URL).
  - `AdminCard` props: `{children, className, hover, elevated, onClick}`.
  - `StatCard` props: `{label, value, icon, delta, deltaPositive, spark}`.
  - `AdminSectionTitle` props: `{title, subtitle, action}` — use at top of each page instead of raw h1.
  - `StatusBadge`, `Badge`, `Skeleton`, `EmptyState`, `Pagination` available.
- Color usage in JSX: use Tailwind classes `text-admin-text`, `text-admin-muted`, `text-admin-gold`, `bg-admin-bg`, `bg-admin-card`, `border-admin-border` (these map to the tokens). For gold gradient text use class `admin-gold-text`. For gold gradient bg use `admin-gold-bg`.
- Wrap the whole admin app in a div with className="admin-root" so the scoped palette + scrollbar apply.
- The store + API helpers are unchanged: `useApp` (adminUser/adminToken/setAdmin/clearAdmin), `apiGet/apiPost/apiPatch/apiPut/apiDelete` from "@/lib/api", `toast` from "sonner".

---
Task ID: 3+4
Agent: full-stack-developer (AdminApp + AdminOverview)
Task: Redesign the admin shell (login + authenticated layout) and the dashboard overview page using the premium admin design system from Task 1+2.

Work Log:
- Read worklog.md and ui.tsx to understand the design-system primitives (AdminCard, StatCard, AdminSectionTitle, AdminInput, AdminButton, StatusBadge, Badge, Skeleton, EmptyState) and admin color tokens (bg-admin-bg, bg-admin-card, text-admin-text, text-admin-muted, text-admin-gold, admin-gold-bg, admin-surface-elevated, admin-glass, admin-fade-up, shadow-soft, etc.).
- Rewrote `src/components/admin/AdminApp.tsx`:
  - Wrapped BOTH the login view and the authenticated layout in `<div className="admin-root">` so the scoped admin palette + custom scrollbar apply everywhere.
  - Login screen: elevated glass card (`admin-surface-elevated`, p-10), gold lock icon in a circle, "Admin Access" title in Playfair, Cormorant-italic subtitle, `AdminInput` with `icon={Mail}` / `icon={Lock}` for email/password, full-width solid `AdminButton` (size lg) "Sign In", demo-credentials hint box, ghost "Back to website" button, Framer Motion fade-up entrance. Login errors now surface via the `error` prop on the password `AdminInput`. Kept `apiPost("/api/admin/login")` → `onSuccess(token,user)` → `useApp().setAdmin(token,user)`; kept `onBack` → `router.push("/")`.
  - Authenticated layout: collapsible desktop sidebar (sticky, h-screen, width 256 ↔ 72px via inline style + `transition-[width] duration-300`). Collapse state initialized lazily from `localStorage["bo_admin_sidebar_collapsed"]` and persisted via a side-effect-only `useEffect` (no setState in effect body — compliant with the `react-hooks/set-state-in-effect` rule). Floating chevron toggle button at the sidebar's right edge.
  - Active nav indicator uses two Framer Motion `layoutId` elements (gold-tinted bg + left gold bar) per nav item for a smooth sliding indicator. Desktop and mobile use different layoutId prefixes (`ds-*` / `ms-*`) to avoid conflicts when both are mounted.
  - Sidebar header (gold logo circle + Playfair "Admin Panel" + Cormorant "Black Orchid CMS") collapses to icon-only; nav items use h-4 w-4 icons centered with rounded-xl hover states and `title` tooltips when collapsed; footer user card (avatar, name, email, role badge) collapses to just an avatar; red "Sign Out" calls `clearAdmin()` then `router.push("/")`.
  - Mobile drawer: fixed, slide-in from left (w-72), spring transition, scrim overlay (click to dismiss), hamburger in topbar (`lg:hidden`), auto-closes on section select. Mobile drawer's SidebarContent gets an `onClose` → renders an X close button in the header.
  - Sticky topbar: h-14, `admin-glass` backdrop blur, border-bottom admin-border; left = mobile hamburger + Playfair text-lg section title (mapped via SECTION_TITLES); right = small gold "View Site" link (`<a target="_blank">`) + ghost sm "Back to site" AdminButton.
  - Main content area: `p-4 sm:p-6 lg:p-8`, inner `max-w-[1600px] mx-auto`. Section transitions kept as `AnimatePresence mode="wait"` with fade-up.
  - Kept existing `NAV` array, `Section` type, and section→component routing. AdminOverview now receives `onNavigate={(s) => setSection(s as Section)}`.
- Rewrote `src/components/admin/AdminOverview.tsx`:
  - New prop: `onNavigate?: (section: string) => void` (typed as string to avoid circular Section import). Used by Quick Actions, "View all" links in Recent Reservations / Popular Dishes.
  - `AdminSectionTitle` with title "Dashboard", subtitle "A snapshot of tonight's service and beyond.", action = outline sm AdminButton "Export Report" → `toast.success("Report queued")`.
  - Top row: 4 KPI StatCards with sparklines — Total Reservations (CalendarCheck, +12% wow, spark from weekly counts), Today's Reservations (Clock, spark = last 7), Pending Approval (AlertTriangle icon when >0 with "needs review" delta in red, Users icon when 0), Revenue "$48,250" (DollarSign, +8%).
  - Second row (lg:grid-cols-3): left col-span-2 is the recharts BarChart "Reservations · Last 7 Days" restyled for the admin palette — gold gradient bars (#e6c659→#b8902a), dark tooltip (#141418 bg + gold border + gold label), no CartesianGrid, rounded bar tops (radius [8,8,0,0]), maxBarSize 48, "This week" Badge in the header. Right card is "Quick Actions" — vertical list of 4 shortcut rows (icon chip + label + chevron) that call `onNavigate` for menu/gallery/reservations/settings.
  - Third row (lg:grid-cols-3): left col-span-2 is "Recent Reservations" — AdminCard `p-0` with sticky-header table inside a `max-h-96 overflow-y-auto` container, zebra rows (`even:bg-white/[0.02]`), row hover (`hover:bg-admin-gold/5`), columns Guest (name+phone), Date/Time (date+time), Pax, Status (StatusBadge); shows up to 6; falls back to `EmptyState` when empty. Right card is "Recent Activity" — vertical timeline (absolute 1px gold-line + gold dots with `ring-4 ring-admin-gold/15`), each item "New reservation from {name}" + relative time + StatusBadge.
  - Fourth row: "Popular Dishes" — `apiGet<MenuCategory[]>("/api/menu")` (added, parallel to the stats fetch), flattens items and filters `featured`, shows up to 6 horizontal cards (64px image thumb, name, price in Playfair gold, "Featured" Badge); skeleton cards while loading, `EmptyState` when none featured. "View all" link calls `onNavigate("menu")`.
  - `relativeTime(iso)` helper: "just now" / "Nm ago" / "Nh ago" / "Nd ago" / "Nw ago".
  - Loading state uses `Skeleton` components (replaced old shimmer divs).
  - Stats fetch kept as `apiGet<Stats>("/api/stats")` in a `useEffect` with an `alive` flag for cleanup. Menu fetch is a second `.then()` chain in the same effect.
- Ran `cd /home/z/my-project && bun run lint`: 0 errors. The 2 remaining warnings (`@typescript-eslint/no-unused-expressions` at ui.tsx:250 and an unused eslint-disable at ui.tsx:504) are pre-existing in ui.tsx — owned by Task 1+2, not mine. Removed an unused `eslint-disable-next-line @next/next/no-img-element` directive in AdminOverview.tsx (rule is disabled in the project's eslint config).

Stage Summary:
- Files changed: `src/components/admin/AdminApp.tsx`, `src/components/admin/AdminOverview.tsx`. ui.tsx untouched.
- API NOTE for the main agent: `AdminOverview` now accepts an optional `onNavigate?: (section: string) => void` prop. AdminApp already wires it: `<AdminOverview onNavigate={(s) => setSection(s as Section)} />`. The Quick Actions card and the "View all" links in Recent Reservations / Popular Dishes call this with "menu" | "gallery" | "reservations" | "settings".
- Pre-existing data note (NOT introduced by this task, just flagging): `apiGet` in `src/lib/api.ts` does NOT inject the admin `Authorization` header (only `apiPost/apiPatch/apiPut/apiDelete` do via `authHeaders()`). `/api/stats` requires admin auth (`requireAdmin`), so the overview's stats fetch will 401 unless the route is made public or `apiGet` is updated to send the token. This affects the original AdminOverview as well. Fixing api.ts is out of scope for Task 3+4 — flagging for the main agent.
- AdminApp now reads sidebar collapse state from `localStorage["bo_admin_sidebar_collapsed"]` on first client render (lazy useState initializer — no hydration mismatch because the authenticated layout only renders after client-side hydrateAdmin() runs).
- The login form pre-fills `admin@blackorchid.com` / `admin123` (kept from original).

---
Task ID: 5
Agent: full-stack-developer (AdminReservations)
Task: Redesign the Reservations management page into a premium SaaS-style data table experience (Stripe/Linear quality) using the admin design system from Task 1+2. Keep all existing functionality (fetch, search, status filter, confirm/cancel/complete, delete, CSV export, detail modal) and add bulk selection, sorting, pagination, skeleton loading, and empty state.

Work Log:
- Read worklog.md (Task 1+2 + Task 3+4) and ui.tsx to internalize the premium primitives API: AdminCard, AdminSectionTitle, AdminInput (with `icon`), AdminButton (with `variant/size/confirm/onConfirm`), StatusBadge, Modal (`size`, `subtitle`, `footer`), Skeleton, EmptyState, Pagination. Confirmed admin tokens (`text-admin-text`, `text-admin-muted`, `text-admin-gold`, `bg-admin-card`, `border-admin-border`, `admin-gold-bg`, `admin-gold-text`, `admin-surface-elevated`, `shadow-soft-lg`) and the `.admin-root` wrapper is provided by AdminApp.
- Read existing AdminReservations.tsx and confirmed: `apiGet<Reservation[]>("/api/reservations")` with optional `?status=`, `apiPatch(`/api/reservations/${id}`, {status})`, `apiDelete`, CSV export, detail Modal. Kept all that behavior.
- Rewrote `src/components/admin/AdminReservations.tsx` from scratch with:
  - **Toolbar**: `AdminSectionTitle` (title "Reservations", subtitle showing live record count) with an `action` row containing: a 320px-wide `AdminInput` (`icon={Search}`, placeholder "Search name, email, phone, date…"), 5 status filter pills (ALL/PENDING/CONFIRMED/CANCELLED/COMPLETED) styled as rounded-full toggles (active = `admin-gold-bg text-black`, inactive = `border border-admin-border text-admin-muted hover:text-admin-gold`), and an outline sm `AdminButton` (`icon={Download}`) "Export CSV".
  - **Premium table** inside `AdminCard` (`p-0 overflow-hidden`): `min-w-[880px]` for graceful horizontal scroll on mobile, sticky `<thead>` (`sticky top-0 z-10 bg-admin-card/95 backdrop-blur` + bottom border), zebra striping (`even:bg-white/[0.015]` via idx%2), row hover (`hover:bg-admin-gold/5` with 200ms transition), selected-row tint (`bg-admin-gold/10`), `border-b border-admin-border/50` between rows, cursor-pointer rows that open the detail modal on click.
  - **Columns**: select-all checkbox (with indeterminate state) · Guest (Playfair bold name + muted phone) · Date/Time (bold date + muted time) · Pax (centered pill) · Status (`StatusBadge`) · Actions (right-aligned icon buttons: confirm/complete/cancel/view, conditionally shown by status).
  - **Sorting**: clickable `SortHeader` for Date/Time, Pax, Status with 3-state cycle asc→desc→null (null resets to default createdAt desc). Active header is gold with ▲/▼; inactive shows a faint `ChevronsUpDown`. Default sort = createdAt desc. Default sort also kicks in when sortDir is null.
  - **Pagination**: client-side, 10 rows/page, using `Pagination` from ui.tsx. Added "Showing X–Y of Z" text on the left of the footer row. Page is clamped to totalPages; resets to 1 on search/sort/filter changes.
  - **Loading**: 5 skeleton rows (custom `Skeleton`-based row layout matching column widths) when `list === null`.
  - **Empty state**: `EmptyState` with title "No reservations found" + helpful message when filtered list is empty (colSpan=6 row).
  - **Bulk selection**: header "select all on page" checkbox (with indeterminate when partial), per-row checkboxes. Floating sticky-bottom action bar (Framer Motion slide-up) with `admin-surface-elevated + shadow-soft-lg` showing "N selected" gold pill, Clear link, and "Confirm all"/"Cancel all"/"Delete all" buttons. Bulk delete uses `AdminButton confirm="..."` for safety. Bulk operations iterate selected IDs, count successes, toast summary, clear selection, refetch.
  - **Detail modal**: `Modal size="lg"` with title "Reservation Details" and `subtitle` showing `Ref · {id.slice(0,8).toUpperCase()}`. Body = 2-col grid of `DetailBox` (label + value) for Guest/Status(with StatusBadge)/Phone/Email/Date/Time/Guests/Submitted(formatted). Special Requests in a gold-tinted highlighted box rendered in Cormorant italic with curly quotes (or "No special requests." muted fallback). Sticky `footer` (via `footer` prop): Print (ghost), then ml-auto group of Cancel (outline), Complete (outline), Confirm (solid), Delete (danger with `confirm`).
  - **Status flow**: kept `update(id, status)` → `apiPatch` → toast → refetch + sync detail modal; kept `remove(id)` → `apiDelete` → toast → refetch + close modal. CSV export logic unchanged (now exports the sorted list).
  - **Data fetching**: kept `list: Reservation[] | null` pattern (null = loading) with the cancelled-flag `useEffect` guarded by status dep. No synchronous setState in any effect body (lint-safe). On status pill click, `onStatusChange` sets `list` back to null in the event handler (allowed) so skeletons show during the new fetch.
  - **Lint hygiene**: only imports what's used (motion, AnimatePresence, lucide icons: Search/Check/X/CheckCheck/Ban/Trash2/Download/Printer/ArrowUp/ArrowDown/ChevronsUpDown, the 9 ui primitives, apiGet/apiPatch/apiDelete, Reservation type, toast, cn). Helper sub-components `DetailBox`, `SortHeader`, `IconAction`, `Checkbox` defined at file bottom. All interactive elements have ≥40px targets, ARIA labels on icon-only buttons, and the checkboxes use `role="checkbox"` with `aria-checked` supporting "mixed".
- Ran `cd /home/z/my-project && bun run lint`: 0 errors. The 2 remaining warnings are pre-existing in `src/components/admin/ui.tsx` (lines 250, 504) and owned by Task 1+2 — not introduced by this task.

Stage Summary:
- Files changed: `src/components/admin/AdminReservations.tsx` (single file, full rewrite). No other files touched.
- The reservations page now feels like a Stripe/Linear-grade data table: sticky translucent header, zebra rows, gold hover, smooth 200ms transitions, premium modal with sticky footer, floating bulk-action bar.
- All existing functionality preserved (search, status filter, confirm/cancel/complete, delete, CSV export, detail modal) and enhanced with: bulk select + bulk confirm/cancel/delete, 3-state column sorting (Date/Pax/Status), client-side pagination (10/page) with "Showing X–Y of Z" text, 5-row skeleton loading state, and a polished empty state.
- API contract unchanged: `GET /api/reservations[?status=]`, `PATCH /api/reservations/:id {status}`, `DELETE /api/reservations/:id`.
- Lint: 0 errors (2 pre-existing warnings in ui.tsx, not mine).

---
Task ID: 6
Agent: full-stack-developer (CRUD pages)
Task: Redesign the 6 remaining admin CRUD pages (Menu, Gallery, Testimonials, Events, Catering, Settings) to match the premium Black Orchid admin design system from Task 1+2. Keep all existing API contracts.

Work Log:
- Read worklog.md (Task 1+2 + 3+4 + 5) to internalize the design-system primitives and color tokens. Confirmed API of `AdminCard`, `StatCard`, `AdminSectionTitle`, `Modal` (size sm/md/lg/xl, `footer` prop for sticky actions, `subtitle`), `AdminInput` (own label, `icon`/`hint`/`error`), `AdminTextarea` (NO `hint` prop — only label/required/error), `SearchableSelect` (replaces the deleted `AdminSelect`), `Toggle` (color gold/green/blue), `AdminButton` (variant solid/outline/danger/ghost/subtle, sizes sm/md/lg, `confirm`/`onConfirm`), `Badge` (tone gold/green/red/blue/neutral), `ImageUploader` (value/onChange/label/aspect), `Skeleton`, `EmptyState`, `Pagination`. Admin tokens: `text-admin-text`, `text-admin-muted`, `text-admin-gold`, `bg-admin-bg`, `bg-admin-card`, `border-admin-border`, `admin-gold-text`, `admin-gold-bg`.
- Verified ESLint config — `react-hooks/exhaustive-deps` and `react-hooks/purity` are off, but `react-hooks/set-state-in-effect` is NOT disabled (so it IS enforced). Designed every modal form to avoid synchronous setState in effect bodies: lazy `useState(() => deriveForm(...))` initializers + conditional mount + `key` per entity id.
- Verified API contracts by reading each route handler: `/api/menu` (GET categories+items, POST item or category with `_type:"category"`, PATCH/DELETE `/api/menu/:id`, PATCH/DELETE `/api/categories/:id`), `/api/gallery` (CRUD), `/api/testimonials` (CRUD; PATCH casts rating to Number), `/api/events` (CRUD; GET filters `published:true` only — pre-existing behavior, flagged), `/api/catering` (CRUD), `/api/settings` (GET singleton, PUT whitelisted fields).
- Rewrote **AdminMenu.tsx**:
  - `AdminSectionTitle` "Menu Management" subtitle "{n} categories · {m} items", action = outline sm "Add Category" + solid sm "Add Item" (disabled while loading or when zero categories).
  - Each category is `AdminCard p-0` with translucent header (GripVertical + Playfair name + `Badge tone="gold"` count + rename/delete icon buttons) and divided item rows.
  - Item row: 56×56 rounded-xl thumbnail (or `UtensilsCrossed` placeholder), Playfair name, badges row (Featured gold-star pill, Veg/NV green/red Badge, SpiceDots 0–3 orange Flame icons, Sold Out red Badge), muted xs description, gold Playfair $price, edit/delete icon buttons revealed on hover/focus. Row hover `hover:bg-admin-gold/5`.
  - Item modal `Modal size="xl"`: 2-col Name+Price, Description textarea, 2-col Category SearchableSelect + Spice Level SearchableSelect (`searchable={false}`), Dish Image ImageUploader 4/3, Toggles row in tinted box (Veg gold, Featured gold, Available green). Sticky footer Cancel ghost + Save Item solid.
  - Category modal `Modal size="sm"`: single Name input, footer Cancel + Create.
  - Removed the local `Toggle` definition (was using `bg-gold`/`bg-secondary` tokens) — now uses the shared animated `Toggle` from ui.tsx. Category rename kept via `window.prompt`; delete via `window.confirm`.
  - Loading: 2 skeleton category cards. Empty: `EmptyState` with "Add Category" CTA.
- Rewrote **AdminGallery.tsx**:
  - `AdminSectionTitle` "Gallery" subtitle "{n} images", action solid sm "Add Image".
  - Bulk upload `AdminCard p-5` with gold Upload icon chip + Playfair heading + helper text + raw `<textarea className="admin-input h-auto resize-none py-3">` for URL paste + outline "Add All" button (iterates URLs, POSTs each, toasts count, refetches).
  - Image grid 2/3/4 cols, square `group relative overflow-hidden rounded-xl border border-admin-border` tiles. Hover: dark gradient overlay with edit/delete icon buttons top-right and Playfair title + gold `Badge` category bottom-left.
  - Image modal `Modal size="md"`: ImageUploader 1/1, Title (required), Caption, Category SearchableSelect `searchable={false}`. Sticky footer Cancel + Save.
  - Loading: 8 skeleton square tiles. Empty: `EmptyState` with CTA.
- Rewrote **AdminTestimonials.tsx**:
  - `AdminSectionTitle` "Testimonials" subtitle "{n} testimonials · {m} featured", action solid sm "Add".
  - Grid sm:2 of `AdminCard` (flex-col, p-5). Header: 48px avatar (image or initial-letter fallback in gold-tinted ring-2 circle) + Playfair name + gold-xs role + Featured Badge. `Stars` component (5 Star icons, filled gold up to rating). Quote in Cormorant italic with curly quotes. Footer border-top: featured-toggle star button (filled gold if featured else muted outline, calls apiPatch {featured}), edit, delete.
  - Modal `Modal size="lg"`: Name + Role (2-col), Photo ImageUploader 1/1, Message AdminTextarea rows 3 (required), Rating SearchableSelect 5/4/3/2/1 `searchable={false}` + Featured Toggle gold in 2-col row. Sticky footer Cancel + Save.
  - Loading: 4 skeleton cards. Empty: CTA.
- Rewrote **AdminEvents.tsx**:
  - `AdminSectionTitle` "Events" subtitle "{n} events · {m} published", action solid sm "Add Event".
  - Grid sm:2 lg:3 of `AdminCard p-0` flex-col. Poster 16/10 (or CalendarDays placeholder). Hidden Badge overlay if `!published`. Body: gold Badge with CalendarDays + formatted date, Playfair title, line-clamp-2 description. Footer border-top: publish toggle button (emerald Eye "Published" or muted EyeOff "Hidden"), edit, delete (ml-auto).
  - Modal `Modal size="lg"`: Title (required), Description AdminTextarea rows 3, Date AdminInput type=date (required) + Published Toggle green in 2-col row, Poster ImageUploader 16/10. Sticky footer Cancel + Save Event.
  - `formatDate` helper for `toLocaleDateString` "10 Nov 2025" style.
  - Loading: 3 skeleton cards. Empty: CTA.
  - Flagged pre-existing bug: GET /api/events filters `published:true` so admin can only see published events; out of scope to fix.
- Rewrote **AdminCatering.tsx**:
  - `AdminSectionTitle` "Catering Packages" subtitle "{n} packages", action solid sm "Add Package".
  - Grid lg:3 of `AdminCard p-0` flex-col. Image 16/10 (or Package placeholder). Body p-5: Playfair name, gold-xs guests with Users icon, gold Playfair $price + /guest muted, line-clamp-2 description, features list (`splitFeatures` splits on `|`, max 4 with emerald Check icons, "+N more" overflow). Footer border-top: Edit outline button + delete icon (ml-auto).
  - Modal `Modal size="lg"`: Name (required), Description AdminTextarea rows 2, Price (number, required) + Guests (2-col), Package Image ImageUploader 16/10, Features AdminTextarea rows 3. NOTE: `AdminTextarea` does NOT accept `hint` prop (only `AdminInput` does) — rendered the hint as a separate `<p className="mt-1.5 text-xs text-admin-muted">` paragraph below the textarea, matching `AdminInput`'s hint styling. Caught this via `tsc --noEmit` before lint.
  - Loading: 3 skeleton cards. Empty: CTA.
- Rewrote **AdminSettings.tsx**:
  - `AdminSectionTitle` "Website Settings" subtitle "Manage all public-facing content from one place.", action solid sm "Save All" with Save icon (disabled while loading or saving).
  - 2-col grid of 8 `AdminCard p-6` sections, each with a gold icon chip + Playfair gold heading: Branding (Sparkles), Hero (ImageIcon), About (BookOpen), Banquet (GlassWater), Contact (Phone), Business Hours (Clock), Social (Share2), SEO (Search).
  - `set(k, v)` uses functional `setForm((s) => s ? {...s, [k]: v} : s)` for type-safe null handling.
  - Loading: 6 skeleton section cards. Form fetch via `apiGet` with cancelled flag; `setForm` only inside `.then()` (lint-safe).
  - Added sticky bottom save bar (`sticky bottom-4 z-30` + `admin-surface-elevated shadow-soft-lg`) with "Changes are not live until you save." + solid "Save All Changes" button. Top action button kept for parity.
  - Single `save()` PUTs whole form to `/api/settings` via `apiPut`. Server-side whitelist unchanged.
- Removed unused imports: `AdminSelect` (no longer exists in ui.tsx — replaced by `SearchableSelect`), local `Toggle` in AdminMenu, `Badge` in AdminCatering (not used in the cards), `AdminTextarea`/`ImageIcon`/`cn` in AdminGallery (raw textarea instead), etc. Verified each file's imports against actual usage.
- Ran `cd /home/z/my-project && bun run lint`: **0 errors, 0 warnings**. Ran `bunx tsc --noEmit`: 0 errors in my 6 files (pre-existing errors in `examples/`, `skills/`, and `src/app/api/settings/route.ts` are NOT mine — that route has a Prisma `create` typing issue from before this task).

Stage Summary:
- Files changed (exactly 6, no other files touched): `src/components/admin/AdminMenu.tsx`, `src/components/admin/AdminGallery.tsx`, `src/components/admin/AdminTestimonials.tsx`, `src/components/admin/AdminEvents.tsx`, `src/components/admin/AdminCatering.tsx`, `src/components/admin/AdminSettings.tsx`.
- All 6 pages now feel like a premium SaaS product (Linear/Notion/Vercel quality): translucent cards, soft shadows, gold accents, Playfair headings, Cormorant quotes, 200–300ms transitions, touch-friendly ≥40px targets, responsive grids, skeleton loading, empty states, sticky action bars.
- Design-system primitives reused everywhere (no reinvention): `AdminCard`, `AdminButton`, `AdminInput`, `AdminTextarea`, `SearchableSelect`, `Toggle`, `Modal` (with `footer` prop), `AdminSectionTitle`, `Badge`, `ImageUploader`, `Skeleton`, `EmptyState`.
- **Modal form pattern** that satisfies `react-hooks/set-state-in-effect`: each modal form is conditionally mounted (`{modal.open && <XModal key={modal.x?.id ?? "new"} .../>}`), uses lazy `useState(() => deriveForm(x))` for initial state, and unmounts on close. No `useEffect(() => setForm(...), [item])` anywhere. Trade-off: Modal exit animation does not play (the modal disappears instantly on close) — acceptable for a fast admin UI; enter animation still works.
- All API contracts preserved: `GET/POST/PATCH/DELETE /api/menu` + `/api/categories/:id`, `GET/POST/PATCH/DELETE /api/gallery`, `GET/POST/PATCH/DELETE /api/testimonials`, `GET/POST/PATCH/DELETE /api/events`, `GET/POST/PATCH/DELETE /api/catering`, `GET/PUT /api/settings`.
- Pre-existing data note (NOT introduced by this task, flagging for main agent): `GET /api/events` filters `published:true` only — admin Events page can only see published events; the publish toggle PATCHes correctly but hidden events vanish from the list on refetch. Fix would be to either remove the `where: { published: true }` from the GET handler or add an admin-specific endpoint. Out of scope for Task 6.
- Lint: 0 errors, 0 warnings. TypeScript: 0 errors in my 6 files. Dev server (port 3000) was NOT restarted.
