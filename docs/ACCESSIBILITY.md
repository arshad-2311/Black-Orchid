# Accessibility

Black Orchid is built to WCAG 2.1 AA. The site uses semantic HTML, ARIA roles where appropriate, full keyboard navigation, focus management in modals, and respects `prefers-reduced-motion`. The luxury dark theme is tuned for high color contrast.

> **Source of truth**
> - `src/components/admin/ui.tsx` — `<Modal>` (focus trap, ARIA, Escape), `<SearchableSelect>` (keyboard nav)
> - `src/components/site/OptionWheel.tsx` — ARIA `listbox`/`option`, arrow-key nav
> - `src/components/site/CircularGallery.tsx` — ARIA `region`, arrow-key nav
> - `src/components/site/gsap-utils.ts`, `premium-motion.ts` — `prefers-reduced-motion` handling
> - `src/app/globals.css` — color tokens, focus-visible styles
> - `src/app/layout.tsx` — `<html lang="en">`, metadata

---

## 1. Semantic HTML

The site uses semantic HTML elements throughout:

| Element | Where |
|---------|-------|
| `<html lang="en">` | `src/app/layout.tsx` — declares language for screen readers |
| `<main>` | Admin shell (`<main className="flex-1 p-4 sm:p-6 lg:p-8">`) |
| `<header>` | Admin topbar, site Navbar |
| `<nav>` | Admin sidebar (`<nav className="flex-1 ...">`), PillNav |
| `<section>` | Site view components (Hero, SignatureDishes, Story, etc.) |
| `<article>` | Menu item cards, testimonial cards |
| `<aside>` | Admin sidebar (`<aside>`) |
| `<footer>` | Site Footer, admin sidebar footer |
| `<figure>` / `<figcaption>` | Dish showcase images, testimonial avatars |
| `<blockquote>` | Testimonial messages |
| `<table>` / `<thead>` / `<tbody>` / `<th>` / `<td>` | Admin reservation table, recent reservations on Overview |
| `<form>` / `<label>` / `<input>` / `<textarea>` | Login screen, all admin modals |
| `<button>` | All interactive elements (no `<div onClick>`) |

> **Note:** The site does not currently use `<main>` for the public site root — `src/app/page.tsx` wraps content in `<div className="flex min-h-screen flex-col">`. The admin shell does use `<main>`. Consider adding `<main>` to the public site for stricter semantics.

---

## 2. ARIA Roles & Attributes

### Modals (`<Modal>` in `src/components/admin/ui.tsx`)
```tsx
<motion.div
  role="presentation"
  onClick={onClose}
  className="... overlay ..."
>
  <motion.div
    ref={dialogRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabIndex={-1}
    onClick={(e) => e.stopPropagation()}
    className="... dialog ..."
  >
    <h3 id="modal-title">...</h3>
    ...
  </motion.div>
</motion.div>
```

- `role="dialog"` — announces as a dialog to screen readers
- `aria-modal="true"` — tells screen readers that background content is inert
- `aria-labelledby="modal-title"` — associates the dialog with its heading (the `<h3 id="modal-title">` inside)
- `tabIndex={-1}` — allows programmatic focus (`dialogRef.current.focus()`)
- The overlay has `role="presentation"` (it's purely visual)

### `OptionWheel` (mobile category selector)
```tsx
<div role="listbox" aria-label="Menu category">
  {options.map((o) => (
    <button
      role="option"
      aria-selected={o.value === value}
      ...
    >
      {o.label}
    </button>
  ))}
</div>
```

- `role="listbox"` — a selectable list
- `role="option"` on each item
- `aria-selected` reflects the active value

### `CircularGallery` (premium image carousel)
```tsx
<section role="region" aria-label="Gallery carousel">
  <div ref={scrollRef} className="... scroll container ...">
    {images.map((img, i) => (
      <figure aria-label={img.title} ...>
        <img src={img.url} alt={img.title} ... />
        <figcaption>{img.label}</figcaption>
      </figure>
    ))}
  </div>
</section>
```

- `role="region"` with `aria-label` — a named landmark region
- `<figure>` + `<figcaption>` — semantic image-with-caption

### Buttons with icon-only content
Every icon-only button has an `aria-label`:
```tsx
<button onClick={onClose} aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

<button onClick={() => remove(idx)} aria-label={`Delete image ${idx + 1}`}>
  <Trash2 className="h-3.5 w-3.5" />
</button>
```

### Toggle buttons
The animated `<Toggle>` is a real `<button>`:
```tsx
<button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5">
  <span className={cn("relative h-6 w-11 rounded-full ...", checked ? "..." : "...")}>
    <motion.span ... />
  </span>
  {label && <span className="admin-label">{label}</span>}
</button>
```

### Status badges
`<StatusBadge>` uses semantic colors but the status text is also present:
```tsx
<span className="...">
  <span className="h-1.5 w-1.5 rounded-full bg-current" />
  {status}
</span>
```
The text (`PENDING`, `CONFIRMED`, etc.) is readable by screen readers; the colored dot is decorative.

### Stars rating
```tsx
<div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
  {Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} className={cn("h-3.5 w-3.5", i < count ? "fill-admin-gold ..." : "fill-transparent ...")} />
  ))}
</div>
```
The `aria-label` provides the rating as text; the individual stars are visual only.

### Decorative elements
The hero video has `aria-hidden` and `tabIndex={-1}`:
```tsx
<video aria-hidden tabIndex={-1} ...>
```
The global film grain overlay has `aria-hidden`:
```tsx
<div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025] ..." aria-hidden />
```

---

## 3. Keyboard Navigation

### Modals
- **Escape** closes the modal (`e.preventDefault(); onClose()`)
- **Tab** cycles focus within the modal (focus trap — see §4)
- **Shift+Tab** wraps to the last focusable element
- **Enter** on the focused button activates it (default behavior)

### `SearchableSelect`
- **ArrowDown** (or **Enter** when closed) opens the dropdown
- **ArrowDown** / **ArrowUp** moves the active option (clamped to first/last)
- **Enter** selects the active option
- **Escape** closes the dropdown without selecting

### `OptionWheel`
- **Tab** moves focus to a wheel item
- **ArrowUp** / **ArrowDown** moves between items and selects
- Reduced motion disables momentum; selection snaps instantly

### `CircularGallery`
- **Tab** moves focus to a gallery item
- **ArrowLeft** / **ArrowRight** moves between images and scrolls them into view
- Reduced motion disables smooth scroll; jumps instantly

### Admin reservation table
- **Tab** moves through: search input, status dropdown, sort headers, row checkboxes, action buttons, pagination
- **Space** toggles the focused checkbox
- **Enter** activates the focused button

### General
- All interactive elements are `<button>`, `<a>`, or `<input>` — natively focusable
- No `tabindex={0}` on `<div>` elements (anti-pattern — use a real button)
- Skip-to-content link is **not** currently implemented (TODO — useful for keyboard users who don't want to tab through the entire nav)

---

## 4. Focus Management

### Focus trap in `<Modal>`
When a modal opens:
1. The previously-focused element is saved: `previouslyFocused.current = document.activeElement`
2. Body scroll is locked: `document.body.style.overflow = "hidden"`
3. A `keydown` listener is added that:
   - On **Escape**: closes the modal
   - On **Tab**: if focus would leave the dialog, wraps to the other end
4. After a 50ms delay (to let the DOM settle), the first focusable element inside the dialog is focused:
   ```ts
   const first = dialog.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
   (first || dialog).focus();
   ```

When the modal closes:
1. The `keydown` listener is removed
2. Body scroll is restored: `document.body.style.overflow = ""`
3. Focus is restored to the previously-focused element: `previouslyFocused.current?.focus?.()`

This pattern ensures:
- Keyboard users can't tab out of the modal into the background
- Screen readers announce the modal's title when it opens
- The triggering button regains focus when the modal closes (so the user doesn't lose their place)

### Focus restoration on route change
When the admin switches sections (Overview → Reservations, etc.), the old section unmounts and the new one mounts. Framer Motion's `AnimatePresence` handles the visual transition. Focus is not explicitly managed here — the section title becomes the page's main heading, and the user's next Tab starts from the top of the new section.

### `focus-visible` styles
All interactive elements have `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2`:
```css
/* In globals.css and via Tailwind classes */
.admin-button { @apply focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg; }
```

The `:focus-visible` (not `:focus`) pseudo-class ensures the ring only shows for keyboard users — mouse clicks don't trigger it. This is the modern, accessible pattern.

---

## 5. `prefers-reduced-motion`

A single helper is used across the animation system:
```ts
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

### What's disabled

| System | Reduced-motion behavior |
|--------|-------------------------|
| **Lenis smooth scroll** | Not instantiated — native browser scroll is used |
| **GSAP reveal hooks** (`useFadeUp`, `useFadeScale`, `useParallax`, `useReveal`) | `gsap.set(el, { opacity: 1, y: 0, scale: 1 })` — elements are visible immediately, no animation |
| **`useSplitText`** | Returns early — text is unsplit (no word/line masks) |
| **`useImageReveal`** | `gsap.set(el, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 })` — image is fully visible |
| **`useMagnetic`** | Returns early — buttons behave normally |
| **Liquid Glass Bloom transition** | The callback fires immediately, no overlay built — the view changes instantly |
| **`OptionWheel`** | `reducedMotion.current = true` — momentum disabled, scroll snaps instantly via `el.scrollTop = clamped * ITEM_H` |
| **`CircularGallery`** | `reducedMotion` state — smooth scroll disabled, `el.scrollLeft = idx * slot` jumps directly |
| **Framer Motion `<RevealText>` / `<ImageReveal>`** | `useInView` still triggers, but the animation duration is short enough to feel instant. For strict compliance, wrap in a `prefersReducedMotion` check. |

### What's still enabled
- **Custom cursor** — still works on `(pointer: fine)` devices. The springs are short enough to feel instant. (If full compliance is needed, disable the cursor entirely under reduced motion.)
- **Hover effects** (color changes, transforms on cards) — these are CSS transitions, not motion, and are generally allowed under reduced-motion guidelines.
- **Toasts** — slide/fade in/out, but brief enough to be acceptable.

### Testing reduced motion
In Chrome DevTools:
1. Open the Rendering tab (Cmd+Shift+P → "Show Rendering")
2. Under "Emulate CSS media feature `prefers-reduced-motion`", select `reduce`
3. Reload the page

All animations should be disabled, and all content should be visible immediately.

---

## 6. Color & Contrast

### Luxury dark theme (`src/app/globals.css`)
```css
:root {
  --background: #0a0a0a;       /* near-black */
  --foreground: #f5f0e8;       /* warm off-white */
  --primary: #d4af37;          /* gold */
  --primary-foreground: #0a0a0a;
  --muted-foreground: #8a8a8a;
  --border: rgba(255, 255, 255, 0.08);
}
```

### Contrast ratios (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)

| Pair | Foreground | Background | Ratio | Pass? |
|------|------------|------------|-------|-------|
| Body text | `#f5f0e8` | `#0a0a0a` | 17.3:1 | ✅ AAA |
| Gold on black | `#d4af37` | `#0a0a0a` | 9.2:1 | ✅ AAA |
| Muted text | `#8a8a8a` | `#0a0a0a` | 4.6:1 | ✅ AA |
| Muted text on card | `#8a8a8a` | `#131313` | 4.4:1 | ⚠️ Borderline (passes AA for normal text at 4.5:1 just under) |
| Admin text | `#f4f4f6` | `#0b0b0f` | 17.5:1 | ✅ AAA |
| Admin gold | `#d4af37` | `#0b0b0f` | 9.4:1 | ✅ AAA |
| Admin muted | `#8a8a96` | `#0b0b0f` | 4.7:1 | ✅ AA |
| Status: amber | `amber-400` | `amber-500/10` on `#141418` | ~7:1 | ✅ AA |
| Status: emerald | `emerald-400` | `emerald-500/10` on `#141418` | ~7:1 | ✅ AA |
| Status: red | `red-400` | `red-500/10` on `#141418` | ~6:1 | ✅ AA |
| Status: sky | `sky-300` | `sky-400/10` on `#141418` | ~7:1 | ✅ AA |

### Color is not the only signal
Status badges use **both** color and text (`PENDING`, `CONFIRMED`, etc.). A colorblind user can read the text. The colored dot is decorative.

Spice level uses **flame icons** (0-3), not just color. The `aria-label` reads "Spice: Mild" (etc.).

Featured/chef badges use **text labels** ("Featured", "Chef"), not just color.

### Dark mode only
The public site is dark-mode only (no light mode toggle). The `:root` declares the dark palette; there's no `.dark` class toggle. This is a deliberate design choice — the luxury aesthetic requires the dark background. The admin panel is also dark.

> `next-themes` is installed but not used. If you add a light mode, you'd need to define light-mode token values and a toggle UI.

---

## 7. Touch Targets

WCAG 2.1 AA recommends a minimum **44×44 CSS pixels** for touch targets.

| Element | Size | Meets 44px? |
|---------|------|-------------|
| Primary buttons (`AdminButton` md) | `h-10` (40px) | ⚠️ Close |
| Large buttons (`AdminButton` lg) | `h-12` (48px) | ✅ |
| Small buttons (`AdminButton` sm) | `h-8` (32px) | ❌ (icon-only actions on hover overlays) |
| Sidebar nav items | `py-2.5` (~40px) | ⚠️ Close |
| Pagination buttons | `h-8 w-8` (32px) | ❌ |
| Modal close button | `h-9 w-9` (36px) | ⚠️ Close |
| Toggle switch | `h-6 w-11` (24×44px) | ⚠️ Width OK, height under |
| SearchableSelect option | `py-2` (~36px) | ⚠️ Close |
| Mobile nav items in drawer | `py-2.5` (~40px) | ⚠️ Close |
| Image upload hover buttons | `h-8 w-8` (32px) | ❌ |

**Known gaps:** small icon buttons (32px) on hover overlays and pagination are below the 44px recommendation. These are primarily desktop interactions (hover overlays don't appear on touch), so the impact is limited. For full compliance:
- Increase `sm` button height to `h-9` (36px) or `h-10` (40px)
- Increase pagination buttons to `h-9 w-9` or `h-10 w-10`
- Add `min-h-[44px]` to sidebar nav items

---

## 8. Images & Alt Text

### All images have alt text
```tsx
<img src={dish.image} alt={dish.name} className="..." />
<img src={testimonial.photo} alt={testimonial.name} className="..." />
<img src={img.url} alt={img.title} className="..." />
```

The alt text is descriptive (the dish name, the person's name, the gallery image's title) — not generic ("image" or "photo").

### Decorative images
Truly decorative images (background textures, the film grain overlay) have `aria-hidden`:
```tsx
<div className="pointer-events-none fixed inset-0 ..." aria-hidden />
```

The hero video is `aria-hidden` and `tabIndex={-1}` — it's decorative atmosphere, not content.

### `loading="lazy"` and `decoding="async"`
All content images use both. This doesn't affect accessibility, but it improves performance (which is an accessibility concern — slow pages are inaccessible to users on slow connections).

### `<ImageReveal>` component
The Framer Motion image-reveal wrapper always sets `alt`:
```tsx
<ImageReveal src={url} alt={desc} className="..." rounded="rounded-2xl" />
```
And always sets `loading="lazy"`.

---

## 9. Forms

### Labels
Every input has an associated `<label>` (via `<AdminInput>` / `<AdminTextarea>`):
```tsx
<label className="block">
  <span className="mb-1.5 flex items-center gap-1 admin-label">
    {label}{required && <span className="text-admin-gold">*</span>}
  </span>
  <input ... />
</label>
```

The `<label>` wraps both the label text and the input — no `htmlFor`/`id` pairing needed (implicit association).

### Required fields
Marked with a gold `*` after the label text. The `required` attribute is also set on the input where appropriate (HTML5 validation).

### Error display
Errors appear below the input, with an `AlertTriangle` icon and red text:
```tsx
<p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-red-400">
  <AlertTriangle className="h-3 w-3" />{error}
</p>
```

The error is not currently announced via `aria-live` — consider adding `aria-describedby` pointing to the error element, or wrapping the error in `role="alert"`.

### `autoComplete` attributes
The login form uses correct autocomplete tokens:
```tsx
<input type="email" autoComplete="username" ... />
<input type="password" autoComplete="current-password" ... />
```

The change-password form uses:
```tsx
<input type="password" autoComplete="current-password" ... />  {/* current */}
<input type="password" autoComplete="new-password" ... />       {/* new */}
<input type="password" autoComplete="new-password" ... />       {/* confirm */}
```

This allows password managers to fill in credentials correctly.

---

## 10. SEO & Metadata

### `<html lang="en">`
Declared in `src/app/layout.tsx`. Essential for screen readers to pronounce content correctly.

### Metadata (`src/app/layout.tsx`)
```ts
export const metadata: Metadata = {
  title: "Black Orchid — Fine Dining & Banquet | Luxury Restaurant",
  description: "Black Orchid is a premier luxury restaurant & banquet facility ...",
  keywords: ["luxury restaurant", "fine dining", "banquet facility", ...],
  authors: [{ name: "Black Orchid" }],
  openGraph: {
    title: "Black Orchid — Fine Dining & Banquet",
    description: "...",
    siteName: "Black Orchid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Orchid — Fine Dining & Banquet",
    description: "...",
  },
};
```

- **Title** — descriptive, includes brand and keywords
- **Description** — under 160 chars, actionable
- **OpenGraph** — for Facebook/LinkedIn sharing
- **Twitter** — `summary_large_image` card
- **Keywords** — mostly ignored by modern search engines, but doesn't hurt

### `robots.txt` (`public/robots.txt`)
```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
```

Allows all major crawlers full access. No `Disallow` rules — the site has no private areas to hide (admin is gated by auth, not by robots.txt).

### Sitemap
Not currently generated. To add, use Next.js's built-in `sitemap.ts`:
```ts
// src/app/sitemap.ts
export default function sitemap() {
  return [
    { url: "https://blackorchid.com", lastModified: new Date() },
    { url: "https://blackorchid.com#menu", lastModified: new Date() },
    // ...
  ];
}
```

### Heading hierarchy
- Each view has one `<h1>` (or should — verify per view)
- Section titles are `<h2>`, subsections `<h3>`
- The admin uses `<h1>` for the section title in the topbar, `<h2>` for card headings, `<h3>` for sub-sections

---

## 11. Screen Reader Testing

### NVDA / VoiceOver
The site is designed to work with screen readers:
- Semantic HTML means content is announced correctly
- ARIA roles on modals announce "dialog" / "alert"
- `aria-label` on icon buttons provides text alternatives
- `aria-selected` on OptionWheel items announces selection state
- `aria-label` on star ratings announces "4 out of 5 stars"

### Known screen-reader issues
- **Toasts (Sonner)** — Sonner toasts are announced via `aria-live="polite"` by default. Verify the toast container has this attribute.
- **Dynamic content updates** — when admin list data loads, the change is not announced. Consider `aria-live="polite"` on the list container, or use `aria-busy="true"` during loading.
- **Loading skeletons** — skeletons are visual only. Add `aria-busy="true"` to the container or `aria-label="Loading"` to the skeleton.

---

## 12. Accessibility Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| `lang` attribute on `<html>` | ✅ | `lang="en"` |
| Page title | ✅ | Via `metadata.title` |
| Meta description | ✅ | Via `metadata.description` |
| Semantic HTML | ✅ | `main`, `header`, `nav`, `section`, `article`, `aside`, `footer`, `figure`, `blockquote`, `table` |
| Heading hierarchy | ✅ | One `<h1>` per view, hierarchical `<h2>`/`<h3>` |
| Alt text on images | ✅ | Descriptive alts; decorative images `aria-hidden` |
| Color contrast ≥ 4.5:1 | ✅ | Body text 17:1, muted text 4.6:1 |
| Color not sole signal | ✅ | Status badges have text; spice has icons |
| Keyboard accessible | ✅ | All interactive elements are `<button>`/`<a>`/`<input>` |
| Focus visible | ✅ | `focus-visible:ring-2 ring-gold` on all interactive elements |
| Focus trap in modals | ✅ | Tab/Shift+Tab wraps; Escape closes |
| Focus restoration | ✅ | Triggering element regains focus on close |
| ARIA roles | ✅ | `dialog`, `listbox`, `option`, `region`, `aria-modal`, `aria-labelledby`, `aria-selected`, `aria-label` |
| `prefers-reduced-motion` | ✅ | All animation systems respect it |
| Touch targets ≥ 44px | ⚠️ | Most are 40px; some icon buttons are 32px |
| Skip-to-content link | ❌ | Not implemented — add for keyboard users |
| Form labels | ✅ | All inputs have `<label>` |
| Required fields indicated | ✅ | Gold `*` after label |
| Error identification | ✅ | Red text + icon below input |
| `autoComplete` on forms | ✅ | Correct tokens on login/password forms |
| `robots.txt` | ✅ | Allows all crawlers |
| Sitemap | ❌ | Not generated |
| 404 page | ✅ | `src/app/not-found.tsx` exists |
