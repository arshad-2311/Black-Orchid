# Animation System

The Black Orchid public site is built around a layered, GPU-friendly animation system that combines **GSAP ScrollTrigger**, **Lenis smooth scrolling**, **SplitType** text reveals, **Framer Motion** component animations, a signature **Liquid Glass Bloom** page transition, magnetic buttons, and a context-aware cursor. Everything respects `prefers-reduced-motion` and cleans up after itself.

> **Source of truth**
> - `src/components/site/gsap-utils.ts` — GSAP hooks (`useFadeUp`, `useFadeScale`, `useParallax`, `useReveal`)
> - `src/components/site/premium-motion.ts` — Lenis, SplitType, image mask reveal, magnetic button, Liquid Glass Bloom transition
> - `src/components/site/motion.tsx` — Framer Motion primitives (`RevealText`, `RevealGroup`, `Parallax`, `ImageReveal`, `ScrollLine`, `CountUp`)
> - `src/components/site/Cursor.tsx` — context-aware cursor (5 states)

---

## 1. Architecture Overview

| Layer | Library | Role |
|-------|---------|------|
| Smooth scroll | `lenis` (v1.3.25) | RAF-driven wheel/touch smoothing, drives ScrollTrigger updates |
| Scroll-triggered tweens | `gsap` (v3.15) + `ScrollTrigger` | Reveal-on-scroll, parallax, image mask reveals |
| Text splitting | `split-type` (v0.3.4) | Word/line masks for cinematic text reveals |
| Component motion | `framer-motion` (v12) | Section transitions, modals, hover/tap micro-interactions |
| Page transition | custom (GSAP) | Liquid Glass Bloom — multi-layer overlay with origin-based bloom |
| Custom cursor | `framer-motion` + springs | 5-state context-aware cursor (desktop only) |

The four animation libraries are intentionally scoped: **GSAP** owns scroll-tied, scroll-pinned, and timeline-driven effects; **Framer Motion** owns component mount/unmount, `AnimatePresence` swaps, hover states, and `useInView` reveals; **Lenis** owns wheel/touch smoothing; **SplitType** is used inside one GSAP hook only.

---

## 2. GSAP ScrollTrigger Hooks (`gsap-utils.ts`)

All hooks register `ScrollTrigger` once at module load (guarded by `typeof window !== "undefined"`) and follow the same conventions:

- Return a `ref` to attach to a DOM element
- Bail out (and set elements visible) when `prefers-reduced-motion: reduce` is active
- Wrap animations in `gsap.context(() => { … }, el)` and return `ctx.revert()` from the effect cleanup
- Use GPU-friendly properties only: `y`, `yPercent`, `scale`, `opacity` (never `top`/`left`/`width` reflow)
- Defaults: `ease: "power3.out"`, `duration: 0.8`, `start: "top 80%"`, `once: true`

### `useFadeUp(options)`
Fade-and-rise reveal. Animates `opacity 0→1` and `y 30→0` with `power3.out`. If `stagger > 0`, animates each child of the ref instead of the ref itself.

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `stagger` | number | 0 | Seconds between children (0 = animate the element itself) |
| `delay` | number | 0 | Seconds |
| `y` | number | 30 | Initial offset in px |
| `duration` | number | 0.8 | Seconds |
| `once` | boolean | true | Re-trigger on every entry if false |

### `useFadeScale(options)`
Fade-and-scale reveal. Animates `opacity 0→1`, `scale 0.95→1`, `y 30→0`. Same shape as `useFadeUp`, minus the `y` option. Trigger start is `top 82%`.

### `useParallax(options)`
Scroll-scrubbed parallax. Animates `yPercent` from `-speed*50` to `+speed*50` as the element traverses the viewport, with `ease: "none"` and `scrub: true`.

| Option | Type | Default |
|--------|------|---------|
| `speed` | number | 0.15 |
| `start` | string | `"top bottom"` |
| `end` | string | `"bottom top"` |

### `useReveal(from, to, triggerOptions)`
Generic escape hatch. Accepts raw `gsap.TweenVars` for `from`/`to` and a partial `ScrollTrigger.Vars`. Used for one-off animations that don't fit the canned hooks. Reduced-motion still forces `{ opacity: 1, y: 0, scale: 1 }`.

---

## 3. Lenis — Global Smooth Scrolling (`premium-motion.ts`)

`useLenis()` is called once at the top of `src/app/page.tsx`. It creates a singleton `Lenis` instance with:

```ts
{
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
}
```

Key behaviors:
- `lenis.on("scroll", ScrollTrigger.update)` — keeps ScrollTrigger measurements in sync with Lenis's transformed scroll position.
- The RAF loop is wired through `gsap.ticker.add(raf)` with `gsap.ticker.lagSmoothing(0)` so GSAP and Lenis share the same frame.
- Cleanup removes the ticker callback and calls `lenis.destroy()`.
- `getLenis()` returns the singleton (used by other components that need to call `lenis.scrollTo`).
- **Reduced motion:** the entire hook returns early; native browser scrolling is used.

---

## 4. SplitType Text Reveal (`useSplitText`)

A single hook wraps `SplitType`:

```ts
useSplitText({ splitBy: "words" | "lines", stagger, duration, delay, once })
```

Behavior:
- Splits the element into `words` (default) or `lines` via `new SplitType(el, { types: splitBy })`
- Sets each target to `{ yPercent: 110, opacity: 0 }`, then tweens to `{ yPercent: 0, opacity: 1 }` with `power4.out`, stagger `0.06s`, duration `0.8s`
- Triggered by ScrollTrigger at `top 85%`, `once: true`
- Cleanup calls **both** `ctx.revert()` (GSAP) and `split.revert()` (restores the original DOM text)
- Reduced-motion: hook returns early without splitting

---

## 5. Image Mask Reveal (`useImageReveal`)

Reveals an image by animating `clip-path` from `inset(0% 0% 100% 0%)` (hidden) to `inset(0% 0% 0% 0%)` (visible), while scaling from `1.2` to `1.05`. Defaults: `duration: 1.1`, `ease: "power3.out"`, trigger `top 82%`. There is also a Framer Motion equivalent, `<ImageReveal>` (see §6).

> Reduced motion: `gsap.set(el, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 })` is called immediately so the image is visible.

---

## 6. Framer Motion Primitives (`motion.tsx`)

A small set of opinionated wrappers used by site sections:

| Component | Behavior |
|-----------|----------|
| `<RevealGroup>` / `<RevealItem>` | Staggered child reveal on `whileInView`. Variants: `hidden → { opacity: 0, y: 24 }`, `show → { opacity: 1, y: 0 }`, `duration: 0.8`, `ease: [0.22, 1, 0.36, 1]`. |
| `<RevealText>` | Word-by-word text reveal using masked `<span>` wrappers (`aria-hidden` on the mask, `aria-label` on the parent for accessibility). Stagger `0.06s`. |
| `<Parallax>` | Wraps children in a `motion.div` whose `y` follows `useScroll` progress. |
| `<ImageReveal>` | `<motion.img>` with `clip-path` mask + scale on `useInView`. Always sets `loading="lazy"`. |
| `<ScrollLine>` | Thin progress bar that scales X from 0→1 as the element scrolls past. Uses `useSpring` for smoothing. |
| `<CountUp>` | Counts from 0 to `to` when scrolled into view, using `useSpring` + `useTransform`. |
| `useElementScroll()` | Returns `{ ref, progress }` where `progress` is a spring-smoothed 0→1 motion value for an element. |

Hero (`Home.tsx`) also uses `useScroll` + `useTransform` to drive parallax `y`, `opacity`, and `scale` on the video background as the user scrolls past the first viewport.

---

## 7. Liquid Glass Bloom Page Transitions (`usePageTransition`)

The signature transition between views. Defined in `premium-motion.ts`, called from `src/app/page.tsx` whenever the active `view` changes.

### Capture phase
A global `click` listener (capture phase) inspects every click on a `button`/`a`. If the element's text contains a known navigation trigger (`"home"`, `"about"`, `"menu"`, `"banquet"`, `"gallery"`, `"catering"`, `"hours"`, `"contact"`, `"reserve"`, `"explore menu"`, `"view menu"`, `"book the banquet"`, `"view full menu"`, `"view full gallery"`, `"read our story"`, `"book"`, `"privacy"`, `"terms"`), the click center coordinates are stored along with a `TransitionVariant` inferred from the destination text.

### Variants (8 total)
`home`, `menu`, `gallery`, `banquet`, `catering`, `reservation`, `contact`, `default`. Each variant supplies:
- `VARIANT_TINTS` — the smoked-black glass background color (rgba)
- `VARIANT_BLOOM` — the gold radial bloom intensity (rgba)

For example, `reservation` uses the strongest bloom (`rgba(212,175,55,0.22)`) and the darkest tint (`rgba(18,16,10,0.88)`).

### Transition phases (8-step timeline)
A `gsap.timeline` orchestrates these layers, all appended to a single `position:fixed; inset:0; z-index:9998; pointer-events:none` container:

| Phase | Layer | Animation | Time |
|-------|-------|-----------|------|
| 1 | `darken` | Background fades to `rgba(0,0,0,0.3)` | 0 → 0.15s, `power2.out` |
| 2 | `glass` | Liquid glass circle expands `0 → maxR*2.2` (covers screen from origin) | 0.05 → 0.45s, `power3.inOut` |
| 3 | `reflection` | Diagonal gold streak sweeps `translateX -100% → 100%` | 0.15 → 0.65s, `power2.inOut` |
| 4 | `logo` | "Black Orchid" wordmark fades in (Playfair, gold gradient text) | 0.2 → 0.4s, `power2.out` |
| 5 | swap | `callback()` fires — the React view actually changes here | 0.35s |
| 6 | `logo` | Wordmark fades out | 0.45 → 0.6s, `power2.in` |
| 7 | `glass` | Retracts upward `y: -100%`, `opacity: 0` | 0.5 → 0.85s, `power3.inOut` |
| 8 | `darken` | Fades out | 0.5 → 0.7s, `power2.out` |

After completion, the container is removed, `isTransitioning` is unlocked, and `ScrollTrigger.refresh()` is called to recompute trigger positions for the new view.

### Safety
- **Singleton lock:** `isTransitioning` prevents overlapping transitions (a second call during a transition just runs the callback immediately).
- **Reduced motion:** the callback runs immediately, no overlay is built.
- **Default origin:** if no click was captured, the bloom originates from the viewport center.

---

## 8. Magnetic Buttons (`useMagnetic`)

A small hook that makes buttons drift toward the cursor on hover. Implementation in `premium-motion.ts`:

```ts
useMagnetic({ strength = 0.3 })
```

- Only activates when `(pointer: fine)` matches AND `prefers-reduced-motion` is **not** reduce
- On `mousemove`, computes cursor offset from element center and tweens `x`/`y` by `offset * strength`, `duration: 0.4`, `power2.out`
- On `mouseleave`, springs back to `0,0` with `elastic.out(1, 0.4)`, `duration: 0.5`
- Removes both listeners on cleanup

---

## 9. Context-Aware Cursor (`Cursor.tsx`)

A premium custom cursor that replaces the OS cursor on desktop. Only mounts when `(pointer: fine)` matches.

### Two elements
- **Dot** — fast, precise. `useSpring` with `stiffness: 800, damping: 35`.
- **Ring** — trailing, springy. `useSpring` with `stiffness: 400, damping: 28, mass: 0.4`.

### Five states
| State | Trigger | Ring size | Visual |
|-------|---------|-----------|--------|
| `default` | (fallback) | 36px | Thin gold border, transparent fill |
| `hover` | `a`, `button`, `[data-cursor='hover']`, `[role='button']` | 48px (or 64px if labeled) | Bright gold border + optional label text (e.g. "View", "Reserve") |
| `view` | `[data-cursor='view']`, `img.object-cover`, `.group img` | 56px | View/expand icon inside ring |
| `drag` | `[data-cursor='drag']`, `.no-scrollbar` | 52px | Drag-arrows icon inside ring |
| `text` | `input`, `textarea`, `[contenteditable]` | 4px | Shrinks to a caret; dot hidden |

A `data-cursor-label="View"` attribute on any element overrides the default hover label.

The cursor sets `cursor-host` on `<html>` (used by `globals.css` to hide the native cursor and disable `user-select` while hovering interactive elements). Reduced-motion is implicitly respected: the cursor still works, but spring transitions are short enough to feel instant. (For full reduced-motion, the page-level fallback is to rely on `(pointer: fine)` matching.)

---

## 10. Ripple Effects (LuxuryButton, PillNav)

Two components implement an ink-ripple effect (separate from the cursor): `LuxuryButton` in `primitives.tsx` and the reservation button in `PillNav.tsx`. On click, a `{x, y, id}` ripple is appended to state, rendered as an absolutely-positioned expanding circle inside the `.ripple-container` overflow-hidden wrapper. Each ripple self-removes after its animation completes (via `setTimeout` keyed on `id`).

---

## 11. Cleanup Strategy

Every animation hook owns its cleanup:

| Hook | Cleanup |
|------|---------|
| `useFadeUp`, `useFadeScale`, `useParallax`, `useReveal` | `gsap.context(() => {...}, el).revert()` — kills tweens, ScrollTriggers, and restores inline styles |
| `useSplitText` | `ctx.revert()` + `split.revert()` — also restores original text DOM |
| `useImageReveal` | `ctx.revert()` |
| `useMagnetic` | `removeEventListener` for `mousemove` and `mouseleave` |
| `useLenis` | `gsap.ticker.remove(raf)` + `lenis.destroy()` |
| `usePageTransition` | DOM container removed on timeline `onComplete`; singleton unlocked |
| `<Cursor>` | `removeEventListener("mousemove")` + removes `cursor-host` class |
| Framer Motion components | Automatic via `AnimatePresence` and `useInView` |

The `gsap.context()` pattern is the most important: by scoping every animation to a specific element and returning `ctx.revert()`, we ensure React Fast Refresh and route changes don't leak ScrollTriggers or DOM mutations.

---

## 12. Performance Optimization

- **GPU transforms only.** Animations are restricted to `opacity`, `transform` (`x`/`y`/`scale`/`yPercent`), and `clip-path`. No `top`, `left`, `width`, `height`, `box-shadow`, or `border-radius` are animated (these trigger layout/paint).
- **`will-change` on animated elements.** The hero video wrapper, magnetic buttons, cursor dot/ring, and ScrollLine bar all declare `will-change` via Tailwind/CSS to hint the compositor.
- **`gsap.ticker.lagSmoothing(0)`.** Disables GSAP's frame-skipping catch-up so animations don't "jump" after a long frame.
- **`ScrollTrigger.refresh()` after transitions.** Called at the end of every Liquid Glass Bloom so trigger positions match the new view's layout.
- **`once: true` defaults.** All reveal hooks play once and stop, keeping ScrollTrigger's queue small.
- **`pointer: fine` gating.** Cursor and magnetic buttons never mount on touch devices.

---

## 13. Reduced-Motion Support

A single helper is shared between files:

```ts
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

When active:
- **Lenis** is never instantiated — native scroll is used.
- **GSAP hooks** call `gsap.set(el, { opacity: 1, y: 0, scale: 1 })` (or `clipPath: inset(0% 0% 0% 0%)` for image reveals) and return without animating. Elements are visible immediately.
- **`useSplitText`** returns early — text is unsplit.
- **`useMagnetic`** returns early — buttons behave normally.
- **`usePageTransition`** calls the callback immediately, no overlay.
- **`OptionWheel` / `CircularGallery`** disable momentum scrolling and snap instantly.
- **`Cursor`** still works but spring values are short.

---

## 14. Conventions

| Convention | Value |
|------------|-------|
| Default ease (GSAP) | `power3.out` (most hooks), `power4.out` (SplitType) |
| Default ease (Framer Motion) | `[0.22, 1, 0.36, 1]` (custom cubic-bezier) |
| Default duration | 0.8s reveals, 1.1s image reveals, 0.4s hover, 0.15s modal fade |
| Stagger | 0.06s (SplitType, RevealText), 0.12s (RevealGroup) |
| ScrollTrigger start | `top 80%` (FadeUp), `top 82%` (FadeScale/ImageReveal), `top 85%` (SplitText) |
| z-index for overlays | `9998` (page transition), `100` (modals), `50` (mobile drawer) |

---

## 15. Known Issues (Benign)

- **Framer Motion scroll-offset warning.** A harmless console warning from `useScroll({ offset: [...] })` in newer Framer Motion versions. Does not affect behavior.
- **GSAP "target not found" warnings on Fast Refresh.** When HMR swaps a component mid-animation, GSAP may warn that the cached selector no longer exists. The `gsap.context().revert()` cleanup on unmount ensures the next mount starts clean. A full refresh resolves it.
- **Dev server must be restarted after Prisma schema changes.** Not animation-related, but worth noting alongside Fast Refresh quirks.
