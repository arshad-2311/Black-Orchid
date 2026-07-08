# Task 6 — Reservation flow reinvention (agent work record)

## Task
Reinvent `src/components/site/ReservationView.tsx` into a premium step-by-step booking experience (Next.js 16 + TS + Tailwind v4 + Framer Motion), matching the Black Orchid cinematic design system established in Tasks 1–5. Only this one file may be edited.

## What I read first
- `/home/z/my-project/worklog.md` (Tasks 1+2+3+4 and 5) — confirmed luxury palette (#0A0A0A / #131313 / #D4AF37 / warm white), utility classes (`bg-gold-gradient`, `text-gold-gradient`, `glass-gold-cinema`, `glow-gold`, `ambient-orb`, `cinematic-grain`), motion helpers (`RevealText`, `RevealGroup`/`RevealItem`), primitives (`Eyebrow`, `OrnamentDivider`, `LuxuryButton` solid/outline/ghost — `GoldButton` is GONE), and the lint trap `react-hooks/set-state-in-effect`.
- `src/components/site/ReservationView.tsx` (old flat form — to be replaced).
- `src/components/site/primitives.tsx` — confirmed `LuxuryButton` API (variant + onClick + type + disabled; ripple+glow built-in; children render inside a relative span).
- `src/components/site/motion.tsx` — confirmed `RevealText` props (text, as, stagger, delay, className).
- `src/components/site/MenuView.tsx` — confirmed cinematic-header pattern (min-h-[70vh] bg img + 3 overlays + grain + 2 ambient orbs + RevealText two-span headline + OrnamentDivider + Cormorant italic subtitle) for visual consistency.
- `src/lib/api.ts` (`apiPost`), `src/lib/types.ts` (`Reservation.guests: number`), `src/lib/images.ts` (`IMAGES.ambiance[0]`).

## What I built
A complete rewrite of `src/components/site/ReservationView.tsx` (~600 lines) as a 3-step wizard:

1. **Cinematic header** — `min-h-[60vh]` with `IMAGES.ambiance[0]`, three overlays + `cinematic-grain` + two ambient gold orbs; Eyebrow "Reserve Your Evening"; massive Playfair headline (`text-6xl→8xl tracking-luxe`) = two `RevealText` spans ("Online" + "Reservation" in `text-gold-gradient`); OrnamentDivider; Cormorant italic subtitle.
2. **Step indicator** — 3 numbered circles over an absolute hairline + a `bg-gold-gradient` progress fill whose width animates to `step/(total-1)*100%`. Active dot = gold-gradient + glow; done = gold + Check icon; pending = muted. Labels below in sans uppercase.
3. **Step 1 — Your Details** — premium inputs (`h-12/14 rounded-xl border-white/10 bg-white/[0.03] focus:border-gold/50 focus:ring-gold/15`). Name full-width; Phone+Email `sm:grid-cols-2`. Validates name/phone/email on Continue with animated red inline errors.
4. **Step 2 — Date, Time & Guests** — native `<input type="date" min={today}>` styled dark (`color-scheme: dark` + gold calendar-indicator filter via scoped `<style>`). Time slots split into "Lunch Service" / "Dinner Service" Cormorant-italic groups, each a 2-col grid of pills (selected = `bg-gold-gradient text-black`). Guest selector = elegant +/- stepper with a large `text-gold-gradient` Playfair number (text-5xl/6xl) + quick-select pills 1–8+ (min 1, max 20).
5. **Step 3 — Review & Special Requests** — `SummaryCard` (`glass-gold-cinema rounded-3xl`) with a 2-col grid of all entered data (Playfair values + sans labels; date formatted as "Monday, January 15, 2024"). Textarea for special requests.
6. **Transitions** — `AnimatePresence mode="wait" custom={direction}` with direction-aware variants (forward x:+40, back x:-40, opacity, 0.4s ease). Smooth scroll-to-wizard on each step change.
7. **Success screen** — replaces the wizard via top-level AnimatePresence. `glass-gold-cinema` card with an animated gold check (SVG `motion.circle` + `motion.path` using `pathLength` draw-in + a gold `<linearGradient>`). Staggered reveals: "Reservation Requested" (Playfair), Cormorant italic message addressing guest by first name with gold-highlighted guests/date/time, a mini details card (Reference = last 8 chars uppercase, Status "Pending Confirmation", Email), a Sparkles line, and an outline `LuxuryButton` "Make Another Reservation" that fully resets state.
8. **POST** — `apiPost<Reservation>("/api/reservations", {...trimmed, guests: Number(form.guests)})`. Success → success screen + `toast.success`; error → `toast.error`. `loading` state on the confirm button ("Securing your table…").

## Key technical decisions
- **No `useEffect` at all** → avoids the `react-hooks/set-state-in-effect` lint trap entirely. All setState lives in event handlers / async callbacks. `today` is computed inline (matches the original pattern).
- **`guests: Number(form.guests)`** sent to the API to satisfy the `Reservation.guests: number` type (the form stores it as a string for the stepper).
- **Shared `inputClass` constant** keeps all inputs visually identical (h-12/14, rounded-xl, border-white/10, bg-white/[0.03], gold focus ring).
- **Scoped `.r-date-input` class + `<style>` block** for the native date picker (`color-scheme: dark` + webkit-calendar-picker-indicator gold filter) — Tailwind can't target that pseudo-element.
- **Touch-friendly**: all interactive targets ≥44px; buttons `min-h-[52px]`.
- **Responsive**: 2-col grids collapse to 1-col on mobile; guest stepper gap scales `gap-6 sm:gap-10`.

## Lint result
`cd /home/z/my-project && bun run lint` → **0 errors, 0 warnings**. No unused imports. No `react-hooks/set-state-in-effect` violations. No `GoldButton` references.

## Files changed
- `src/components/site/ReservationView.tsx` — fully rewritten (only file touched, per task constraint).

## Notes for downstream agents
- The success screen's SVG gradient uses `id="gold-grad"` — if another component on the same page reuses that exact id, dedupe the id. Currently ReservationView is the only consumer.
- `formatDate()` helper is file-local; if other views need it, promote to a shared util.
- The wizard scrolls to its own top (offset −90px for the fixed navbar) on every step change / submit / reset — keep this in mind if the navbar height changes.
