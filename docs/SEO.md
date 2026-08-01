# SEO

How Black Orchid is optimised for search engines, social sharing, and accessibility crawlers.

> **Source of truth**
> - `src/app/layout.tsx` — Next.js Metadata API export
> - `public/robots.txt` — crawler directives
> - `src/lib/types.ts` → `SiteSettings.metaTitle` / `metaDesc` (runtime-editable from Admin → Settings)
> - `prisma/seed.ts` — seeds the singleton `SiteSettings` row with `metaTitle` / `metaDesc`

---

## 1. Metadata (Next.js Metadata API)

All static metadata is declared in `src/app/layout.tsx` via the Next.js 16 `Metadata` export. Next.js renders the corresponding `<title>`, `<meta>`, Open Graph, and Twitter tags into the document `<head>` at build/request time.

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "Black Orchid — Fine Dining & Banquet | Luxury Restaurant",
  description:
    "Black Orchid is a premier luxury restaurant & banquet facility offering exquisite cuisine, an opulent ambience, and unforgettable dining experiences. Reserve your table today.",
  keywords: [
    "luxury restaurant",
    "fine dining",
    "banquet facility",
    "catering",
    "Black Orchid",
    "private events",
    "gourmet cuisine",
  ],
  authors: [{ name: "Black Orchid" }],
  openGraph: {
    title: "Black Orchid — Fine Dining & Banquet",
    description:
      "A premier luxury restaurant & banquet facility. Exquisite cuisine, opulent ambience, unforgettable experiences.",
    siteName: "Black Orchid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Orchid — Fine Dining & Banquet",
    description: "A premier luxury restaurant & banquet facility.",
  },
};
```

### Fields exposed

| Field           | Value                                                                                        | Where                          |
| --------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| `<title>`       | `Black Orchid — Fine Dining & Banquet \| Luxury Restaurant`                                  | `metadata.title`               |
| `description`   | Premier luxury restaurant & banquet facility pitch                                          | `metadata.description`         |
| `keywords`      | 7 luxury-dining keywords                                                                     | `metadata.keywords`            |
| `authors`       | `Black Orchid`                                                                               | `metadata.authors`             |
| Open Graph      | `title`, `description`, `siteName`, `type: "website"`                                        | `metadata.openGraph`           |
| Twitter card    | `summary_large_image` + title + description                                                  | `metadata.twitter`             |
| `lang`          | `en` (on `<html lang="en">`)                                                                 | `RootLayout`                   |
| `suppressHydrationWarning` | `true` on `<html>` (theme hydration safety)                                       | `RootLayout`                   |

### What is **not** set (roadmap)

- **No `metadataBase`** — Next.js needs an absolute `metadataBase` URL to resolve OG image URLs into absolute URLs. Currently no `og:image` is configured. Add `metadataBase: new URL("https://blackorchid.com")` in production.
- **No `og:image` / `twitter:image`** — there is no social share preview image. The 44 static WebP files in `public/img/` are an obvious source for one (e.g. `IMAGES.hero[0]`).
- **No `alternates.canonical`** — see §4 below.
- **No per-route `generateMetadata()`** — the public site is a single `/` route with hash navigation (see [ROUTING.md](./ROUTING.md)), so per-view `<title>` changes would require wiring the Zustand `view` state into a metadata generator. Not yet implemented.
- **No `robots` metadata export** — crawler rules live in `public/robots.txt` only.

---

## 2. robots.txt

`public/robots.txt` is served as a static file at the site root.

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

### Notes

- All user agents are **allowed** to crawl the entire site, including `/admin`. There is no `Disallow` rule. The admin panel itself is gated client-side (the login screen shows for unauthenticated users) and all write APIs require a JWT — so crawlers cannot mutate data — but the admin HTML is technically crawlable. If you want to hide `/admin` from search results, add:
  ```
  User-agent: *
  Disallow: /admin
  ```
- **No `Sitemap:` directive** is declared, because no `sitemap.xml` is generated yet (see §5).
- **No `Crawl-delay`** is set.

---

## 3. Font Preloading (`next/font`)

Fonts are loaded through `next/font/google` in `src/app/layout.tsx`. Next.js automatically:

1. Downloads the font files at build time.
2. Self-hosts them from `/_next/static/media/`.
3. Adds `<link rel="preload">` for the font files in the document `<head>`.
4. Eliminates the layout shift that `@font-face` from a CDN would cause (no FOUT/FOIT).

```ts
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});
```

The three `--font-*` CSS variables are applied to `<body>` and consumed throughout the codebase (e.g. `font-[family-name:var(--font-playfair)]`).

### Why this matters for SEO

- **No external font requests** → faster LCP, no third-party dependency.
- **`font-display: swap` is automatic** → text is visible immediately.
- **Preloaded** → fonts arrive before the first paint that needs them.

---

## 4. Canonical URLs

Canonical URLs are **not** explicitly declared today.

- Next.js does not emit `<link rel="canonical">` unless you set `metadata.alternates.canonical` (per-route) or `metadataBase` + `alternates.canonical` (root).
- Because the public site is a single-page app with hash routing (`#menu`, `#gallery`, …), every "view" shares the same canonical URL: `https://blackorchid.com/`. Search engines treat hash fragments as part of the same page, so duplicate-content issues are minimal — but **declaring a canonical explicitly is still recommended** so scrapers and aggregators don't index query-string variants.

### Roadmap

```ts
// future layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://blackorchid.com"),
  alternates: { canonical: "/" },
  // ...
};
```

---

## 5. Sitemap (Roadmap)

There is **no `sitemap.xml`** generated today. Next.js 16 supports `app/sitemap.ts` as a first-class feature.

### Roadmap implementation

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://blackorchid.com";
  const views = ["", "#about", "#menu", "#banquet", "#gallery", "#catering", "#hours", "#contact", "#reservation", "#privacy", "#terms"];
  return views.map((v) => ({
    url: `${base}/${v}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: v === "" ? 1 : 0.7,
  }));
}
```

> Hash URLs (`/#menu`) are not ideal sitemap entries — search engines ignore the fragment. A future refactor that promotes each view to its own route (`/menu`, `/gallery`, …) would make the sitemap meaningful.

---

## 6. Structured Data / schema.org (Roadmap)

There is **no JSON-LD structured data** in the codebase today. None of the following schema.org types are emitted:

- `Restaurant` (name, address, telephone, openingHours, servesCuisine, priceRange)
- `Menu` / `MenuItem` (for each dish)
- `Event` (for the upcoming events)
- `BreadcrumbList`
- `WebSite` + `SearchAction` (sitelinks search box)

### Roadmap implementation

Add a `<script type="application/ld+json">` block in `src/app/layout.tsx` (or per-view) using the `Restaurant` schema, sourced from `SiteSettings`. Example:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: settings.restaurantName,
      telephone: settings.phone,
      email: settings.email,
      address: { "@type": "PostalAddress", streetAddress: settings.address },
      servesCuisine: ["Indian", "Chinese", "Continental"],
      priceRange: "$$$$",
      openingHours: ["Mo-Th 11:00-23:00", "Fr-Sa 10:00-00:30"],
    }),
  }}
/>
```

This would meaningfully improve rich-result eligibility in Google Search.

---

## 7. Image Alt Text

Every `<img>` in the codebase carries an `alt` attribute. The pattern (enforced by lint + review) is:

```tsx
<img
  src={url}
  alt={dish.name /* descriptive: the dish name */}
  loading="lazy"
  decoding="async"
  className="h-full w-full object-cover"
/>
```

### Conventions

| Image type           | `alt` value                                          | Example                                   |
| -------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Content images       | The entity's name/title                              | `alt={dish.name}`, `alt={testimonial.name}` |
| Decorative images    | `alt=""` (empty — screen readers skip)              | backgrounds, ambient orbs                 |
| Hero video poster    | `alt=""` (the video is decorative)                  | the `<video>` itself has `aria-hidden`    |
| Gallery thumbnails   | The gallery image's `title`                          | `alt={image.title}`                       |

### Audit

To audit the codebase for missing alts:

```bash
rg '<img(?![^>]*\balt=)' src/ --type tsx
```

This should return zero results (decorative images use `alt=""`).

---

## 8. Semantic HTML

The codebase uses semantic HTML5 elements throughout:

| Element     | Where                                                            |
| ----------- | ---------------------------------------------------------------- |
| `<header>`  | Admin topbar (`AdminApp.tsx`)                                    |
| `<main>`    | Admin content area (`AdminApp.tsx`)                              |
| `<nav>`     | Admin sidebar (`SidebarContent`), site `PillNav`                 |
| `<section>` | Every major block in every site view                             |
| `<article>` | Menu items (`MenuView`), testimonials, gallery tiles             |
| `<aside>`   | Admin desktop sidebar                                            |
| `<footer>`  | `Footer.tsx`, admin sidebar footer                               |
| `<form>`    | Login, reservation wizard, contact, admin modals                 |
| `<figure>` / `<figcaption>` | (Not widely used — gallery uses `<article>` instead) |

### Heading hierarchy

- **`<h1>`** — used once per view, in the cinematic header (e.g. `"The Menu"`, `"The Gallery"`, `"Reserve Your Evening"`). Wrapped in `<RevealText as="h1">` or `<DisplayHeading as="h1">`.
- **`<h2>`** — section sub-headings (`SectionHeading` defaults to `as="h2"`).
- **`<h3>`** — card titles, list item titles.
- **`<h4>`–`<h6>`** — rarely used; admin uses `<h2>` for the section title in the topbar.

> **Note:** Because the public site is a single-page app, multiple "views" coexist in the DOM only one at a time (the parent `Page` component renders `{displayedView === "home" && <Home />}`). So only one `<h1>` is present at any moment — this is correct.

---

## 9. Performance Budget (SEO Adjacent)

Core Web Vitals directly affect ranking. Black Orchid targets **Lighthouse 90+** on all four categories (Performance, Accessibility, Best Practices, SEO).

| Signal                         | Strategy                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| LCP (hero video)               | `<video preload="auto" poster={...}>` — the poster is a WebP, not the video itself |
| Image weight                   | 44 WebP files compressed with Sharp (max 1200px, quality 78) — see [IMAGE_STORAGE.md](./IMAGE_STORAGE.md) |
| Lazy loading                   | `loading="lazy"` + `decoding="async"` on every `<img>` below the fold |
| Font loading                   | `next/font` self-hosted + preloaded — no CDN font requests        |
| JS bundle                      | `output: "standalone"` build, code-split per admin/site boundary  |
| Smooth scroll (Lenis)          | Disabled when `prefers-reduced-motion: reduce`                    |

See [PERFORMANCE.md](./PERFORMANCE.md) for the full performance audit.

---

## 10. SEO Checklist (Current State)

| Item                                  | Status      | Notes                                            |
| ------------------------------------- | ----------- | ------------------------------------------------ |
| `<title>` tag                         | ✅ Done     | Static in `layout.tsx`                           |
| Meta description                      | ✅ Done     | Static in `layout.tsx`                           |
| Meta keywords                         | ✅ Done     | (low SEO weight, but present)                    |
| Open Graph tags                       | ⚠️ Partial | `title`/`description` set; **no `og:image`**    |
| Twitter card                          | ⚠️ Partial | `summary_large_image` set; **no `twitter:image`** |
| `robots.txt`                          | ✅ Done     | `public/robots.txt`                              |
| `sitemap.xml`                         | ❌ Missing  | Roadmap — see §5                                 |
| Canonical URL                         | ❌ Missing  | Roadmap — see §4                                 |
| JSON-LD structured data               | ❌ Missing  | Roadmap — see §6                                 |
| `lang` attribute                      | ✅ Done     | `<html lang="en">`                               |
| Semantic HTML                         | ✅ Done     | `<header>`, `<main>`, `<nav>`, `<section>`, …    |
| Heading hierarchy (single `<h1>`)     | ✅ Done     | One per view                                     |
| Image `alt` text                      | ✅ Done     | All `<img>` tags; decorative uses `alt=""`       |
| Font preloading                       | ✅ Done     | `next/font/google` (Playfair, Cormorant, Geist)  |
| Mobile responsive                     | ✅ Done     | Tailwind responsive prefixes throughout          |
| HTTPS-ready                           | ✅ Done     | Reverse proxy (Caddy) handles TLS termination    |

---

## 11. Related Documentation

- [PERFORMANCE.md](./PERFORMANCE.md) — Lighthouse targets, image compression, bundle analysis
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — ARIA, keyboard, screen-reader support
- [IMAGE_STORAGE.md](./IMAGE_STORAGE.md) — WebP compression, alt conventions
- [ROUTING.md](./ROUTING.md) — Why the public site is single-route + hash navigation
