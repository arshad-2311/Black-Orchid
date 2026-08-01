# Project Overview

## What Is Black Orchid?

Black Orchid is a **luxury fine-dining restaurant and banquet facility**. This repository
contains its complete digital presence: a cinematic public website designed to feel like
an editorial film, paired with a full content-management dashboard that lets staff run
the restaurant's online presence without touching code.

The project is built as a single, cohesive Next.js application — the public site lives on
the `/` route (a single-page app with client-side view switching) and the CMS lives on the
separate `/admin` route.

---

## Business Goals

| Goal | How the site delivers |
| --- | --- |
| **Establish a luxury brand presence** | A cinematic dark-and-gold aesthetic with Playfair Display headlines, GSAP scroll choreography, and a custom cursor — every detail signals "this is not a template." |
| **Drive table reservations** | The entire site is engineered to funnel visitors toward the 5-step reservation wizard. A sticky "Reserve" button, a floating desktop "Book" orb, and a mobile bottom bar keep the CTA ever-present. |
| **Showcase the menu as theatre** | A premium `DishShowcase` modal with image zoom, gallery, ingredients, allergens, and related dishes turns a menu browse into an experience. |
| **Convert banquet & catering leads** | Dedicated Banquet, Catering, and Events views present packages and capacity, each ending in a clear call to action. |
| **Enable self-service content updates** | The `/admin` dashboard lets staff edit menus, gallery, testimonials, events, catering packages, site settings, and manage reservations — no developer required. |

---

## Target Audience

### Primary: Discerning Diners
Affluent individuals and couples seeking a special-occasion restaurant. They expect
visual sophistication, want to preview dishes before booking, and decide within seconds
whether a venue is "worth it." The hero video and word-by-word headline reveal are built
to capture this audience immediately.

### Secondary: Event Planners & Celebrants
Couples planning weddings, families hosting milestone celebrations, and corporate
organisers booking galas. They need to understand capacity (`Up to 300 guests`), see
banquet imagery, compare catering packages (Silver Soirée / Golden Gala / Platinum Royal),
and reach the team. The Banquet and Catering views serve this audience directly.

### Tertiary: Restaurant Staff (CMS users)
The admin who manages day-to-day content — updating menu prices, adding seasonal dishes,
approving reservations, refreshing the gallery, and editing contact details. The admin
design system is scoped to `.admin-root` so it never bleeds into the public experience.

---

## Luxury Branding Philosophy

### Dark + Gold
The palette is anchored in near-black (`#0A0A0A` background, `#131313` cards) with a
single warm accent: **gold** (`#D4AF37`). Gold appears in gradients (`#f0d878 → #d4af37 →
#b8902a`), glows, borders, and text — never as a flat fill. The warm-white foreground
(`#f5f0e8`) replaces stark white for a softer, more inviting read.

### Cinematic, Not Template
The site avoids the conventions of restaurant templates (no 3-column feature grids, no
stock hero images with overlaid text). Instead it uses:

- **A hero video** with parallax scale and ambient gold orbs.
- **Word-by-word text reveals** (SplitType + GSAP) so headlines "write themselves."
- **Liquid-glass page transitions** that bloom from the click origin with a brief logo
  moment between views.
- **A context-aware cursor** that shifts between 5 states (default, hover, view, drag,
  text) and can display a label like "Reserve" inside the ring.
- **Film grain** layered globally at 2.5% opacity for richness.
- **Magnetic buttons** that drift toward the cursor on hover.

### Editorial Typography
- **Playfair Display** — high-contrast serif for all major headings.
- **Cormorant Garamond** — italic accents, subtitles, and body pull-quotes.
- **Geist** — the sans-serif workhorse for labels, buttons, and UI.

---

## Website Objectives

1. **Convey the brand in under 5 seconds.** The Loader curtain, hero video, and headline
   reveal establish "luxury" before the visitor reads a word.
2. **Make the menu browsable, not just listed.** Dishes open into a full-screen showcase
   with photography, ingredients, and allergens.
3. **Reduce friction to reservation.** No account required, 5 steps, validation on every
   field, success toast, and the form persists across view changes.
4. **Be fully responsive.** Mobile gets a fullscreen nav overlay, a bottom sticky reserve
   bar, an `OptionWheel` category selector, and touch-swipe galleries.
5. **Be accessible.** Keyboard navigation in modals, ARIA labels on icon buttons,
  `prefers-reduced-motion` respected by every animation hook, and 44px minimum touch
  targets.

---

## Conversion Goals

| Conversion | Mechanism |
| --- | --- |
| **Primary: Reserve a table** | Sticky `StickyReserve` button (desktop orb + mobile bar), hero CTA, footer link, and a dedicated Reservation view. |
| **Secondary: Banquet enquiry** | Banquet view CTA → routes to reservation with a banquet context. |
| **Tertiary: Catering package selection** | Catering view packages with "Enquire" CTAs. |
| **Quaternary: Newsletter signup** | Footer newsletter band with email capture and success toast. |

The entire customer journey (below) is sequenced so that every section gently nudges the
visitor toward one of these actions.

---

## Reservation Workflow (5-Step Wizard)

The `ReservationView` component implements a 5-step wizard with directional slide
transitions, validation gates, and a final confirmation:

```
Step 1: Date        →  calendar date picker (today onwards)
Step 2: Time        →  Lunch (11:00 AM – 2:30 PM) or Dinner (6:00 PM – 9:30 PM) slots
Step 3: Guests      →  1–8+ selector, with a stepper for large parties (max 20)
Step 4: Details     →  name, phone, email, special requests
Step 5: Confirm     →  review summary, submit → POST /api/reservations → success toast
```

- Each step animates in/out on the X-axis based on navigation direction.
- A progress indicator tracks completion.
- On submit, the reservation is created with `status: "PENDING"` and appears in the
  admin dashboard's Reservations section for staff to confirm.

---

## Customer Journey

The home page is choreographed as a vertical narrative. Each section introduces the next
logical question a visitor would ask:

```
Hero            → "Who is this place?"        (video + headline reveal)
Manifesto       → "What do they believe?"     (progressive word reveal)
Signature Dishes→ "What's on the menu?"       (4 featured editorial dish cards)
Story           → "How long have they been here?" (asymmetric parallax + stats)
Philosophy      → "What makes them different?" (4 numbered pillars)
Banquet Cinema  → "Can they host my event?"   (full-viewport parallax banner)
Gallery Preview → "What does it look like?"   (masonry + lightbox)
Circular Gallery→ "Show me more"              (infinite drag carousel)
Testimonials    → "Do others love it?"        (dramatic quote carousel)
Reservation     → "Book me."                  (immersive CTA section)
```

Every section ends with a `TextLink` or `LuxuryButton` that routes to the next relevant
view (Menu, Gallery, Banquet, or Reservation). The `StickyReserve` component ensures the
reservation CTA is reachable from anywhere after 700px of scroll.

---

## Design Philosophy: Cinematic Luxury, Not Template

The guiding principle is **restraint with moments of theatre**. Most of the page is quiet
— generous whitespace, hairline dividers, muted typography — so that the moments of
motion (a headline writing itself, an image revealing via clip-path, a gold border
pulsing softly) land with impact.

Three rules govern every decision:

1. **Gold is scarce.** It appears only on CTAs, active states, key headings, and
   ornamental dividers — never as a background fill or a default text color.
2. **Motion serves content.** Every animation reveals or emphasises something real
  (a heading, an image, a price). Nothing animates for its own sake, and every hook
   degrades gracefully under `prefers-reduced-motion`.
3. **The interface should feel handcrafted.** Custom cursor states, magnetic buttons,
   ripple effects on click, and the liquid-glass transition all contribute to a sense
   that someone designed this — not that a machine generated it.

The result is a site that reads as a brand film you can scroll through, ending in a
reservation rather than a credits roll.
