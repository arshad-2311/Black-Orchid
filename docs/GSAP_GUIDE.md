# GSAP Animation Guide — Black Orchid

This document covers the GreenSock (GSAP) animation system used across the public site.
The system is split across two files:

- `src/components/site/gsap-utils.ts` — core hooks (`useFadeUp`, `useFadeScale`,
  `useParallax`, `useReveal`).
- `src/components/site/premium-motion.ts` — premium hooks (`useLenis`, `useSplitText`,
  `useImageReveal`, `useMagnetic`, `usePageTransition`) and re-exports of the core hooks.

All hooks follow the same conventions documented below.

---

## Table of Contents

1. [Plugin Registration](#1-plugin-registration)
2. [Timeline & Context Structure](#2-timeline--context-structure)
3. [ScrollTrigger Rules](#3-scrolltrigger-rules)
4. [Hook Reference](#4-hook-reference)
5. [SplitType Usage](#5-splittype-usage)
6. [Magnetic Buttons](#6-magnetic-buttons)
7. [Page Transitions](#7-page-transitions)
8. [Cleanup Rules](#8-cleanup-rules)
9. [Performance Rules](#9-performance-rules)
10. [Reduced Motion](#10-reduced-motion)
11. [Lenis Integration](#11-lenis-integration)

---

## 1. Plugin Registration

**Rule:** ScrollTrigger is registered exactly once per file that uses GSAP, guarded by a
`typeof window !== "undefined"` check (because GSAP is client-only in Next.js).

**In `gsap-utils.ts`:**
```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

**In `premium-motion.ts`:**
```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

Both files register independently because Next.js bundles them separately. Calling
`registerPlugin` multiple times is idempotent — GSAP ignores duplicate registrations.

---

## 2. Timeline & Context Structure

### 2.1 `gsap.context()` for Scoping

**Rule:** Every animation inside a hook is wrapped in `gsap.context(() => { ... }, el)`.

**Why:**
- **Scope isolation:** Selectors inside the context are scoped to `el` (the ref element),
  preventing accidental selection of elements outside the component.
- **Cleanup:** `ctx.revert()` kills all tweens and ScrollTriggers created within the
  context AND reverts any DOM changes (inline styles, added elements).

**Pattern:**
```ts
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity: 1, y: 0, scale: 1 });
    return;
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(el, { opacity: 0, y: 30 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 80%", once: true },
    });
  }, el);

  return () => ctx.revert();
}, [dependencies]);
```

### 2.2 `gsap.timeline()` for Sequenced Animations

Used in `usePageTransition` for the multi-phase transition sequence:

```ts
const tl = gsap.timeline({
  onComplete: () => {
    container.remove();
    isTransitioning = false;
    ScrollTrigger.refresh();
  },
});

// Phase 1: Darken (0.15s, starting at 0)
tl.to(darken, { backgroundColor: "rgba(0,0,0,0.3)", duration: 0.15, ease: "power2.out" }, 0);

// Phase 2: Liquid glass expands (0.4s, starting at 0.05)
tl.to(glass, { width: maxR * 2.2, height: maxR * 2.2, duration: 0.4, ease: "power3.inOut" }, 0.05);

// Phase 3: Reflection sweep (0.5s, starting at 0.15)
tl.to(reflection, { x: "100%", duration: 0.5, ease: "power2.inOut" }, 0.15);

// ... more phases
```

The third argument to `tl.to()` is the **absolute start time** in seconds, allowing
overlapping phases.

### 2.3 Stagger via `stagger` Property

When animating multiple children:
```ts
gsap.fromTo(targets, { opacity: 0, y: 30 }, {
  opacity: 1, y: 0,
  duration: 0.8,
  stagger: 0.15,           // 0.15s between each child
  ease: "power3.out",
  scrollTrigger: { trigger: el, start: "top 80%", once: true },
});
```

---

## 3. ScrollTrigger Rules

### 3.1 Reveal Animations

**Standard reveal:** `start: "top 80%"` — animation fires when the top of the element
reaches 80% of the viewport height (i.e., 20% from the bottom).

```ts
scrollTrigger: { trigger: el, start: "top 80%", once: true }
```

**Variant starts:**
- `"top 82%"` — `useFadeScale` (slightly later).
- `"top 85%"` — `useSplitText` (slightly later still, for text reveals).

### 3.2 `once: true` (One-Time Triggers)

**Rule:** All reveal animations use `once: true` — they fire once and never reset.

**Why:**
- Avoids replaying animations when scrolling back up (which feels janky).
- Frees ScrollTrigger memory after the animation completes.

### 3.3 Pinned Sections

**Rule:** For pin-and-scrub sections (like a horizontal scroll gallery), use the
`offset` pattern:

```ts
scrollTrigger: {
  trigger: el,
  start: "top top",
  end: "bottom top",
  scrub: true,
  pin: true,
}
```

In the Black Orchid codebase, `framer-motion`'s `useScroll` with
`offset: ["start start", "end start"]` is preferred over GSAP pinning for most
parallax effects (see `Home.tsx` → `BanquetCinema`). GSAP pinning is reserved for
future complex scroll-jacking sequences.

### 3.4 Scrub for Parallax

**Rule:** Parallax effects use `scrub: true` to bind animation progress to scroll
position.

```ts
gsap.fromTo(el,
  { yPercent: -speed * 50 },
  {
    yPercent: speed * 50,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  }
);
```

- `start: "top bottom"` — animation begins when the element's top enters the viewport
  from the bottom.
- `end: "bottom top"` — animation ends when the element's bottom leaves the viewport
  from the top.
- `ease: "none"` — linear, because scrub already provides natural easing via scroll
  velocity.

### 3.5 Refresh After Layout Changes

After any DOM mutation that changes element heights (page transitions, modal close,
image load), call:

```ts
ScrollTrigger.refresh();
```

This recalculates all trigger positions. The `usePageTransition` hook does this in its
`onComplete` callback.

---

## 4. Hook Reference

### 4.1 `useFadeUp`

**File:** `src/components/site/gsap-utils.ts`

**Signature:**
```ts
function useFadeUp<T extends HTMLElement = HTMLDivElement>(
  options?: {
    stagger?: number;    // default 0 (no stagger)
    delay?: number;      // default 0
    y?: number;          // default 30 (pixels)
    duration?: number;   // default 0.8
    once?: boolean;      // default true
  }
): React.RefObject<T>
```

**Animates:** `opacity: 0 → 1`, `y: 30 → 0`, `ease: "power3.out"`.

**Stagger behavior:** If `stagger > 0`, animates `el.children` instead of `el` itself,
with the given stagger interval.

**Usage:**
```tsx
const headerRef = useFadeUp<HTMLDivElement>({ duration: 0.7 });
const gridRef = useFadeScale<HTMLDivElement>({ stagger: 0.15, duration: 0.8 });

return (
  <section>
    <div ref={headerRef}>...</div>
    <div ref={gridRef}>
      <Card /> <Card /> <Card />  {/* these stagger */}
    </div>
  </section>
);
```

### 4.2 `useFadeScale`

**File:** `src/components/site/gsap-utils.ts`

**Signature:**
```ts
function useFadeScale<T extends HTMLElement = HTMLDivElement>(
  options?: {
    stagger?: number;
    delay?: number;
    duration?: number;   // default 0.8
    once?: boolean;
  }
): React.RefObject<T>
```

**Animates:** `opacity: 0 → 1`, `scale: 0.95 → 1`, `y: 30 → 0`, `ease: "power3.out"`.

**Start:** `"top 82%"` (slightly later than `useFadeUp`).

### 4.3 `useParallax`

**File:** `src/components/site/gsap-utils.ts`

**Signature:**
```ts
function useParallax<T extends HTMLElement = HTMLDivElement>(
  options?: {
    speed?: number;      // default 0.15
    start?: string;      // default "top bottom"
    end?: string;        // default "bottom top"
  }
): React.RefObject<T>
```

**Animates:** `yPercent: -speed*50 → speed*50`, scrubbed to scroll.

**Usage:**
```tsx
const ref = useParallax<HTMLDivElement>({ speed: 0.2 });
return <div ref={ref}><img src="..." /></div>;
```

### 4.4 `useReveal`

**File:** `src/components/site/gsap-utils.ts`

A generic escape hatch for custom reveals.

**Signature:**
```ts
function useReveal<T extends HTMLElement = HTMLDivElement>(
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  triggerOptions?: ScrollTrigger.Vars
): React.RefObject<T>
```

**Usage:**
```tsx
const ref = useReveal<HTMLDivElement>(
  { opacity: 0, rotateX: -15 },
  { opacity: 1, rotateX: 0, duration: 1, ease: "back.out(1.7)" },
  { start: "top 75%" }
);
```

### 4.5 `useSplitText`

**File:** `src/components/site/premium-motion.ts`

**Signature:**
```ts
function useSplitText<T extends HTMLElement = HTMLDivElement>(
  options?: {
    splitBy?: "words" | "lines";  // default "words"
    stagger?: number;              // default 0.06
    duration?: number;             // default 0.8
    delay?: number;                // default 0
    once?: boolean;                // default true
  }
): React.RefObject<T>
```

**Animates:** Splits the element's text into words/lines via SplitType, then
`yPercent: 110 → 0` with `opacity: 0 → 1`, `ease: "power4.out"`.

**Start:** `"top 85%"`.

See [§5 SplitType Usage](#5-splittype-usage) for details.

### 4.6 `useImageReveal`

**File:** `src/components/site/premium-motion.ts`

**Signature:**
```ts
function useImageReveal<T extends HTMLElement = HTMLDivElement>(
  options?: {
    delay?: number;
    duration?: number;   // default 1.1
    once?: boolean;
  }
): React.RefObject<T>
```

**Animates:** `clipPath: "inset(0% 0% 100% 0%)" → "inset(0% 0% 0% 0%)"` (wipe from top
to bottom) + `scale: 1.2 → 1.05`, `ease: "power3.out"`.

**Start:** `"top 82%"`.

**Usage:**
```tsx
const ref = useImageReveal<HTMLImageElement>({ delay: 0.2 });
return <img ref={ref} src="..." />;
```

### 4.7 `useMagnetic`

**File:** `src/components/site/premium-motion.ts`

**Signature:**
```ts
function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  options?: { strength?: number }   // default 0.3
): React.RefObject<T>
```

**Behavior:**
- On `mousemove`: translates the element toward the cursor by `strength * distance`
  from center, `duration: 0.4, ease: "power2.out"`.
- On `mouseleave`: springs back to `{x: 0, y: 0}` with `elastic.out(1, 0.4)`,
  `duration: 0.5`.

**Guards:**
- Only active on devices with `pointer: fine` (skips touch devices).
- Disabled if `prefers-reduced-motion: reduce`.

See [§6 Magnetic Buttons](#6-magnetic-buttons) for details.

### 4.8 `usePageTransition`

**File:** `src/components/site/premium-motion.ts`

**Signature:**
```ts
function usePageTransition(): { transition: (callback: () => void) => void }
```

See [§7 Page Transitions](#7-page-transitions) for the full breakdown.

### 4.9 `useLenis`

**File:** `src/components/site/premium-motion.ts`

Initializes global Lenis smooth scrolling. See [§11 Lenis Integration](#11-lenis-integration).

---

## 5. SplitType Usage

**Library:** `split-type` (npm).

**Pattern:**
```ts
import SplitType from "split-type";

const split = new SplitType(el, { types: "words" });
// split.words is now an array of <span> elements, each containing one word.

gsap.set(split.words, { yPercent: 110, opacity: 0 });
gsap.to(split.words, {
  yPercent: 0,
  opacity: 1,
  duration: 0.8,
  stagger: 0.06,
  ease: "power4.out",
  scrollTrigger: { trigger: el, start: "top 85%", once: true },
});

// Cleanup:
return () => {
  ctx.revert();    // kills the tweens
  split.revert();  // restores the original text (removes the spans)
};
```

**Types options:**
- `"words"` — splits into word spans.
- `"lines"` — splits into line spans (recalculated on resize).
- `"chars"` — splits into character spans (use sparingly — expensive).
- `"words, lines"` — both (nested).

**In Black Orchid:**
- `useSplitText` uses `"words"` by default, `"lines"` optional.
- The `RevealText` component in `src/components/site/motion.tsx` does its own
  word-splitting without SplitType (using `text.split(" ")` + `motion.span` per word),
  because it needs `framer-motion`'s variant system for the stagger.

**SplitType vs RevealText:**
| Feature             | `useSplitText` (SplitType)        | `RevealText` (framer-motion)           |
| ------------------- | --------------------------------- | -------------------------------------- |
| Library             | SplitType + GSAP                  | framer-motion                          |
| Trigger             | ScrollTrigger (`top 85%`)         | `useInView` (once, `-60px` margin)     |
| Animation           | `yPercent: 110 → 0`               | `y: "110%" → 0` (variant)              |
| Best for            | Large blocks of body text         | Headings, hero titles                  |
| Cleanup             | `ctx.revert() + split.revert()`   | Automatic (motion unmounts)            |

---

## 6. Magnetic Buttons

### 6.1 How It Works

The `useMagnetic` hook attaches `mousemove` and `mouseleave` listeners to the element:

```ts
const onMove = (e: MouseEvent) => {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;   // distance from center X
  const y = e.clientY - rect.top - rect.height / 2;   // distance from center Y
  gsap.to(el, {
    x: x * strength,    // 0.3 * distance
    y: y * strength,
    duration: 0.4,
    ease: "power2.out",
  });
};

const onLeave = () => {
  gsap.to(el, {
    x: 0,
    y: 0,
    duration: 0.5,
    ease: "elastic.out(1, 0.4)",   // springy return
  });
};
```

### 6.2 Usage in `LuxuryButton`

```tsx
export function LuxuryButton({ magnetic = true, ... }) {
  const magRef = useMagnetic<HTMLButtonElement>({ strength: 0.25 });

  return (
    <button ref={magnetic ? magRef : undefined} ...>
      {/* content */}
    </button>
  );
}
```

The `magnetic` prop defaults to `true` but can be disabled (e.g., for buttons in dense
layouts where magnetic pull would be distracting).

### 6.3 Guards

```ts
if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
```

- **Touch devices:** `pointer: fine` is false → hook does nothing, element behaves normally.
- **Reduced motion:** disabled per the global reduced-motion policy.

---

## 7. Page Transitions

The signature "liquid glass bloom" transition. Implemented in
`premium-motion.ts` → `usePageTransition`.

### 7.1 Architecture

```
User clicks nav button
        │
        ▼
Global click capture (document, capture phase)
        │
        ├─ Is target a button/anchor?
        ├─ Does text match a known nav trigger?
        └─ Store {x, y, variant} in originRef
                │
                ▼
        setView(newView) called by component
                │
                ▼
        usePageTransition.transition(callback)
                │
                ▼
        Build 7-layer DOM overlay
                │
                ▼
        gsap.timeline plays 7 phases
                │
                ├─ Phase 5 (midpoint): callback() — actual view swap
                │
                ▼
        Timeline completes → cleanup
```

### 7.2 The 7 Layers

The transition creates a temporary DOM structure appended to `document.body`:

```
<div container fixed inset-0 z-9998 pointer-events-none>
  <div darken absolute inset-0>           ← Layer 1: page darken
  <div glass circle border-radius:50%>    ← Layer 2: liquid glass (expands)
    <div bloomLayer absolute inset-0>     ← Layer 3: gold radial bloom
    <div reflection absolute inset-0>     ← Layer 4: moving gold streak
    <div grain absolute inset-0>          ← Layer 5: film grain SVG
    <div logo absolute inset-0>           ← Layer 6: "Black Orchid" wordmark
  </div>
</div>
```

### 7.3 Variant Tints

The transition picks a tint based on the destination view:

| Variant       | Tint RGBA              | Bloom RGBA                | Trigger keywords           |
| ------------- | ---------------------- | ------------------------- | -------------------------- |
| `home`        | `rgba(15,15,18,0.85)`  | `rgba(212,175,55,0.15)`   | "home"                     |
| `menu`        | `rgba(20,15,12,0.85)`  | `rgba(212,175,55,0.12)`   | "menu"                     |
| `gallery`     | `rgba(12,12,15,0.82)`  | `rgba(212,175,55,0.10)`   | "gallery"                  |
| `banquet`     | `rgba(18,14,10,0.85)`  | `rgba(212,175,55,0.18)`   | "banquet"                  |
| `catering`    | `rgba(12,14,18,0.85)`  | `rgba(212,175,55,0.14)`   | "cater"                    |
| `reservation` | `rgba(18,16,10,0.88)`  | `rgba(212,175,55,0.22)`   | "reserve", "book"          |
| `contact`     | `rgba(10,10,12,0.82)`  | `rgba(212,175,55,0.10)`   | "contact"                  |
| `default`     | `rgba(15,15,18,0.85)`  | `rgba(212,175,55,0.15)`   | (fallback)                 |

### 7.4 The 7 Phases (Timeline)

```
Time:    0.0s   0.05s   0.15s   0.2s   0.35s   0.45s   0.5s   0.85s
         │      │       │       │      │       │       │      │
Phase 1: ──────████████████████████████████████████████████████│  (darken)
Phase 2:        ███████████████████████████████████████████████  (glass expand)
Phase 3:                ███████████████████████████████████████  (reflection sweep)
Phase 4:                        ████│████████████│███           (logo fade in)
Phase 5:                             │ callback() │            (content swap)
Phase 6:                                         ████│         (logo fade out)
Phase 7:                                              ████████  (glass retract up)
Phase 8:                                              ████│     (darken cleanup)
```

| Phase | Duration | Start | Animates                                   |
| ----- | -------- | ----- | ------------------------------------------ |
| 1     | 0.15s    | 0.00  | `darken` background `0 → rgba(0,0,0,0.3)`  |
| 2     | 0.40s    | 0.05  | `glass` width/height `0 → maxR*2.2`        |
| 3     | 0.50s    | 0.15  | `reflection` x `-100% → 100%`               |
| 4     | 0.20s    | 0.20  | `logo` opacity `0 → 1`                     |
| 5     | instant  | 0.35  | `callback()` — actual view swap            |
| 6     | 0.15s    | 0.45  | `logo` opacity `1 → 0`                     |
| 7     | 0.35s    | 0.50  | `glass` y `0 → -100%`, opacity `1 → 0`     |
| 8     | 0.20s    | 0.50  | `darken` opacity `1 → 0`                   |

**Total duration:** ~0.85s.

### 7.5 Origin Calculation

The glass circle expands from the click point:

```ts
const { x, y, variant } = originRef.current;
const vx = x || window.innerWidth / 2;   // fallback to center
const vy = y || window.innerHeight / 2;

// Max radius to cover the screen from that point
const maxR = Math.hypot(
  Math.max(vx, window.innerWidth - vx),
  Math.max(vy, window.innerHeight - vy)
);
```

This ensures the circle covers the entire viewport regardless of where the user clicked
(corner clicks expand further than center clicks).

### 7.6 Singleton Guard

```ts
let isTransitioning = false;

const transition = useCallback((callback) => {
  if (prefersReducedMotion() || typeof window === "undefined") {
    callback();   // skip transition entirely
    return;
  }
  if (isTransitioning) {
    callback();   // already transitioning, just swap
    return;
  }
  isTransitioning = true;
  // ... build layers, play timeline
  // onComplete: isTransitioning = false;
}, []);
```

Prevents overlapping transitions if the user rapid-clicks nav items.

### 7.7 Click Capture

The hook installs a global capture-phase click listener:

```ts
document.addEventListener("click", onClick, true);  // capture phase
```

It inspects the clicked element (or ancestor) for nav-trigger keywords:

```ts
const isNavTrigger = [
  "home", "about", "menu", "banquet", "gallery", "catering", "hours", "contact",
  "reserve", "reserve a table", "explore menu", "view menu", "book the banquet",
  "view full menu", "view full gallery", "read our story", "book", "privacy", "terms",
].some(k => text.includes(k));
```

If matched, it stores the click coordinates and infers the variant from the destination
keyword.

---

## 8. Cleanup Rules

### 8.1 The Golden Rule

**Every `useEffect` that uses GSAP MUST return a cleanup function that calls
`ctx.revert()`.**

```ts
useEffect(() => {
  const el = ref.current;
  if (!el) return;

  const ctx = gsap.context(() => {
    // ... animations
  }, el);

  return () => ctx.revert();   // ← THIS IS MANDATORY
}, [dependencies]);
```

### 8.2 What `ctx.revert()` Does

1. **Kills all tweens** created within the context (stops them immediately).
2. **Kills all ScrollTriggers** created within the context (removes scroll listeners).
3. **Reverts DOM changes** — restores inline styles to their pre-animation values.
4. **Removes added elements** — if the context created DOM nodes, they're removed
   (though in our hooks, the only place we create nodes is `usePageTransition`, which
   has its own `container.remove()` cleanup).

### 8.3 SplitType Cleanup

When using `useSplitText`, the SplitType instance must also be reverted:

```ts
useEffect(() => {
  const el = ref.current;
  if (!el || prefersReducedMotion()) return;

  const split = new SplitType(el, { types: splitBy });
  const ctx = gsap.context(() => {
    gsap.set(targets, { yPercent: 110, opacity: 0 });
    gsap.to(targets, { yPercent: 0, opacity: 1, ... });
  }, el);

  return () => {
    ctx.revert();     // kill tweens + ScrollTriggers
    split.revert();   // restore original text (remove generated spans)
  };
}, [dependencies]);
```

### 8.4 Event Listener Cleanup

For hooks that add event listeners (`useMagnetic`, `usePageTransition`):

```ts
useEffect(() => {
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", onLeave);
  };
}, []);
```

### 8.5 Lenis Cleanup

```ts
useEffect(() => {
  if (prefersReducedMotion()) return;
  const lenis = new Lenis({ ... });
  lenisInstance = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenisInstance = null;
  };
}, []);
```

---

## 9. Performance Rules

### 9.1 GPU-Friendly Transforms Only

**Rule:** Only animate `opacity`, `transform` (x, y, scale, rotation), and `clipPath`.
Never animate `width`, `height`, `top`, `left`, `margin`, `padding`, or `background-color`
(except for short-duration transitions where unavoidable).

**Why:** Transform and opacity changes are composited on the GPU and don't trigger layout
reflows. Animating layout properties forces the browser to recalculate the entire page
layout on every frame.

**Approved properties:**
- `opacity`
- `x`, `y`, `xPercent`, `yPercent`
- `scale`, `scaleX`, `scaleY`
- `rotation`, `rotationX`, `rotationY`
- `clipPath`
- `filter` (use sparingly — can be expensive)

**Exceptions:**
- `usePageTransition` animates `width`/`height` on the glass circle (unavoidable for the
  expanding effect), but it's a single element with `position: absolute`, so reflow
  cost is minimal.
- `BackgroundColor` is animated on the `darken` layer (single element, short duration).

### 9.2 `will-change` Hint

For elements that will be animated, add `will-change: transform` (or the relevant
property) via CSS to promote them to their own compositor layer:

```css
.cursor-ring, .cursor-dot {
  will-change: transform;
}
.ambient-orb {
  will-change: transform, opacity;
}
```

Don't overuse `will-change` — applying it to too many elements exhausts GPU memory.

### 9.3 Avoid Layout Thrashing

**Rule:** Don't read DOM layout properties (`getBoundingClientRect`, `offsetWidth`,
`scrollTop`) and then immediately write styles in the same frame. This forces a
synchronous layout recalculation ("layout thrashing" / "forced reflow").

**Bad:**
```ts
function onScroll() {
  const top = el.offsetTop;        // read
  el.style.transform = `translateY(${top}px)`;  // write — forces reflow
}
```

**Good (GSAP handles this internally):**
```ts
gsap.to(el, { y: 100, scrollTrigger: { trigger: el, scrub: true } });
```

GSAP batches reads and writes across tweens to minimize reflows.

### 9.4 Use `gsap.ticker` for RAF

**Rule:** Use `gsap.ticker.add(callback)` instead of `requestAnimationFrame` directly.
GSAP's ticker:
- Syncs to the browser's RAF.
- Pauses when the tab is inactive (saves CPU).
- Provides `lagSmoothing` to handle frame drops.

```ts
const raf = (time: number) => lenis.raf(time * 1000);
gsap.ticker.add(raf);
gsap.ticker.lagSmoothing(0);   // disable lag smoothing for Lenis
```

### 9.5 `once: true` Frees Memory

When `once: true` is set on a ScrollTrigger, GSAP automatically kills the trigger after
it fires once. This frees the scroll listener and associated memory.

### 9.6 Limit Concurrent Animations

The `isTransitioning` singleton guard in `usePageTransition` ensures only one
page-transition timeline runs at a time. Similar guards should be used for any
expensive animation that could be triggered repeatedly.

---

## 10. Reduced Motion

### 10.1 The Check

```ts
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

This is defined identically in both `gsap-utils.ts` and `premium-motion.ts`.

### 10.2 What's Disabled

When `prefers-reduced-motion: reduce` is active:

| Feature                | Behavior                                                  |
| ---------------------- | --------------------------------------------------------- |
| `useFadeUp`            | `gsap.set(el, {opacity:1, y:0, scale:1})` — visible now   |
| `useFadeScale`         | Same — visible immediately                                |
| `useParallax`          | Returns early — no parallax                               |
| `useReveal`            | `gsap.set(el, {opacity:1, y:0, scale:1})` — visible now   |
| `useSplitText`         | Returns early — text shows normally (no split)            |
| `useImageReveal`       | `gsap.set(el, {clipPath:"inset(0 0 0 0)", scale:1})`      |
| `useMagnetic`          | Returns early — no magnetic effect                        |
| `usePageTransition`    | `callback()` fires immediately — no overlay, no timeline  |
| `useLenis`             | Returns early — native browser scroll only                |
| `Cursor` component     | Doesn't mount (checked in `Chrome.tsx` before render)     |

### 10.3 Implementation Pattern

Every hook follows the same pattern:

```ts
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity: 1, y: 0, scale: 1 });   // ← visible state
    return;                                           // ← no animation, no ctx
  }
  // ... normal animation
}, []);
```

The `gsap.set` ensures elements aren't stuck in their initial hidden state if the
animation never runs.

### 10.4 Framer Motion Parity

The `motion.tsx` components (`RevealText`, `RevealGroup`, etc.) use framer-motion's
built-in reduced-motion support via `viewport={{ once: true }}` and standard variant
transitions. Framer Motion automatically respects `prefers-reduced-motion` for
`whileInView` animations.

---

## 11. Lenis Integration

### 11.1 What Lenis Does

[Lenis](https://github.com/studio-freight/lenis) is a smooth-scroll library that
intercepts wheel/touch events and applies inertia/easing to the scroll position.
This gives the site a "buttery" scroll feel without janky frame drops.

### 11.2 Initialization

```ts
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    lenisInstance = lenis;

    // Sync Lenis scroll → ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP's ticker (so everything shares one RAF)
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}
```

### 11.3 The Critical Sync Line

```ts
lenis.on("scroll", ScrollTrigger.update);
```

**This is the most important line in the entire animation system.** Without it:

- Lenis smoothly scrolls the page using `transform: translate3d` on the `<html>` element.
- ScrollTrigger listens to native `scroll` events, which fire at the *final* position
  (after Lenis finishes its smooth animation).
- Result: ScrollTrigger animations fire all at once at the end of the scroll, instead of
  progressively during the scroll.

With the sync, ScrollTrigger reads Lenis's smoothed scroll position on every Lenis
scroll event, so animations stay perfectly in sync with the visible scroll.

### 11.4 GSAP Ticker as Single RAF

```ts
gsap.ticker.add(raf);
```

This makes Lenis driven by GSAP's `requestAnimationFrame` loop, ensuring:
- One shared RAF for all animations (Lenis + GSAP + ScrollTrigger).
- Tab visibility detection (pauses when tab is hidden).
- Frame budget management via `lagSmoothing`.

### 11.5 `getLenis()` Accessor

```ts
export function getLenis() {
  return lenisInstance;
}
```

Allows other code to access the Lenis instance (e.g., to programmatically scroll to a
position, or to stop/start smooth scrolling when a modal opens).

### 11.6 When Lenis Is Disabled

- `prefers-reduced-motion: reduce` → `useLenis` returns early.
- Touch devices with `pointer: coarse` — Lenis still works but with `touchMultiplier: 1.5`
  for more natural touch scrolling.

---

## Quick Reference: Hook Decision Tree

```
Do I need to animate...?
│
├─ A simple fade-in/slide-up on scroll
│  └─ useFadeUp (single) or useFadeUp({stagger}) (children)
│
├─ A fade + scale (e.g., card grids)
│  └─ useFadeScale (single) or useFadeScale({stagger}) (children)
│
├─ Parallax (element moves as you scroll past)
│  └─ useParallax({speed})
│
├─ A custom one-off animation
│  └─ useReveal(from, to, triggerOptions)
│
├─ Text that reveals word-by-word (large body text)
│  └─ useSplitText({splitBy:"words"})
│
├─ An image that wipes in (clip-path)
│  └─ useImageReveal({delay})
│
├─ A button that pulls toward the cursor
│  └─ useMagnetic({strength})
│
├─ A view change with cinematic transition
│  └─ usePageTransition().transition(callback)
│
└─ Smooth scrolling for the whole page
   └─ useLenis() (call once in a top-level component)
```

## Anti-Patterns to Avoid

1. **Don't call `gsap.to(el, ...)` outside a `gsap.context()`** — you'll lose cleanup.
2. **Don't animate `width`/`height`/`top`/`left`** unless absolutely necessary — use
   transforms.
3. **Don't forget `once: true`** on reveal animations (unless you want them to replay).
4. **Don't create multiple Lenis instances** — use the singleton via `useLenis()`.
5. **Don't skip the reduced-motion check** — accessibility is non-negotiable.
6. **Don't install ScrollTrigger inside a component body** — register it at module
   top-level (the `if (typeof window)` guard handles SSR).
7. **Don't call `ScrollTrigger.refresh()` during an animation** — call it after
   (`onComplete`) or after a `setTimeout`.
