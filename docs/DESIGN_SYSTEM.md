# Design System

Black Orchid has **two coexisting design systems** in one application:

1. **The public site** — a cinematic dark-and-gold palette defined in
   `src/app/globals.css` and `src/components/site/primitives.tsx`.
2. **The admin dashboard** — a cooler, denser dark palette scoped to `.admin-root` in
   `globals.css` and `src/components/admin/ui.tsx`.

This document specifies both.

---

## 1. Public Site — Cinematic Luxury

### Color Palette

Defined as CSS variables in `:root` within `src/app/globals.css`:

| Token              | Value                        | Role |
| ------------------ | ---------------------------- | ---- |
| `--background`     | `#0A0A0A`                    | Page background — near-black, not pure black. |
| `--foreground`     | `#f5f0e8`                    | Body text — warm white (not stark `#fff`) for a softer read. |
| `--card`           | `#131313`                    | Card / elevated surface background. |
| `--card-foreground`| `#f5f0e8`                    | Text on cards. |
| `--popover`        | `#131313`                    | Popover / dropdown background. |
| `--secondary`      | `#1c1c1c`                    | Secondary surface. |
| `--muted`          | `#161616`                    | Muted background. |
| `--muted-foreground`| `#8a8a8a`                   | Muted text, captions, meta labels. |
| `--primary`        | `#d4af37`                    | Gold — the primary accent (mapped from `--gold`). |
| `--gold`           | `#d4af37`                    | The dedicated gold token. |
| `--gold-foreground`| `#0a0a0a`                    | Text on gold (near-black). |
| `--accent`         | `#1c1c1c`                    | Accent surface. |
| `--accent-foreground`| `#d4af37`                  | Accent text (gold). |
| `--border`         | `rgba(255, 255, 255, 0.08)`  | Hairline borders — very subtle white. |
| `--input`          | `rgba(255, 255, 255, 0.10)`  | Input field background. |
| `--ring`           | `#d4af37`                    | Focus ring color. |
| `--destructive`    | `oklch(0.65 0.22 22)`        | Error / danger (warm red). |

Chart tokens (`--chart-1` through `--chart-5`) graduate from gold through grey.

> **No indigo or blue** appears anywhere in the public palette. Gold is the sole accent.

### Gradients

| Utility class        | Definition | Use |
| -------------------- | ---------- | --- |
| `.bg-gold-gradient`  | `linear-gradient(135deg, #f0d878 0%, #d4af37 50%, #b8902a 100%)` | Buttons, active nav pills, scroll progress bar, loader line. |
| `.text-gold-gradient`| Same gradient, `-webkit-background-clip: text` | Headline accents, the "404", dish prices, the loader wordmark. |

The gradient is deliberately **warm** (a highlight-to-shadow gold sweep) rather than a
flat gold fill.

### Typography

Three fonts loaded via `next/font/google` in `src/app/layout.tsx`:

| Font                | Variable              | Weights | Role |
| ------------------- | --------------------- | ------- | ---- |
| **Playfair Display** | `--font-playfair`    | 400, 500, 600, 700, 800, 900 + italic | All major headings (`h1`–`h3`), dish names, the loader wordmark, nav logo. A high-contrast display serif. |
| **Cormorant Garamond** | `--font-cormorant` | 300, 400, 500, 600, 700 + italic | Italic accents, subtitles, pull-quotes, dish taglines and descriptions. A delicate serif that adds softness. |
| **Geist**           | `--font-geist-sans`   | (variable) | The sans-serif workhorse: labels, buttons, UI text, body copy. |

**Usage pattern:** Components reference fonts via Tailwind arbitrary properties:
```tsx
className="font-[family-name:var(--font-playfair)] text-5xl font-semibold"
```
This keeps font choices swappable in one place.

**Letter spacing helpers:**
- `.tracking-luxe` → `0.04em` (headings)
- `.tracking-wide-luxe` → `0.3em` (eyebrows, labels)

### Spacing & Radius

| Token        | Value      | Notes |
| ------------ | ---------- | ----- |
| `--radius`   | `0.75rem` (12px) | Base radius. |
| `--radius-sm`| `calc(var(--radius) - 4px)` → 8px | Small elements. |
| `--radius-md`| `calc(var(--radius) - 2px)` → 10px | Medium. |
| `--radius-lg`| `var(--radius)` → 12px | Cards, inputs. |
| `--radius-xl`| `calc(var(--radius) + 4px)` → 16px | Large surfaces. |

The spacing system is **8px-based** (Tailwind defaults). Section padding uses
`py-16 sm:py-24`; content max-widths are `max-w-7xl` / `max-w-4xl`.

### Glass Effects

| Utility class          | Definition | Use |
| ---------------------- | ---------- | --- |
| `.glass`               | `oklch(0.2 0.01 264 / 55%)` + `blur(16px) saturate(140%)` + hairline border | Standard glass. |
| `.glass-gold`          | `rgba(212,175,55, 8%)` + `blur(14px)` + gold-tinted border | Gold-tinted glass. |
| `.glass-cinema`        | `rgba(19,19,19, 0.55)` + `blur(20px) saturate(150%)` + hairline border | **Premium glass** — used by `PillNav`, sticky controls, the mobile reserve bar, modals. Stronger blur than `.glass`. |
| `.glass-gold-cinema`   | `rgba(212,175,55, 0.06)` + `blur(16px)` + `rgba(212,175,55, 0.22)` border | Premium gold glass. |

### Shadows & Glows

| Utility class       | Definition | Use |
| ------------------- | ---------- | --- |
| `.glow-gold`        | `0 0 40px -8px rgba(212,175,55,0.5), 0 0 80px -20px rgba(212,175,55,0.3)` | Static gold glow on featured elements (sticky reserve orb). |
| `.glow-gold-hover`  | Transitions to a stronger glow + `translateY(-2px)` on hover | `LuxuryButton` (solid variant), footer subscribe button. |
| `.shadow-soft`      | `0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5)` | Soft elevation (admin, but defined globally). |
| `.shadow-soft-lg`   | `0 2px 4px rgba(0,0,0,0.3), 0 18px 40px -14px rgba(0,0,0,0.6)` | Larger elevation. |

### Border Glow (Animated)

A signature effect for premium CTAs, featured dishes, and key cards:

```css
@keyframes borderGlowPulse {
  0%, 100% { box-shadow: 0 0 20px -8px rgba(212,175,55,0.3), inset 0 0 20px -10px rgba(212,175,55,0.1);
             border-color: rgba(212,175,55,0.25); }
  50%      { box-shadow: 0 0 30px -6px rgba(212,175,55,0.45), inset 0 0 20px -8px rgba(212,175,55,0.15);
             border-color: rgba(212,175,55,0.4); }
}
.glow-border        { animation: borderGlowPulse 4s ease-in-out infinite; … }
.glow-border-hover  { /* static until :hover, then pulses every 3s */ }
```

Under `prefers-reduced-motion`, the animation is disabled and a static glow is applied.

### Buttons

The primary button is **`LuxuryButton`** (`src/components/site/primitives.tsx`):

| Variant   | Style |
| --------- | ----- |
| `solid`   | `.bg-gold-gradient text-black glow-gold-hover hover:-translate-y-0.5` |
| `outline` | `border border-gold/40 text-gold hover:bg-gold/8 hover:border-gold/70 backdrop-blur-sm` |
| `ghost`   | `text-gold hover:bg-gold/8` |

Shared base: `rounded-full px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em]`.

**Interactions:**
- **Ripple** — on click, a white ripple expands from the click point (`.ripple-container` + `.ripple`).
- **Magnetic** — the button drifts toward the cursor on hover (`useMagnetic` hook, strength 0.25), then springs back with `elastic.out(1, 0.4)` on leave.
- **Glow + lift** — `solid` variant glows gold and lifts 2px on hover.
- **Cursor label** — `cursorLabel="Reserve"` shows the text inside the custom cursor ring.

### Cards

Cards use `bg-card` (`#131313`) or glass surfaces, with:
- `border border-white/[0.06]` hairlines.
- `glow-border-hover` on premium cards (animated gold border on hover).
- `hover:-translate-y-1` lift on interactive cards.
- Rounded corners (`rounded-2xl` or `rounded-3xl` for modals).

### Ornamental Dividers

| Component / class   | Appearance |
| ------------------- | ---------- |
| `OrnamentDivider`   | Two hairline gradients flanking a gold `✦` |
| `.gold-rule`        | A single horizontal hairline fading from transparent → gold → transparent |
| `.hairline-gold`    | Same, `rgba(212,175,55,0.5)` center |

### Film Grain & Ambient Effects

- **Global film grain** — a fixed `div` in the root layout with an inline SVG
  `feTurbulence` noise texture at `opacity: 0.025` and `mix-blend-overlay`. Adds richness
  without distraction.
- `.cinematic-grain::after` — a localised 4% grain overlay for hero sections.
- `.ambient-orb` — blurred gold circles that float via the `orbFloat` keyframes (14s
  ease-in-out infinite). Used in heroes, the loader, and the mobile nav overlay.

### Custom Cursor

Desktop only (`@media (pointer: fine)`); hidden on touch:

| Element | Behavior |
| --- | --- |
| `.cursor-dot`  | 6px gold dot, fast spring (`stiffness: 800`). |
| `.cursor-ring` | 36px gold ring, slow trailing spring (`stiffness: 400, damping: 28`). |

The ring **grows and changes** based on the hovered element (5 states: default, hover,
view, drag, text), and can display a label (e.g. "Reserve") or an icon (view/drag) inside
it. See [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) → `Cursor`.

### Animation Timing

| Type | Duration | Easing |
| --- | --- | --- |
| Micro-interactions (hover, focus) | 200–300ms | `ease` / `cubic-bezier` defaults |
| View transitions (Framer Motion) | 300–600ms | `[0.22, 1, 0.36, 1]` (a smooth ease-out) |
| Scroll reveals (GSAP) | 0.8–1.2s | `power3.out` / `power4.out` |
| Liquid-glass page transition | ~0.85s total | `power3.inOut` / `power2.inOut` |
| Loader curtain lift | 0.9s | `[0.76, 0, 0.24, 1]` |
| Border glow pulse | 4s loop | `ease-in-out` |
| Ken Burns drift | 22s | `ease-in-out` alternate |
| Slow zoom (hero) | 18s | `ease-in-out` alternate |

All animation hooks check `prefers-reduced-motion` and render elements visible/static
when the user opts out.

### Keyframe Library

Defined in `globals.css`: `shimmer`, `slowZoom`, `floaty`, `scrollBounce`, `marquee`,
`orbFloat`, `kenBurns`, `shimmerLine`, `borderGlowPulse`, `rippleAnim`, `adminFadeUp`,
`adminShimmer`.

---

## 2. Admin Dashboard — Scoped Premium Dark

The admin uses its own palette, **scoped to `.admin-root`** so it never leaks into the
public site. All admin CSS variables and utility classes are prefixed `admin-`.

### Color Palette

| Token                | Value                        | Role |
| -------------------- | ---------------------------- | ---- |
| `--admin-bg`         | `#0b0b0f`                    | Admin page background (cooler than the public `#0A0A0A`). |
| `--admin-card`       | `#141418`                    | Card / surface background. |
| `--admin-elevated`   | `#1a1a20`                    | Elevated surfaces (modals, login card). |
| `--admin-border`     | `rgba(255, 255, 255, 0.08)`  | Hairline borders. |
| `--admin-gold`       | `#d4af37`                    | Gold accent (same hue as public). |
| `--admin-text`       | `#f4f4f6`                    | Primary text (cooler white than the public `#f5f0e8`). |
| `--admin-muted`      | `#8a8a96`                    | Muted text, labels. |

### Surfaces

| Utility class            | Definition | Use |
| ------------------------ | ---------- | --- |
| `.admin-surface`         | `--admin-card` + border + `shadow-soft` | Standard cards. |
| `.admin-surface-elevated`| `--admin-elevated` + border + `shadow-soft-lg` | Modals, login. |
| `.admin-glass`           | `rgba(20,20,24, 0.72)` + `blur(18px) saturate(140%)` | The sticky topbar. |

### Radius

`--admin-radius: 14px` (slightly larger than the public 12px for a softer, more
"app-like" feel).

### Gold (Admin)

| Utility class       | Definition |
| ------------------- | ---------- |
| `.admin-gold-bg`    | `linear-gradient(135deg, #e6c659 0%, #d4af37 55%, #b8902a 100%)` |
| `.admin-gold-text`  | Same gradient, clipped to text. |
| `.shadow-gold-glow` | `0 8px 28px -8px rgba(212,175,55,0.45)` |

### Inputs

`.admin-input` — 50px tall, 12px radius, `rgba(11,11,15,0.6)` background, focuses to a
gold border (`rgba(212,175,55,0.6)`) + a 3px gold ring (`rgba(212,175,55,0.16)`).
Wrapped by `.admin-focus:focus-within` for compound inputs. Placeholder color:
`rgba(138,138,150,0.6)`.

`.admin-label` — 11px, 600 weight, uppercase, `0.08em` tracking, `--admin-muted` color.

### Components (`src/components/admin/ui.tsx`)

The admin design-system library exports: `AdminCard`, `StatCard` (with sparkline),
`AdminSectionTitle`, `AdminButton` (variants: `solid` / `subtle` / `ghost` / `danger`;
sizes: `sm` / `md` / `lg`), `AdminInput` (icon, error, hint), `Textarea` wrapper,
`Modal` (sizes `sm`/`md`/`lg`/`xl`), `SearchableSelect`, `Toggle`, `ImageUploader`,
`Badge`, `StatusBadge`, `Skeleton`, `EmptyState`, `ConfirmDialog`, and pagination.

### Admin Animation

- `.admin-fade-up` — 280ms `cubic-bezier(0.22, 1, 0.36, 1)` entrance.
- `.admin-skeleton` — 1.6s shimmer for loading states.
- Section switches use Framer Motion `AnimatePresence` with a 250ms fade + 10px Y shift.
- The sidebar collapse animates `width` over 300ms.

### Scrollbar (Admin)

Scoped to `.admin-root`:
- 10px wide, transparent track.
- Thumb: `rgba(255,255,255,0.1)`, becomes `rgba(212,175,55,0.4)` on hover.

---

## Design System Principles

1. **Gold is scarce.** It appears only on CTAs, active states, key headings, ornamental
   dividers, and focus rings — never as a background fill or default text color.
2. **Hairlines, not boxes.** Borders are `rgba(255,255,255,0.06–0.08)` — present but
   barely visible. Surfaces are separated by subtle elevation and background tone, not
   heavy outlines.
3. **Warm dark, not pure black.** Both palettes use near-black (`#0A0A0A`, `#0B0B0F`)
   rather than `#000`, and warm/cool whites rather than stark `#fff`.
4. **Motion serves content.** Every animation reveals or emphasises something real.
   Nothing animates for its own sake, and every hook degrades under
   `prefers-reduced-motion`.
5. **Two systems, one file.** The public and admin palettes coexist in `globals.css`,
   separated by scope (global `:root` vs `.admin-root`). This lets both surfaces share
   Tailwind and shadcn/ui without visual conflict.
