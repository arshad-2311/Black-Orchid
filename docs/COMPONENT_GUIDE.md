# Component Guide

A reference to the key components in Black Orchid. Components are grouped by domain:
**site shell**, **site views**, **site motion**, **site primitives**, and **admin**.

---

## Site Shell

### `PillNav` — `src/components/site/PillNav.tsx`
Floating glassmorphism navigation pill, fixed at the top centre.

- **Transparent** at the top of the page; transitions to `.glass-cinema` after 40px of
  scroll (with a soft shadow).
- **Desktop (lg+):** inline nav buttons (Home, About, Menu, Banquet, Gallery, Catering,
  Hours, Contact) with a sliding gold active indicator (`framer-motion` `layoutId`).
  Wordmark logo on the left, "Reserve" gold-gradient button on the right.
- **Mobile:** collapses to a hamburger. Tapping opens a **fullscreen overlay** with
  staggered Playfair Display nav items (animated in with `staggerChildren: 0.06`) and an
  ambient gold orb.
- Calls `useApp().setView(view)` to navigate.

### `Cursor` — `src/components/site/Cursor.tsx`
Context-aware custom cursor. **Desktop only** (`pointer: fine`); disabled on touch.

- A gold **dot** (6px, fast spring `stiffness: 800`) and a trailing **ring** (36px,
  slower spring `stiffness: 400, damping: 28`).
- **5 states**, determined by inspecting the hovered element:
  | State | Trigger | Ring | Extra |
  | --- | --- | --- | --- |
  | `default` | empty space | 36px, faint gold border | — |
  | `hover` | `a, button, [role=button]` | 48px (or 64px if labelled), gold border + tint | Shows `data-cursor-label` text inside |
  | `view` | `[data-cursor=view]`, images | 56px, view icon (target) | — |
  | `drag` | `[data-cursor=drag]`, scroll containers | 52px, drag icon (arrows) | — |
  | `text` | `input, textarea, [contenteditable]` | 4px (caret-like), dot hidden | — |
- Adds `.cursor-host` to `<html>` so global CSS hides the native cursor.

### `Loader` — `src/components/site/Loader.tsx`
Cinematic intro overlay shown for 1.9s on first load.

- Full-screen black with an ambient gold orb.
- "Est. 2003" eyebrow → "Black **Orchid**" wordmark (letter-spacing animates from `0.5em`
  to `0.04em`) → italic "Fine Dining & Banquet" subtitle.
- A gold progress line scales from 0→1 at the bottom.
- **Exits by sliding up** (`y: -100%`, 0.9s, `[0.76, 0, 0.24, 1]`).

### `Chrome` — `src/components/site/Chrome.tsx`
Exports two always-present components:

- **`ScrollProgress`** — a 0.5px gold-gradient bar pinned to the very top, scaled by
  `useScroll()` + a spring (`stiffness: 120, damping: 30`).
- **`StickyReserve`** — appears after 700px of scroll.
  - **Desktop:** a 64px floating gold orb (bottom-right) with "Book" text + `glow-gold`.
  - **Mobile:** a bottom bar (`.glass-cinema`, respects `env(safe-area-inset-bottom)`)
    with a full-width "Reserve a Table" button.
  - Hidden on the reservation view itself.

### `Footer` — `src/components/site/Footer.tsx`
- **Newsletter band** — huge Playfair heading ("An invitation to the *extraordinary*") +
  email input + gold subscribe button (success toast on submit).
- **4-column grid:** brand + animated social icons (Instagram/Facebook/Twitter) · quick
  links (view navigation) · contact (address/phone/email) · hours (weekday/weekend).
- **Bottom bar:** copyright, Privacy / Terms / Admin links.
- Sticky to the viewport bottom via `mt-auto` on a `min-h-screen flex flex-col` wrapper.

---

## Site Views

### `Home` — `src/components/site/Home.tsx`
The home page — a vertical narrative of ~10 sections:

1. **Hero** — `public/hero-video.mp4` background with parallax scale (`useScroll` +
   `useTransform`), ambient gold orbs, word-by-word headline reveal, staggered CTAs.
2. **Manifesto** — a single bold statement with progressive word reveal + gold italic
   accent words.
3. **Signature Dishes** — 4 featured editorial dish cards (fetched, `i.featured`) with
   hover description reveal + floating price.
4. **Story** — asymmetric 12-col grid: parallax `ImageReveal` + floating stat card +
   `RevealText` heading.
5. **Philosophy** — 4 numbered pillars in a bordered grid.
6. **Banquet Cinema** — full-viewport parallax banner with scroll-driven Y + scale.
7. **Gallery Preview** — masonry with 2 tall tiles, opens `Lightbox`.
8. **Circular Gallery** — the infinite drag carousel.
9. **Testimonials** — single dramatic Playfair quote carousel.
10. **Reservation CTA** — immersive floating section with ambient orbs.

Fetches `/api/menu`, `/api/gallery`, `/api/testimonials?featured=1` on mount.

### `MenuView` — `src/components/site/MenuView.tsx`
- **Cinematic header** — full-bleed food image, radial vignette, ambient orbs,
  word-by-word "The Menu" reveal.
- **Sticky controls:**
  - **Desktop (lg+):** category pills (sliding gold `layoutId` indicator) + search input
    + veg-only toggle.
  - **Mobile:** `OptionWheel` for category selection.
- **Editorial dish list** — single column, `DishRow` per item (thumbnail with veg badge +
  chef's pick badge, name, signature/chef badges, short description, category, spice
  level, price, hover "View" hint).
- Clicking a `DishRow` opens `DishShowcase` with the flat dish list + index for
  prev/next navigation.
- Empty state for no matches.

### `DishShowcase` — `src/components/site/DishShowcase.tsx`
Premium full-screen dish detail modal.

- **Split layout (lg):** `DishImageGallery` left (sticky, 90vh) · `DishDetails` right.
  On mobile: stacked, image top.
- **`DishImageGallery`:**
  - Main image with **hover zoom** (scale 1.8, transform-origin follows cursor).
  - **Thumbnails** (desktop, bottom-centred) + **swipe dots** (mobile).
  - **Touch swipe** between images.
  - **Fullscreen** viewer (separate overlay with prev/next).
  - Toggle zoom button + fullscreen button.
  - Top-left badges: veg/non-veg, chef's pick, sold out.
- **`DishDetails`:** staggered text reveal (`staggerChildren: 0.09`) — category eyebrow,
  name, tagline, badges (veg/spice/chef/signature/availability), hairline, description,
  ingredients (chips), allergens (red chips), serving size, price (gold gradient) +
  "Reserve to Taste" `LuxuryButton`.
- **Prev/Next** navigation + `index / total` indicator.
- **Related dishes** ("You may also like") — same category, filled from others if <4.
- **Keyboard:** `Esc` close, `←`/`→` prev/next. Body scroll locked while open.

### `GalleryView` — `src/components/site/GalleryView.tsx`
- Cinematic header (same pattern as MenuView, "The Gallery").
- **Filter pills** (All / Food / Drinks / Interior / Events / Banquet) with sliding gold
  indicator.
- **Masonry grid** via CSS `columns-2 sm:columns-3 lg:columns-4` with `break-inside-avoid`.
  Each tile is a `motion.button` that scales in on view; hover reveals title + category.
- **"Load More"** button (adds 12 to the visible count).
- Opens `Lightbox` on click.

### `Lightbox` — `src/components/site/Lightbox.tsx`
Fullscreen image viewer.

- Gold-bordered close + prev/next buttons.
- Centered `<figure>` with the image + optional caption (title in Playfair, caption in
  italic Cormorant).
- Position indicator (`n / total`) at the bottom.
- **Keyboard:** `Esc`, `←`, `→`. Body scroll locked.

### `OptionWheel` — `src/components/site/OptionWheel.tsx`
A vertical scroll-wheel category selector for mobile.

- Touch-drag + **momentum scrolling** (velocity decays at 0.92/frame, snaps when <0.5).
- **Snap-to-center** with a gold highlight band + top/bottom fade masks.
- **Keyboard accessible** (`ArrowUp`/`ArrowDown`, `tabIndex=0`, `role=listbox`).
- Respects `prefers-reduced-motion` (disables momentum, snaps instantly).
- Active item: Playfair 20px gold; inactive: sans 14px muted.

### `CircularGallery` — `src/components/site/CircularGallery.tsx`
Infinite horizontal image carousel.

- Items are **tripled** (`[...images, ...images, ...images]`) for infinite scroll.
- **Interaction:** mouse drag, touch drag, wheel, and keyboard (`←`/`→`).
- **Snap-to-center** (`scrollSnapType: x mandatory`); active slide scales to 1, others to
  0.85 with 0.5 opacity.
- **Dots indicator** below (click to jump).
- `data-cursor="drag"` so the custom cursor shows the drag icon.
- `role="region"`, keyboard navigable.

### `ReservationView` — `src/components/site/ReservationView.tsx`
The 5-step reservation wizard.

| Step | Field | UI |
| --- | --- | --- |
| 1. Date | `date` | Date picker (today onwards) |
| 2. Time | `time` | Lunch (11:00 AM–2:30 PM) or Dinner (6:00 PM–9:30 PM) slot grid |
| 3. Guests | `guests` | 1–8+ selector + stepper (max 20) |
| 4. Details | name, phone, email, special | Text inputs with validation |
| 5. Confirm | — | Review summary → submit |

- **Directional slide transitions** (`x: ±40`) based on nav direction.
- **Validation gates** per step (can't advance with empty required fields).
- On submit: `apiPost("/api/reservations", …)` → success state with a gold check +
  "View Menu" / "Back Home" CTAs.
- Uses `toast` (sonner) for feedback.

### `ScrollStack` — **REMOVED**
> This component was removed during the cinematic reinvention. Its scroll-pinned stacking
> behavior was replaced by **GSAP ScrollTrigger** reveals (`useFadeUp`, `useFadeScale`,
> `useParallax`) which are more performant and respect `prefers-reduced-motion`. Do not
> look for or import `ScrollStack` — it no longer exists in the codebase.

### Other Views
- **`AboutView`** — story, stats, philosophy pillars (parallax + `ImageReveal`).
- **`BanquetView`** — capacity, description, feature grid, imagery.
- **`CateringView`** — catering packages (fetched) with feature lists + enquiry CTAs.
- **`HoursView`** — operating hours, weekday vs weekend.
- **`ContactView`** — contact details, socials, map placeholder, message form.
- **`LegalView`** — renders Privacy Policy or Terms of Service from a `kind` prop.

---

## Site Motion

### `motion.tsx` — Framer Motion primitives
| Export | Description |
| --- | --- |
| `useElementScroll()` | Hook: spring-smoothed scroll progress for a target element. |
| `RevealGroup` | Wrapper that staggers children into view (`whileInView`, `staggerChildren: 0.12`). |
| `RevealItem` | Child variant: opacity 0→1, y 24→0, 0.8s `[0.22,1,0.36,1]`. |
| `RevealText` | **Word-by-word masked text reveal.** Splits text on spaces, wraps each word in a `reveal-mask` overflow-hidden span, animates `y: 110% → 0`. Accepts `as` (p/h1/h2/h3/span), `stagger`, `delay`. |
| `Parallax` | Wraps children; moves Y based on scroll (`useScroll` + `useTransform`). `speed` prop. |
| `ImageReveal` | `<img>` with `clipPath: inset(0 0 100% 0) → inset(0)` + scale 1.25→1.05 on view. |
| `ScrollLine` | A horizontal hairline that fills with gold based on scroll progress. |
| `CountUp` | A number that animates from 0 to `to` when scrolled into view. |

### `gsap-utils.ts` — GSAP + ScrollTrigger hooks
All hooks register ScrollTrigger, respect `prefers-reduced-motion`, and clean up via
`gsap.context().revert()`.

| Hook | Animation |
| --- | --- |
| `useFadeUp({ stagger, delay, y, duration, once })` | opacity 0→1, y 30→0, `power3.out`. Staggers children if `stagger > 0`. |
| `useFadeScale({ stagger, delay, duration, once })` | opacity 0→1, scale 0.95→1, y 30→0, `power3.out`. |
| `useParallax({ speed, start, end })` | yPercent `-speed*50 → speed*50`, scrubbed. |
| `useReveal(from, to, triggerOptions)` | Generic: animate from `from` to `to` on scroll. |

### `premium-motion.ts` — Signature motion layer
| Hook | Description |
| --- | --- |
| `useLenis()` | Global smooth scroll. Creates a `Lenis` instance, wires `lenis.on("scroll", ScrollTrigger.update)` into GSAP's ticker. Disabled under reduced-motion. |
| `getLenis()` | Returns the singleton Lenis instance (for programmatic scrollTo). |
| `useSplitText({ splitBy, stagger, duration, delay, once })` | Uses `SplitType` to split text into words/lines, animates `yPercent: 110→0, opacity: 0→1` with `power4.out`. Reverts on unmount. |
| `useImageReveal({ delay, duration, once })` | GSAP clip-path mask: `inset(0 0 100% 0) → inset(0 0 0 0)` + scale 1.2→1.05, `power3.out`. |
| `useMagnetic({ strength })` | Button drifts toward cursor by `strength * distance` (default 0.3), springs back with `elastic.out(1, 0.4)`. Desktop only. |
| `usePageTransition()` | The **liquid-glass bloom** transition. Captures click origin + destination variant, builds a 5-layer overlay (smoked glass circle, gold bloom, reflection streak, film grain, logo wordmark), expands from origin, swaps content at midpoint, retracts upward. Re-exports `useFadeUp`, `useFadeScale`, `useParallax` from `gsap-utils`. |

---

## Site Primitives (`src/components/site/primitives.tsx`)

| Component | Description |
| --- | --- |
| `Eyebrow` | Small uppercase label with a leading 32px gold hairline. `text-[11px] tracking-[0.35em] text-gold`. |
| `DisplayHeading` | Massive editorial heading using `RevealText` (word-by-word). Accepts `as` (h1/h2/h3), `stagger`. Playfair semibold, `leading-[1.02]`. |
| `SectionHeading` | Composes `Eyebrow` + `DisplayHeading` + optional italic subtitle. `center` prop. |
| `LuxuryButton` | Gold-gradient button with **ripple** + **magnetic** + **glow** + **lift**. Variants: `solid` / `outline` / `ghost`. Accepts `cursorLabel` (shown in custom cursor), `magnetic` (default true). |
| `TextLink` | Animated underline link: hairline grows from left on hover + arrow translates right. |
| `OrnamentDivider` | Two hairline gradients flanking a gold `✦`. |
| `SpiceLevel` | 1–3 filled dots (orange) indicating spice. |
| `VegBadge` | 16px square with a colored dot — green (veg) / red (non-veg). |

---

## Admin Components

### `AdminApp` — `src/components/admin/AdminApp.tsx`
The admin shell.

- **If unauthenticated:** renders `LoginScreen` (email/password form, posts to
  `/api/admin/login`, demo credentials hint). On success, calls `setAdmin(token, user)`.
- **If authenticated:** renders:
  - **Desktop sidebar** (`lg+`): collapsible (72px ↔ 256px, persisted to localStorage).
    Brand header, 8 nav items with sliding gold active indicator (`layoutId`), user card
    with avatar + role badge, "Change Password" + "Sign Out" buttons.
  - **Mobile drawer:** slide-in `<aside>` (`x: -288 → 0`, spring) with a backdrop.
  - **Topbar:** sticky `.admin-glass` bar with section title, "View Site" link, and
    "Back to site" button.
  - **Section content:** `AnimatePresence` fade between the 8 sections.
- Includes `ChangePasswordModal` (validates current password, min 8 chars, match, signs
  out on success).

### Section Components

| Component | Purpose |
| --- | --- |
| `AdminOverview` | Dashboard home. `StatCard`s (reservations today/pending/total, menu items, gallery, events, testimonials, packages), a 7-day reservations **bar chart** (Recharts), recent reservations list with relative timestamps, quick-action buttons, and a menu category breakdown. |
| `AdminReservations` | Filterable/searchable reservations table. Status badges, inline status update (PENDING → CONFIRMED/CANCELLED/COMPLETED), delete, detail drawer. |
| `AdminMenu` | Category CRUD + item CRUD. Full rich-field form: name, tagline, description, short description, price, **multiple images** (`ImageUploader`), ingredients/allergens tag inputs, spice (0–3), veg, featured, chef-recommended, serving size, availability. |
| `AdminGallery` | Gallery image CRUD with `ImageUploader`, category select, caption, order. |
| `AdminTestimonials` | Testimonial CRUD: name, role, photo, rating (star picker), message, featured flag. |
| `AdminEvents` | Event CRUD: title, description, date, image, published toggle. |
| `AdminCatering` | Catering package CRUD: name, description, price, guests, image, features (pipe-separated). |
| `AdminSettings` | Edits the singleton `SiteSettings` — restaurant name, tagline, hero/about copy, contact, hours, socials, banquet info, meta tags. |

### `ui.tsx` — Admin Design System
Scoped to `.admin-root`. Key exports:

| Component | Description |
| --- | --- |
| `AdminCard` | Surface wrapper (`admin-surface` / `admin-surface-elevated`). Optional `hover` lift + `elevated`. |
| `StatCard` | Label + value + delta + optional sparkline (`recharts` mini line). |
| `AdminSectionTitle` | Section heading with optional description + action slot. |
| `AdminButton` | Variants: `solid` (gold gradient) / `subtle` / `ghost` / `danger` (red). Sizes: `sm` / `md` / `lg`. |
| `AdminInput` | 50px input with optional `icon`, `error`, `hint`. Gold focus ring. |
| `Textarea` | Styled multiline input. |
| `Modal` | Centered dialog with backdrop blur. Sizes `sm`/`md`/`lg`/`xl`. Header + body + footer slots. |
| `SearchableSelect` | Combobox with search filter. |
| `Toggle` | On/off switch. |
| `ImageUploader` | **Drag & drop** image upload. Validates type (JPG/PNG/WebP/GIF/AVIF) + size (≤6MB). Shows progress bar, preview with Replace/Remove on hover, and a "Paste URL" mode. Calls `apiUpload(file)` → stores the returned URL (never Base64). |
| `Badge` / `StatusBadge` | Small pills (neutral/gold/red/blue/green tones). |
| `Skeleton` | Shimmer loading placeholder. |
| `EmptyState` | Icon + title + description for empty lists. |
| `ConfirmDialog` | Destructive-action confirmation modal. |
| Pagination controls | For paginated tables. |

---

## Component Composition Cheat Sheet

```
src/app/page.tsx
 ├─ <Cursor />              (always-on custom cursor)
 ├─ <Loader />              (1.9s intro)
 ├─ <ScrollProgress />      (gold top bar)
 ├─ <PillNav settings />    (floating nav)
 ├─ <view>                  (Home | MenuView | GalleryView | …)
 │   ├─ uses primitives (LuxuryButton, Eyebrow, …)
 │   ├─ uses motion (RevealText, ImageReveal, Parallax)
 │   └─ uses gsap/premium hooks (useFadeUp, useSplitText, useMagnetic)
 ├─ <Footer settings />     (newsletter + links)
 └─ <StickyReserve />       (floating CTA)

src/app/admin/page.tsx
 └─ <AdminApp />
     ├─ <LoginScreen />      (if unauthenticated)
     └─ <SidebarContent /> + <topbar> + <Section>
         └─ uses admin/ui.tsx (AdminCard, AdminInput, Modal, ImageUploader, …)
```

For the full design tokens (colors, typography, spacing) backing these components, see
[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
