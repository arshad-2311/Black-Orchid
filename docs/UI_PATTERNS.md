# UI Patterns — Black Orchid

A catalog of the reusable UI patterns used across the public site and admin CMS.
Each pattern references the source file and shows usage examples.

> **Source files:**
> - Public primitives: `src/components/site/primitives.tsx`, `src/components/site/motion.tsx`
> - Admin primitives: `src/components/admin/ui.tsx`
> - Global CSS: `src/app/globals.css`

---

## Table of Contents

1. [Modals](#1-modals)
2. [Cards](#2-cards)
3. [Tables](#3-tables)
4. [Hero Layouts](#4-hero-layouts)
5. [Buttons](#5-buttons)
6. [Forms](#6-forms)
7. [Glass Effects](#7-glass-effects)
8. [Shadows](#8-shadows)
9. [Hover Behavior](#9-hover-behavior)
10. [Loading States](#10-loading-states)
11. [Step Indicators](#11-step-indicators)
12. [Badges & Indicators](#12-badges--indicators)
13. [Image Uploaders](#13-image-uploaders)

---

## 1. Modals

### 1.1 `Modal` (Admin)

**Source:** `src/components/admin/ui.tsx`

The workhorse for all admin CRUD forms, the change-password dialog, and the reservation
detail view.

**Props:**
```ts
{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;          // sticky bottom bar (Save/Cancel)
  wide?: boolean;              // legacy: equivalent to size="lg"
  size?: "sm" | "md" | "lg" | "xl";
}
```

**Behavior:**
- **Animation:** 150ms fade-in on backdrop; 180ms scale+fade on panel
  (`scale: 0.97 → 1, y: 12 → 0`, easing `[0.22, 1, 0.36, 1]`).
- **Backdrop:** `bg-black/70 backdrop-blur-md`, click-to-close.
- **z-index:** `z-[100]` (above all other content).
- **Body scroll lock:** `document.body.style.overflow = "hidden"` while open.
- **Escape to close:** keyboard listener on `keydown`.
- **Focus trap:** Tab cycles within the dialog; focus restored to the trigger on close.
- **ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`.
- **Sticky footer:** the `footer` prop renders in a `sticky bottom-0` bar with
  `bg-admin-card/95 backdrop-blur-md` and a top border.

**Layout:**
```
┌─────────────────────────────────────────┐
│ Title                       [X close]   │ ← header (border-b)
│ Subtitle                                │
├─────────────────────────────────────────┤
│                                         │
│  Body content (max-h-70vh, scroll-y)    │
│                                         │
├─────────────────────────────────────────┤
│           [Cancel]  [Save]              │ ← sticky footer
└─────────────────────────────────────────┘
```

**Usage:**
```tsx
<Modal open={!!detail} onClose={() => setDetail(null)}
  title="Reservation Details" subtitle={`Ref · ${detail.id.slice(0,8).toUpperCase()}`}
  size="lg"
  footer={
    <>
      <AdminButton variant="ghost" onClick={() => window.print()}>Print</AdminButton>
      <div className="ml-auto flex gap-2">
        <AdminButton variant="outline" onClick={() => update(detail.id, "CANCELLED")}>Cancel</AdminButton>
        <AdminButton variant="solid" onClick={() => update(detail.id, "CONFIRMED")}>Confirm</AdminButton>
      </div>
    </>
  }>
  {/* detail fields */}
</Modal>
```

### 1.2 `DishShowcase` (Public)

**Source:** `src/components/site/DishShowcase.tsx`

A bespoke full-screen modal for dish details. Not built on `Modal` — has its own backdrop,
keyboard handling, and split-panel layout.

**Key differences from admin `Modal`:**
- Full-viewport (`fixed inset-0`), not centered card.
- `z-[90]` (below admin modal).
- Two-column grid: image gallery left, details right (collapses to single column on mobile).
- External nav buttons (prev/next) float outside the panel so they don't clip on rounded corners.
- Body scroll lock + Escape/Arrow key handling.

### 1.3 `Lightbox` (Public)

**Source:** `src/components/site/Lightbox.tsx`

Fullscreen image viewer for the gallery.

- `z-[90]`, `bg-background/95 backdrop-blur-xl`.
- Image centered, `max-h-[78vh]`, `object-contain`.
- Prev/Next buttons + keyboard arrows + Escape.
- Caption (Playfair title + Cormorant italic caption).
- Bottom counter: `{index + 1} / {images.length}`.

---

## 2. Cards

### 2.1 `AdminCard`

**Source:** `src/components/admin/ui.tsx`

The base surface for all admin content blocks.

```tsx
<AdminCard className="overflow-hidden p-0" hover elevated={false}>
  {/* content */}
</AdminCard>
```

**Props:**
- `hover?: boolean` — adds `hover:-translate-y-0.5 hover:shadow-soft-lg cursor-pointer`.
- `elevated?: boolean` — uses `admin-surface-elevated` (more opaque, more shadow) instead
  of `admin-surface`.
- `onClick?: () => void` — makes the card clickable.

**Visual:**
- Glass surface with subtle border (`border-admin-border`).
- Rounded corners (default `rounded-xl` from CSS class).
- `transition-all duration-300` for smooth hover state changes.

### 2.2 `StatCard`

**Source:** `src/components/admin/ui.tsx`

Used in `AdminOverview` for KPI display.

```
┌──────────────────────────────────┐
│ Total Reservations         [📊]  │
│ 142                              │
│ ▲ 12% vs last week               │
│                                  │
│ ▁▂▄▅▇█▇▅▄▂▁  (sparkline)         │
└──────────────────────────────────┘
```

- Label (small uppercase) + value (large) + delta (green ▲ / red ▼).
- Optional sparkline (SVG polyline + gradient fill).
- Icon in a gold-tinted rounded square.

### 2.3 `DishCard` (Public)

**Source:** `src/components/site/Home.tsx` (inline in `Home.tsx`)

Used in the homepage "Signature Selections" section.

```
┌────────────────────────┐
│ [Veg][Spice]   [$42]   │ ← badges + price pill (glass-gold-cinema)
│                        │
│      Image (4:5)       │ ← scales 1.10 on hover, 1.2s ease
│                        │
│ ─────gradient─────     │
│ CATEGORY               │
│ Dish Name              │
│ (hover: description)   │ ← animates height 0→auto on hover
└────────────────────────┘
```

- `glow-border-hover` class — border brightens to gold on hover.
- Image: `transition-transform duration-[1.2s] ease-out group-hover:scale-110`.
- Description reveal: `motion.p` animates `height: 0 → auto, opacity: 0 → 1`.
- Price pill: `glass-gold-cinema` with Playfair gold-gradient text.

### 2.4 `ExperienceCard` (Public)

**Source:** `src/components/site/Home.tsx` (inline)

Used in the "Experience" section of the homepage.

```
┌──────────────────────────────────┐
│ 01                  (large faint)│ ← index number, white/[0.08]
│ ┌──────────────────────────────┐ │
│ │       Image (16:10)          │ │ ← scales 1.10 on hover, 700ms
│ └──────────────────────────────┘ │
│ EYEBROW                          │
│ Card Title                       │
│ Italic description copy...       │
│ [CTA label →]                    │
└──────────────────────────────────┘
```

- `glow-border-hover` class.
- Numbered index in the corner (Playfair 5xl, very low opacity).
- Image: `transition-transform duration-700 group-hover:scale-110`.
- Gradient overlay from card color.

### 2.5 Package Card (Catering)

**Source:** `src/components/site/CateringView.tsx` (inline)

```
┌────────────────────────────────┐
│                [Most Popular]  │ ← only on middle package
│ ┌────────────────────────────┐ │
│ │      Package image         │ │
│ └────────────────────────────┘ │
│ SILVER / GOLDEN / PLATINUM     │
│ $85 /guest                     │
│ Up to 50 guests                │
│ ─────────────────────────      │
│ ✓ 3-course menu                │
│ ✓ Welcome drinks               │
│ ✓ Live station                 │
│ [Enquire]                      │
└────────────────────────────────┘
```

- Middle card (`i === 1`) gets `border-gold/50` + "Most Popular" gold-gradient badge
  with `glow-gold`.
- Hover: `motion.div whileHover={{ y: -6 }}` (subtle lift).
- Features list parsed from pipe-separated string.

---

## 3. Tables

### 3.1 `AdminReservations` Table

**Source:** `src/components/admin/AdminReservations.tsx`

The most sophisticated table in the app — used as the reference pattern for any future
data tables.

**Features:**

| Feature              | Implementation                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| Sticky header        | `thead sticky top-0 z-10 bg-admin-card/95 backdrop-blur`                      |
| Zebra rows           | `idx % 2 === 1 && "bg-white/[0.015]"`                                          |
| Row hover            | `hover:bg-admin-gold/5`                                                        |
| Selected row         | `bg-admin-gold/10 hover:bg-admin-gold/15`                                      |
| Click row → detail   | `onClick={() => setDetail(r)}`                                                 |
| Sortable columns     | `SortHeader` component with `ArrowUp`/`ArrowDown`/`ChevronsUpDown` icons       |
| Sort cycle           | asc → desc → null (resets to `createdAt desc`)                                 |
| Bulk select          | Checkbox column + `toggleSelectAll` / `toggleRow`                              |
| Indeterminate state  | Checkbox shows `−` when some (not all) rows selected                           |
| Status badges        | `StatusBadge` component (amber/emerald/red/sky)                                |
| Pagination           | `Pagination` component, 10 per page                                            |
| CSV export           | `exportCsv()` builds CSV blob and triggers download                            |
| Floating bulk bar    | `motion.div` slides up from bottom when selections exist                       |
| Skeleton loading     | 5 fake rows with `Skeleton` placeholders while fetching                        |
| Empty state          | `EmptyState` component with `Inbox` icon                                       |

**Column structure:**
```
[☐] | Guest       | Date / Time ↕ | Pax ↕ | Status ↕ | Actions
    | Name        | 2024-01-15    |  4    | PENDING  | [✓][Ban][🔍]
    | +1 555...   | 7:30 PM       |       |          |
```

**Sort cycle logic:**
```ts
const toggleSort = (key: SortKey) => {
  setPage(1);
  if (sortKey !== key || sortDir === null) {
    setSortKey(key); setSortDir("asc");           // first click: asc
  } else if (sortDir === "asc") {
    setSortDir("desc");                            // second click: desc
  } else {
    setSortKey("createdAt"); setSortDir("desc");  // third click: reset
  }
};
```

**Bulk action bar:**
- Slides in from bottom (`y: 80 → 0`) when `selected.size > 0`.
- Shows count + "Clear" link.
- Buttons: "Confirm all", "Cancel all", "Delete all" (with confirm dialog).

---

## 4. Hero Layouts

### 4.1 Full-Viewport Hero (Homepage)

**Source:** `src/components/site/Home.tsx` → `Hero`

```tsx
<section className="relative flex h-[100svh] min-h-[100svh] w-screen items-center
  justify-center overflow-hidden cinematic-grain">
```

**Layers (bottom to top):**
1. **Video background** — `motion.div` with `scale` tied to scroll progress
   (`useScroll` + `useTransform`). `<video autoPlay muted loop playsInline>`.
2. **Gradient overlays:**
   - `bg-gradient-to-b from-background/60 via-background/40 to-background`
   - Radial vignette: `radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)`
3. **Ambient gold orbs** — `.ambient-orb` divs with gold rgba backgrounds and
   CSS keyframe animations.
4. **Cinematic grain** — `.cinematic-grain` class adds an SVG noise overlay via
   `::after` pseudo-element.
5. **Content** (centered, max-w-4xl):
   - `Eyebrow` ("An Exquisite...")
   - `<h1>` with word-by-word `RevealText` (first word foreground, second word
     `text-gold-gradient`).
   - `OrnamentDivider` (✦ between two hairlines).
   - Italic subtitle (`font-cormorant`).
   - CTA row: two `LuxuryButton`s (solid "Reserve a Table" + outline "Explore Menu"),
     each with `cursorLabel`.
   - Trust indicators row (stars, awards, capacity, music, family-friendly).

**Scroll-driven effects:**
- `y` translates content from `0 → 200` as user scrolls.
- `opacity` fades `1 → 0` over first 70% of scroll.
- `scale` grows `1 → 1.15` for parallax depth.

### 4.2 Cinematic Page Header (Sub-pages)

**Source:** Used in `MenuView`, `GalleryView`, `CateringView`, `ContactView`,
`ReservationView`, `AboutView`, `BanquetView`, `HoursView`.

A consistent header pattern for non-homepage views.

```tsx
<section className="relative flex min-h-[60vh|65vh|70vh] items-center justify-center
  overflow-hidden cinematic-grain">
  <div className="absolute inset-0 -z-10">
    <img src={IMAGES.<category>[n]} alt="" className="h-full w-full object-cover" />
  </div>
  <div className="absolute inset-0 bg-background/75" />
  <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
  <div className="absolute inset-0"
    style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%)" }} />
  {/* ambient orbs */}
  <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
    <Eyebrow className="mb-6 justify-center">...</Eyebrow>
    <h1 className="font-[family-name:var(--font-playfair)] text-6xl sm:text-7xl lg:text-8xl ...">
      <RevealText text="The" as="span" delay={0.2} className="inline-block" />
      <RevealText text="Menu" as="span" delay={0.45} className="ml-3 inline-block text-gold-gradient sm:ml-5" />
    </h1>
    <OrnamentDivider className="mt-8" />
    <motion.p ...>{subtitle}</motion.p>
  </div>
</section>
```

**Variations:**
- `min-h-[60vh]` (Reservation, Contact) for tighter headers.
- `min-h-[65vh]` (Catering).
- `min-h-[70vh]` (Menu, Gallery) for more dramatic headers.

### 4.3 Banquet Cinema Banner

**Source:** `src/components/site/Home.tsx` → `BanquetCinema`

A full-width parallax banner (different from the centered hero):

```tsx
<section className="relative flex h-[100vh] min-h-[600px] items-center overflow-hidden">
  <motion.div style={{ y, scale }} className="absolute inset-0">
    <img src={IMAGES.banquet[1]} ... />
  </motion.div>
  {/* left-aligned gradient: from-background via-background/75 to-background/20 */}
  <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
    <div className="max-w-xl">
      {/* left-aligned content: Eyebrow, RevealText, paragraph, stats, CTA */}
    </div>
  </div>
</section>
```

- Parallax: `y: "-15%" → "15%"`, `scale: 1.15 → 1 → 1.15` (zoom in then out).
- Left-aligned content (not centered) for editorial feel.
- Inline stats (Capacity | Amenities) with vertical dividers.

---

## 5. Buttons

### 5.1 `LuxuryButton` (Public)

**Source:** `src/components/site/primitives.tsx`

The signature CTA button for the public site.

```tsx
<LuxuryButton onClick={...} variant="solid" magnetic cursorLabel="Reserve">
  Reserve a Table <ArrowRight className="h-4 w-4" />
</LuxuryButton>
```

**Props:**
- `variant: "solid" | "outline" | "ghost"`
  - `solid`: `bg-gold-gradient text-black glow-gold-hover hover:-translate-y-0.5`
  - `outline`: `border border-gold/40 text-gold hover:bg-gold/8 hover:border-gold/70 backdrop-blur-sm`
  - `ghost`: `text-gold hover:bg-gold/8`
- `magnetic?: boolean` (default `true`) — attaches `useMagnetic` ref for cursor-following.
- `cursorLabel?: string` — sets `data-cursor-label` attribute (shown inside the custom
  cursor ring on hover, e.g. "Reserve", "Menu", "View").
- `type: "button" | "submit"`.
- `disabled?: boolean`.

**Built-in interactions:**
1. **Ripple effect** — on click, a `ripple` span spawns at the click coordinates and
   fades out over 650ms.
2. **Magnetic pull** — button translates toward the cursor by `strength: 0.25` of the
   distance from center; springs back with `elastic.out(1, 0.4)` on mouseleave.
3. **Gold glow** — `glow-gold-hover` class adds a soft gold box-shadow on hover.
4. **Lift** — `hover:-translate-y-0.5` for subtle elevation.

**Base styles:**
```
ripple-container relative inline-flex items-center justify-center gap-2.5
rounded-full px-8 py-4 font-sans text-[12px] font-semibold uppercase
tracking-[0.2em] transition-all duration-300
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold
focus-visible:ring-offset-2 focus-visible:ring-offset-background
disabled:opacity-50 disabled:pointer-events-none overflow-hidden
```

### 5.2 `AdminButton` (Admin)

**Source:** `src/components/admin/ui.tsx`

The button for all admin actions.

```tsx
<AdminButton variant="solid" size="md" onClick={...}>Save</AdminButton>
<AdminButton variant="danger" confirm="Delete permanently?"
  onConfirm={() => remove(id)}>Delete</AdminButton>
```

**Props:**
- `variant: "solid" | "outline" | "danger" | "ghost" | "subtle"`
- `size: "sm" | "md" | "lg"` (h-8/h-10/h-12, text-[11px]/xs/sm)
- `confirm?: string` — shows `window.confirm()` dialog before firing `onConfirm`.
- `onConfirm?: () => void` — called only if user confirms.

**Variant styles:**
| Variant   | Style                                                                               |
| --------- | ----------------------------------------------------------------------------------- |
| `solid`   | `admin-gold-bg text-black font-semibold shadow-gold-glow hover:-translate-y-0.5`   |
| `outline` | `border border-admin-border bg-white/[0.02] text-admin-text hover:border-admin-gold/40` |
| `danger`  | `border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20`         |
| `ghost`   | `text-admin-muted hover:bg-white/5 hover:text-admin-text`                          |
| `subtle`  | `bg-white/[0.06] text-admin-text hover:bg-white/10`                                |

**Base styles:**
```
inline-flex items-center justify-center gap-1.5 rounded-xl
font-sans uppercase tracking-wider transition-all duration-200
disabled:opacity-50 disabled:pointer-events-none
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold
focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg
```

### 5.3 `TextLink` (Public)

**Source:** `src/components/site/primitives.tsx`

Animated underline link used for secondary CTAs.

```tsx
<TextLink onClick={() => setView("menu")}>View Full Menu</TextLink>
```

- Underline grows from left (`w-0 group-hover:w-full`, 400ms).
- Arrow `→` translates right on hover (`group-hover:translate-x-1`).
- Text color shifts to gold on hover.

---

## 6. Forms

### 6.1 `AdminInput`

**Source:** `src/components/admin/ui.tsx`

```tsx
<AdminInput label="Email" type="email" required icon={Mail}
  value={email} onChange={...} error={error} hint="We'll never share" />
```

**Features:**
- **Label** with optional `*` required indicator (gold).
- **Icon** (Lucide component) absolutely positioned at left (`left-4 top-1/2`).
- **Error state:** red border + red focus ring + error text below with `AlertTriangle` icon.
- **Hint text:** muted helper text below (shown only if no error).
- **Height:** 50px (`admin-input` class: `h-12 sm:h-14`).
- **Focus ring:** gold border + soft gold glow (`focus:border-admin-gold/50 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.16)]`).

### 6.2 `AdminTextarea`

**Source:** `src/components/admin/ui.tsx`

Same styling as `AdminInput` but for multi-line text. Uses `resize-none py-3`.

### 6.3 `SearchableSelect`

**Source:** `src/components/admin/ui.tsx`

A premium dropdown with keyboard navigation and search filtering.

```tsx
<SearchableSelect
  label="Category" required
  options={[{value:"cat1",label:"Starters"}, ...]}
  value={form.categoryId} onChange={...}
  placeholder="Select category…" />
```

**Features:**
- **Search filter:** input at top of dropdown filters options by `label.toLowerCase().includes(query)`.
- **Keyboard navigation:**
  - `ArrowDown`/`ArrowUp` — move active highlight.
  - `Enter` — select active option.
  - `Escape` — close.
  - `ArrowDown`/`Enter` when closed — open.
- **Active highlight:** gold background (`bg-admin-gold/15 text-admin-gold`).
- **Selected indicator:** `Check` icon on the currently-selected option.
- **Animation:** 160ms scale+fade on dropdown open/close.
- **Click-outside to close:** `mousedown` listener on `document`.
- **Max height:** `max-h-56 overflow-y-auto` for long option lists.

### 6.4 `Toggle`

**Source:** `src/components/admin/ui.tsx`

```tsx
<Toggle checked={form.featured} onChange={(v) => setForm({...form, featured: v})}
  label="Featured" color="gold" />
```

**Features:**
- 44×24px pill (`h-6 w-11`).
- **Animated thumb:** `motion.span` with `layout` prop + spring
  (`stiffness: 500, damping: 32`) for smooth position transition.
- **Color variants:** `gold` (default, gold gradient), `green` (emerald), `blue` (sky).
- When off: `bg-white/10` (muted).
- When on: color-specific gradient/solid.

### 6.5 PremiumField (Reservation)

**Source:** `src/components/site/ReservationView.tsx` (inline)

The reservation form's field wrapper, similar to `AdminInput` but with public-site styling.

```tsx
<PremiumField id="r-name" label="Full Name" icon={User} error={errors.name}>
  <input id="r-name" value={form.name} onChange={...}
    className={inputClass} autoComplete="name" />
</PremiumField>
```

- Label with gold uppercase tracking.
- Icon at left.
- Error text in red below.
- Input class: `h-12 sm:h-14` with gold focus ring.

---

## 7. Glass Effects

Defined as CSS utility classes in `src/app/globals.css`.

### 7.1 `glass-cinema`

```css
.glass-cinema {
  background: rgba(19, 19, 19, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Used for:**
- Sticky navigation bar (`Navbar`).
- Menu view sticky controls bar.
- Reservation step indicator container.

### 7.2 `glass-gold-cinema`

A gold-tinted variant for premium surfaces.

```css
.glass-gold-cinema {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(19, 19, 19, 0.55));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.15);
}
```

**Used for:**
- Reservation `SummaryCard` and `SuccessScreen`.
- Floating stat card in the Story section.
- Price pill on `DishCard`.

### 7.3 `admin-surface`

The base admin card surface.

```css
.admin-surface {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--admin-border);
  border-radius: 1rem;
}
```

### 7.4 `admin-surface-elevated`

More opaque, more shadow — used for modals and important cards.

```css
.admin-surface-elevated {
  background: rgba(20, 20, 24, 0.95);
  border: 1px solid var(--admin-border);
  border-radius: 1rem;
  box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.5);
}
```

### 7.5 `admin-glass`

Used for the admin topbar.

```css
.admin-glass {
  background: rgba(15, 15, 18, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--admin-border);
}
```

---

## 8. Shadows

Defined in `globals.css` / `tailwind.config.ts`.

| Class                | Usage                                          |
| -------------------- | ---------------------------------------------- |
| `shadow-soft`        | Default card shadow (subtle)                   |
| `shadow-soft-lg`     | Elevated card / modal shadow (deeper)          |
| `glow-gold`          | Persistent gold glow (e.g. active step dot)    |
| `glow-gold-hover`    | Gold glow on hover (LuxuryButton solid)        |
| `shadow-gold-glow`   | Solid AdminButton gold shadow                  |

**Example definitions (approximate):**
```css
.shadow-soft { box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15); }
.shadow-soft-lg { box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.4); }
.glow-gold { box-shadow: 0 0 24px -4px rgba(212, 175, 55, 0.5); }
.glow-gold-hover:hover { box-shadow: 0 0 32px -4px rgba(212, 175, 55, 0.6); }
.shadow-gold-glow { box-shadow: 0 8px 24px -6px rgba(212, 175, 55, 0.4); }
```

---

## 9. Hover Behavior

### 9.1 Image Zoom

**Pattern:** `transition-transform duration-[1.2s] ease-out group-hover:scale-110`

Used on:
- `DishCard` image (1.2s).
- `GalleryView` tiles (1.2s).
- `GalleryPreview` tiles (1.2s).
- `ExperienceCard` image (700ms).
- `CircularGallery` cards.

### 9.2 Card Elevation

**Pattern:** `hover:-translate-y-0.5 hover:shadow-soft-lg`

Used on:
- `AdminCard` with `hover` prop.
- `LuxuryButton` solid variant.
- `AdminButton` solid variant.

### 9.3 Gold Border Brightening

**Class:** `glow-border-hover`

```css
.glow-border-hover {
  border-color: rgba(255, 255, 255, 0.06);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.glow-border-hover:hover {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 0 24px -8px rgba(212, 175, 55, 0.3);
}
```

Used on `DishCard`, `ExperienceCard`, and package cards.

### 9.4 Overlay Reveal

**Pattern:** Gradient overlay `opacity-0 → opacity-100` on group hover.

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10
  to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
```

### 9.5 Text Slide-Up

**Pattern:** Caption translates up and fades in on hover.

```tsx
<div className="absolute bottom-0 ... translate-y-3 opacity-0 transition-all duration-300
  group-hover:translate-y-0 group-hover:opacity-100">
  <p>{title}</p>
</div>
```

---

## 10. Loading States

### 10.1 `Skeleton`

**Source:** `src/components/admin/ui.tsx`

```tsx
<Skeleton className="h-4 w-32 rounded" />
```

A shimmer-animated placeholder. Uses the `admin-skeleton` CSS class which applies a
gradient sweep animation.

**Usage pattern in tables:**
```tsx
{loading ? (
  Array.from({ length: 5 }).map((_, i) => (
    <tr key={`sk-${i}`} className="border-b border-admin-border/50">
      <td className="px-4 py-4"><Skeleton className="h-5 w-5 rounded-md" /></td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="mt-2 h-3 w-24 rounded" />
      </td>
      {/* ... */}
    </tr>
  ))
) : /* real rows */ }
```

### 10.2 `EmptyState`

**Source:** `src/components/admin/ui.tsx`

```tsx
<EmptyState
  title="No reservations found"
  message="Try adjusting your search query or status filter."
  action={<AdminButton onClick={clearFilters}>Clear filters</AdminButton>}
/>
```

**Layout:**
- Centered `Inbox` icon in a bordered circle.
- Title (Playfair, semibold).
- Optional message (muted, max-w-sm).
- Optional action button below.

### 10.3 Spinner / Loading Text

For buttons, loading state is shown as text:
- `LuxuryButton`: "Securing your table…" or "Signing in…"
- `AdminButton`: "Saving…" / "Updating…" / "Deleting…"

No separate spinner component — the button label changes and `disabled:opacity-50` dims it.

### 10.4 `Loader` (Public Initial Load)

**Source:** `src/components/site/Loader.tsx`

A full-screen loader shown during the initial app bootstrap. Animated Black Orchid logo
with a gold sweep.

---

## 11. Step Indicators

### 11.1 Reservation Step Indicator

**Source:** `src/components/site/ReservationView.tsx` → `StepIndicator` + `StepDot`

```
  ●─────●─────●─────●─────●        ← dots (9×9 mobile, 10×10 desktop)
  1     2     3     4     5        ← step numbers (or ✓ if done)
  Date  Time  Guests Details Confirm ← labels
```

**Visual states per dot:**
| State    | Style                                                              |
| -------- | ------------------------------------------------------------------ |
| Active   | `border-gold bg-gold-gradient text-black glow-gold` (current step)|
| Done     | `border-gold bg-gold text-black` + `Check` icon (strokeWidth 3)   |
| Pending  | `border-white/15 bg-background text-muted-foreground`              |

**Progress line:**
- Background hairline: `absolute left-0 right-0 top-[18px] h-px bg-white/10`.
- Gold fill: `motion.div` with animated `width: ${(step / (total-1)) * 100}%`.
- Transition: `duration: 0.5, ease: "easeInOut"`.

**Labels:**
- Active: `text-gold`.
- Done: `text-foreground/60`.
- Pending: `text-muted-foreground/50`.

---

## 12. Badges & Indicators

### 12.1 `StatusBadge`

**Source:** `src/components/admin/ui.tsx`

Used for reservation status. See [Business Rules §1.3](BUSINESS_RULES.md#13-status-badge-colors).

### 12.2 `Badge` (Tone Variants)

**Source:** `src/components/admin/ui.tsx`

```tsx
<Badge tone="gold">Featured</Badge>
<Badge tone="green">Available</Badge>
<Badge tone="red">Sold Out</Badge>
<Badge tone="blue">Published</Badge>
<Badge tone="neutral">Draft</Badge>
```

### 12.3 `VegBadge` (Public)

**Source:** `src/components/site/primitives.tsx`

16×16px square with colored border + dot. Green = veg, red = non-veg.

### 12.4 `SpiceLevel` (Public)

**Source:** `src/components/site/primitives.tsx`

Renders `level` count of `●` in orange. Hidden if `level === 0`.

### 12.5 `Eyebrow` (Public)

**Source:** `src/components/site/primitives.tsx`

Small uppercase label with a leading gold hairline.

```tsx
<Eyebrow className="mb-6">À La Carte</Eyebrow>
```

```
─── À LA CARTE
↑ gold hairline (w-8, bg-gold/60)
```

### 12.6 `OrnamentDivider` (Public)

**Source:** `src/components/site/primitives.tsx`

A centered ornament: hairline → ✦ → hairline.

```
───────────────── ✦ ─────────────────
```

---

## 13. Image Uploaders

### 13.1 `ImageUploader`

**Source:** `src/components/admin/ui.tsx`

Single-image upload with drag-and-drop, preview, progress, and URL-paste mode.

```tsx
<ImageUploader value={form.image} onChange={(url) => setForm({...form, image: url})}
  label="Dish Image" aspect="16/10" />
```

**States:**
1. **Empty:** Dashed border drop zone with Upload icon, "Drop image here, or browse"
   text, file type/size hint.
2. **Dragging:** `border-admin-gold bg-admin-gold/10`.
3. **Uploading:** Gold progress bar (`width: 0% → 100%`) + "Uploading… X%" text.
4. **Has image:** Image preview with hover overlay showing "Replace" and "Remove" buttons.
5. **URL mode:** Text input + "Set" button (skips upload, stores external URL).
6. **Error:** Red text with `AlertTriangle` icon.

**Validation:**
- Types: `image/(jpeg|jpg|png|webp|gif|avif)`.
- Max size: 6 MB.

### 13.2 `MultiImageUploader`

**Source:** `src/components/admin/ui.tsx`

For menu item galleries (multiple images per dish).

```tsx
<MultiImageUploader
  value={form.images}  // string[]
  onChange={(urls) => setForm({...form, images: urls})}
  label="Dish Gallery"
/>
```

**Features:**
- Grid of image thumbnails with remove buttons.
- "Add image" tile opens the upload dialog.
- Drag-to-reorder (planned / partial implementation).
- Each image goes through the same `apiUpload` flow as `ImageUploader`.

---

## Cross-Pattern Notes

### Consistency Rules

1. **All admin forms use `AdminInput` / `AdminTextarea` / `SearchableSelect` / `Toggle`** —
   never raw `<input>` elements. This ensures consistent height, focus rings, and error
   states.
2. **All admin mutations use `AdminButton`** with appropriate `variant` and `confirm`
   prop for destructive actions.
3. **All public CTAs use `LuxuryButton`** with `cursorLabel` for context-aware cursor
   feedback.
4. **All modals use the admin `Modal` component** (except `DishShowcase` and `Lightbox`,
   which have bespoke fullscreen layouts).
5. **All loading states use `Skeleton`** in tables and `EmptyState` for empty lists —
   never spinners (except button loading text).

### Responsive Patterns

- **Mobile-first:** all components default to mobile styles, with `sm:`, `lg:` breakpoints
  for enhancements.
- **Touch targets:** minimum 44px height for interactive elements (`min-h-[44px]` on
  filter pills, time slots, etc.).
- **Mobile drawer:** admin sidebar collapses to a slide-in drawer below `lg` breakpoint.
- **Stacked grids:** multi-column grids collapse to single column on mobile
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
