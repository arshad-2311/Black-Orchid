# Business Rules — Black Orchid

Authoritative documentation of all business logic enforced by the codebase.
Each rule references the file(s) that implement it.

> Schema source of truth: `prisma/schema.prisma`
> API source of truth: `src/app/api/**`
> Auth helpers: `src/lib/auth.ts`

---

## Table of Contents

1. [Reservations](#1-reservations)
2. [Menu](#2-menu)
3. [Gallery](#3-gallery)
4. [Testimonials](#4-testimonials)
5. [Events](#5-events)
6. [Catering](#6-catering)
7. [Site Settings (Singleton)](#7-site-settings-singleton)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Image Upload](#9-image-upload)
10. [Cross-Cutting Rules](#10-cross-cutting-rules)

---

## 1. Reservations

### 1.1 Default Status

**Rule:** Every new reservation is created with `status: "PENDING"`.

**Where enforced:**
- `prisma/schema.prisma` — `status String @default("PENDING")`
- `src/app/api/reservations/route.ts` — `POST` explicitly sets `status: "PENDING"` (does
  not trust client input for this field).
- `src/components/site/ReservationView.tsx` — never sends `status` in the POST body.

**Public user cannot override this.** The status field is server-controlled.

### 1.2 Status Lifecycle

Four statuses, with admin-only transitions:

```
                      admin confirms
   PENDING ─────────────────────────────► CONFIRMED
      │                                       │
      │ admin cancels                         │ admin marks completed
      ▼                                       ▼
  CANCELLED                               COMPLETED
      │                                       │
      └────── (terminal)                      └────── (terminal)
```

| Transition                | Trigger                                | API                                       |
| ------------------------- | -------------------------------------- | ----------------------------------------- |
| PENDING → CONFIRMED       | Admin clicks ✓ in table or detail modal | `PATCH /api/reservations/:id {status:"CONFIRMED"}` |
| PENDING → CANCELLED       | Admin clicks Ban                       | `PATCH /api/reservations/:id {status:"CANCELLED"}` |
| CONFIRMED → COMPLETED     | Admin clicks ✓✓                        | `PATCH /api/reservations/:id {status:"COMPLETED"}` |
| CONFIRMED → CANCELLED     | Admin clicks Ban                       | `PATCH /api/reservations/:id {status:"CANCELLED"}` |
| Any → (deleted)           | Admin clicks Trash (with confirm)      | `DELETE /api/reservations/:id`            |

**UI conditional rendering** (`AdminReservations.tsx`):
- `r.status === "PENDING"` → shows Confirm (✓) + Cancel (Ban) actions.
- `r.status === "CONFIRMED"` → shows Complete (✓✓) + Cancel (Ban) actions.
- `r.status === "CANCELLED"` or `"COMPLETED"` → no inline status actions (terminal).
- Detail modal always shows all four buttons regardless of current status (admin can
  correct a misclick).

### 1.3 Status Badge Colors

Defined in `src/components/admin/ui.tsx` → `StatusBadge`:

| Status     | Border                | Background             | Text             |
| ---------- | --------------------- | ---------------------- | ---------------- |
| PENDING    | `amber-500/30`        | `amber-500/10`         | `amber-400`      |
| CONFIRMED  | `emerald-500/30`      | `emerald-500/10`       | `emerald-400`    |
| CANCELLED  | `red-500/30`          | `red-500/10`           | `red-400`        |
| COMPLETED  | `sky-400/30`          | `sky-400/10`           | `sky-300`        |

Each badge includes a small `bg-current` dot.

### 1.4 Date Validation

**Rule:** Reservation date must be today or in the future.

**Where enforced:**
- `src/components/site/ReservationView.tsx` → `StepDate` component:
  ```ts
  const today = new Date().toISOString().slice(0, 10);
  // ...
  <input type="date" min={today} value={form.date} ... />
  ```
- HTML5 `min` attribute prevents selecting past dates in the browser picker.
- Client-side validation in `validateStep(0)` requires `form.date` to be non-empty.

**Server-side:** The API does not re-validate the date — it trusts the client `min`
constraint. (Documented limitation; future enhancement.)

### 1.5 Guest Count

**Rule:** Guests must be between 1 and 20 inclusive.

**Where enforced:**
- `src/components/site/ReservationView.tsx`:
  ```ts
  const MAX_GUESTS = 20;
  const GUEST_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8+"] as const;
  ```
- `GuestStepper` clamps via `Math.max(1, Math.min(MAX_GUESTS, Number(value) || 1))`.
- "+" and "−" buttons disabled at boundaries (`disabled={n >= MAX_GUESTS}` /
  `disabled={n <= 1}`).
- Quick-select pills: clicking "8+" sets value to `"8"` (the stepper can then go higher).
- Default value: `"2"` (set in `EMPTY_FORM`).

**Server-side:** `Number(guests)` is stored as `Int` — no min/max check on the server.

### 1.6 Time Slots

**Rule:** Time slots are split into Lunch and Dinner service windows.

**Where enforced:** `src/components/site/ReservationView.tsx`:

```ts
const LUNCH_TIMES = [
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
];
const DINNER_TIMES = [
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
];
```

Lunch covers 11:00 AM – 2:30 PM (8 slots).
Dinner covers 6:00 PM – 9:30 PM (8 slots).

The `StepTime` component renders two `TimeGroup`s; selecting any slot from either group
sets `form.time`.

### 1.7 Required Fields (Server)

`POST /api/reservations` requires (returns `400` if any missing):
- `name`, `phone`, `email`, `date`, `time`, `guests`

Optional:
- `special` (special requests textarea — stored as `String?`)

### 1.8 Admin Listing

- `GET /api/reservations` (admin-only) returns all reservations, ordered by
  `createdAt desc`.
- Optional `?status=PENDING|CONFIRMED|CANCELLED|COMPLETED` filter; `?status=ALL` (or
  omitted) returns all.

---

## 2. Menu

### 2.1 Category Relation (Cascade Delete)

**Rule:** A menu item MUST belong to a category. Deleting a category deletes all its items.

**Where enforced:** `prisma/schema.prisma`:

```prisma
model MenuItem {
  // ...
  categoryId String
  category   MenuCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  // ...
}
```

**Implications:**
- Cannot create a menu item without a valid `categoryId`. The POST handler validates
  this implicitly via `category: { connect: { id: body.categoryId } }` (Prisma throws if
  the ID doesn't exist).
- `DELETE /api/categories/:id` cascades — all items with that `categoryId` are removed
  automatically by the database.
- This is **destructive and irreversible**. The admin UI uses a `confirm` dialog on the
  delete button to guard against accidental loss.

### 2.2 Item Fields

| Field              | Type      | Default        | Purpose                                                  |
| ------------------ | --------- | -------------- | -------------------------------------------------------- |
| `name`             | String    | —              | Display name                                             |
| `tagline`          | String?   | null           | Short marketing tagline                                  |
| `description`      | String    | ""             | Full description                                         |
| `shortDescription` | String?   | null           | Card hover reveal text                                   |
| `price`            | Float     | —              | Price in dollars (e.g. `42.00`)                          |
| `image`            | String?   | null           | Legacy single-image field (kept for backward compat)     |
| `images`           | String    | "[]"           | JSON array of URLs; **first image is the cover**          |
| `categoryId`       | String    | —              | FK to MenuCategory (required)                            |
| `available`        | Boolean   | true           | If false → "Sold Out" badge in UI                        |
| `veg`              | Boolean   | false          | VegBadge: green if true, red if false                    |
| `spice`            | Int       | 0              | 0-3 spice level (rendered as ● ● ● dots)                 |
| `featured`         | Boolean   | false          | If true → appears on homepage SignatureDishes section    |
| `chefRecommended`  | Boolean   | false          | If true → "Chef's Pick" gold badge in DishShowcase       |
| `ingredients`      | String    | "[]"           | JSON array of strings (chips in DishShowcase)            |
| `allergens`        | String    | "[]"           | JSON array of strings (chips with AlertTriangle icon)    |
| `servingSize`      | String?   | null           | Free text (e.g. "Serves 2")                              |
| `order`            | Int       | 0              | Manual sort within category (ascending)                  |

### 2.3 Images Storage

**Rule:** Multiple images per dish are stored as a JSON-encoded string in the `images`
field. The first image is the cover.

**Where enforced:**
- `prisma/schema.prisma` — `images String @default("[]")` (SQLite doesn't support arrays).
- `src/app/api/menu/route.ts` — `POST` and `PATCH` serialize via `JSON.stringify(images)`.
- `parseItem()` in the same file deserializes back to an array on read, and merges the
  legacy `image` field as the first entry if it's not already present:
  ```ts
  if (raw.image && !images.includes(raw.image)) images = [raw.image, ...images];
  ```

**Cover selection:** `DishShowcase` uses `images[0]` as the initial active image, and
falls back to `[dish.image]` if `images` is empty.

### 2.4 Featured Items on Homepage

**Rule:** Only items with `featured: true` appear in the homepage "Signature Selections"
section. If fewer than 4 featured items exist, the section falls back to the first 4
items across all categories.

**Where enforced:** `src/components/site/Home.tsx`:

```ts
const featuredItems = useMemo(
  () => categories.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 4),
  [categories]
);
// In SignatureDishes:
const display = items.length > 0 ? items : categories.flatMap((c) => c.items).slice(0, 4);
```

### 2.5 Veg & Spice Badges

- **VegBadge** (`src/components/site/primitives.tsx`):
  - `veg: true` → green border + green dot (`border-emerald-500/70`, `bg-emerald-500`).
  - `veg: false` → red border + red dot (`border-red-500/70`, `bg-red-500`).
  - 16×16px square with 3px radius, dotted indicator inside.
- **SpiceLevel** (`src/components/site/primitives.tsx`):
  - Renders `level` count of `●` characters in `text-orange-400/90`.
  - If `level === 0`, returns `null` (no badge).
  - `title` attribute: `Spice level ${level}` for accessibility.

### 2.6 Chef's Pick & Sold Out

In `DishShowcase` image overlay:
- `chefRecommended: true` → gold-gradient pill "Chef's Pick" with `Award` icon.
- `available: false` → red pill "Sold Out" (`bg-red-500/90`).

### 2.7 Category Sort

- `MenuCategory` has an `order Int @default(0)` field.
- `GET /api/menu` returns categories ordered by `order asc`, then items within each
  category by `order asc`.

---

## 3. Gallery

### 3.1 Categories

**Rule:** Gallery images are categorized into exactly 5 categories.

**Categories:** `Food`, `Drinks`, `Interior`, `Events`, `Banquet`.

**Where enforced:**
- `prisma/schema.prisma` → `category String @default("Interior")` with inline comment.
- `src/components/site/GalleryView.tsx`:
  ```ts
  const CATEGORIES = ["All", "Food", "Drinks", "Interior", "Events", "Banquet"];
  ```

The "All" filter is a UI-only concept (not a stored value).

### 3.2 Manual Sort Order

**Rule:** Each gallery image has an `order` field for manual sorting.

**Where enforced:** `prisma/schema.prisma` → `order Int @default(0)`.

The public `GET /api/gallery` does NOT currently sort by `order` — it returns in
`createdAt` order. (Admin UI uses drag-order to set `order`; sorting on the public side
is a documented gap.)

### 3.3 Required Fields

| Field      | Type    | Default     | Notes                              |
| ---------- | ------- | ----------- | ---------------------------------- |
| `title`    | String  | —           | Display title (shown on hover)     |
| `url`      | String  | —           | Image URL (from `/api/upload`)     |
| `caption`  | String? | null        | Italic caption in lightbox         |
| `category` | String  | "Interior"  | One of the 5 categories            |
| `order`    | Int     | 0           | Manual sort position               |

---

## 4. Testimonials

### 4.1 Featured Sorting

**Rule:** Testimonials with `featured: true` appear on the homepage carousel.
Within the carousel, featured testimonials display in their `order` (then `createdAt`).

**Where enforced:**
- `src/components/site/Home.tsx`:
  ```ts
  apiGet<Testimonial[]>("/api/testimonials?featured=1").then(setTestimonials)
  ```
- `src/app/api/testimonials/route.ts` — `GET` accepts `?featured=1` and filters
  `where: { featured: true }` when present.

### 4.2 Rating

**Rule:** Rating is an integer 1-5.

**Where enforced:**
- `prisma/schema.prisma` → `rating Int @default(5)`.
- Admin form provides a star selector.
- The testimonial cinema on the homepage renders `rating` count of `Star` icons
  (`fill-gold text-gold`).

### 4.3 Carousel Behavior

- Auto-advances every 7 seconds: `setInterval(() => setIdx(i => (i+1) % list.length), 7000)`.
- Manual dots below the quote allow direct navigation.
- `AnimatePresence mode="wait"` for clean cross-fade between quotes.

### 4.4 Sort Order

- `order Int @default(0)` — manual sort in admin.
- `GET /api/testimonials` returns ordered by `order asc, createdAt desc`.

### 4.5 Fields

| Field      | Type    | Default | Notes                                |
| ---------- | ------- | ------- | ------------------------------------ |
| `name`     | String  | —       | Author name                          |
| `role`     | String? | null    | Subtitle (e.g. "Regular Diner")      |
| `photo`    | String? | null    | Avatar URL                           |
| `rating`   | Int     | 5       | 1-5 stars                            |
| `message`  | String  | —       | The quote                            |
| `featured` | Boolean | false   | Show on homepage                     |
| `order`    | Int     | 0       | Manual sort                          |

---

## 5. Events

### 5.1 Published Toggle

**Rule:** Only events with `published: true` are visible on the public site.

**Where enforced:**
- `prisma/schema.prisma` → `published Boolean @default(true)`.
- `src/app/api/events/route.ts` → `GET` filters `where: { published: true }`.

**Admin can see all events** (the admin list endpoint or filter is not implemented as a
separate route — admin fetches via the same `GET /api/events` which currently only
returns published ones; admins toggle the published state via PATCH).

> Note: This is a documented quirk. Admins can create events with `published: false`,
> and those events will not appear in the public list, but there is no admin-only "show
> unpublished" endpoint yet.

### 5.2 Fields

| Field         | Type    | Default | Notes                              |
| ------------- | ------- | ------- | ---------------------------------- |
| `title`       | String  | —       | Event title                        |
| `description` | String  | —       | Event description                  |
| `date`        | String  | —       | Event date (free-text, not Date)   |
| `image`       | String? | null    | Optional event image               |
| `published`   | Boolean | true    | Visibility toggle                  |

### 5.3 Sort

Public `GET /api/events` returns ordered by `date asc` (string sort).

---

## 6. Catering

### 6.1 Package Tiers

The UI implies a 3-tier system (Silver / Golden / Platinum) by rendering exactly 3 cards
in a grid and badging the middle one as "Most Popular". The schema does not enforce a
specific tier count — admins can create any number of packages.

### 6.2 Features Format

**Rule:** Catering package features are stored as a single pipe-separated string.

**Where enforced:**
- `prisma/schema.prisma` → `features String` (single string).
- `src/components/site/CateringView.tsx`:
  ```ts
  const features = p.features
    ? p.features.split("|").map((f) => f.trim()).filter(Boolean)
    : [];
  ```
- Admin form accepts the same pipe-separated format (or splits on newlines and joins).

**Example:** `"3-course menu | Welcome drinks | Live station | Dedicated server"` →
4 feature chips.

### 6.3 Per-Guest Pricing

**Rule:** `price` is a `Float` representing the per-guest cost.

**Where enforced:**
- `prisma/schema.prisma` → `price Float`.
- Displayed as `$${price} /guest` in the package card.

### 6.4 Fields

| Field         | Type    | Default | Notes                              |
| ------------- | ------- | ------- | ---------------------------------- |
| `name`        | String  | —       | Package name                       |
| `description` | String  | —       | Package description                |
| `price`       | Float   | —       | Per-guest price                    |
| `image`       | String? | null    | Optional package image             |
| `guests`      | String  | —       | Guest range (e.g. "Up to 50")      |
| `features`    | String  | —       | Pipe-separated feature list        |
| `order`       | Int     | 0       | Manual sort                        |

### 6.5 Sort

`GET /api/catering` returns ordered by `order asc`.

---

## 7. Site Settings (Singleton)

### 7.1 Singleton Pattern

**Rule:** There is exactly ONE `SiteSettings` row, with `id = "singleton"`.

**Where enforced:**
- `prisma/schema.prisma`:
  ```prisma
  model SiteSettings {
    id            String   @id @default("singleton")
    // ...
  }
  ```
- `src/app/api/settings/route.ts`:
  - `GET` → `db.siteSettings.findUnique({ where: { id: "singleton" } })`
  - `PUT` → checks if row exists; if not, creates with `id: "singleton"`, otherwise updates.

### 7.2 Admin-Only Edit

**Rule:** Only authenticated admins can edit settings.

**Where enforced:**
- `src/app/api/settings/route.ts` → `PUT` calls `requireAdmin(req)` and returns `401`
  if not authenticated.
- `GET` is public (no auth required) — needed to render the public site.
- Client-side: the admin Settings form sends `Authorization: Bearer <token>` via
  `apiPut` (`src/lib/api.ts` auto-injects the token from Zustand).

### 7.3 Allowed Fields (Allowlist)

`PUT /api/settings` only accepts these fields (others are silently dropped):

```
restaurantName, tagline, heroTitle, heroSubtitle,
aboutTitle, aboutBody,
phone, email, address, mapEmbed,
hoursWeekday, hoursWeekend,
instagram, facebook, twitter, whatsapp,
banquetCapacity, banquetDesc,
metaTitle, metaDesc
```

### 7.4 Single Source of Truth

**Rule:** All public site text content (hero title, about body, phone, hours, social
links, banquet capacity, SEO meta) comes from the singleton `SiteSettings` record.

**Where enforced:**
- `src/app/page.tsx` fetches settings server-side and passes them as props to the
  public site shell.
- `Home.tsx` consumes `settings.heroSubtitle`, `settings.aboutBody`,
  `settings.banquetCapacity`, `settings.banquetDesc`, `settings.phone`, `settings.address`.
- `ContactView.tsx` consumes `settings.address`, `settings.phone`, `settings.email`,
  `settings.hoursWeekday`, `settings.instagram/facebook/twitter`.
- `CateringView.tsx` consumes `settings.phone`.
- `Footer.tsx` consumes social links and contact info.

**Implication:** Updating a field in admin Settings instantly reflects across every
public view on next page load.

### 7.5 Default Values

The Prisma schema defines defaults for most fields (e.g.
`restaurantName @default("Black Orchid")`, `phone @default("+1 (555) 010-2024")`).
These defaults apply only on initial row creation (during seeding or first PUT).

---

## 8. Authentication & Authorization

### 8.1 Auth Stack

- **Password hashing:** bcrypt (12 rounds) — `src/lib/auth.ts` `hashPassword()`.
  - Backward compat: legacy scrypt hashes (`salt:hash` hex format) still verified via
    `verifyScryptLegacy()`.
- **Token:** JWT-style HS256 (header.payload.signature), 12-hour expiry.
  - Header: `{"alg":"HS256","typ":"JWT"}` base64url-encoded.
  - Payload: `{ sub, email, role, exp }`.
  - Signature: `HMAC-SHA256(SECRET, "header.payload")` base64url.
  - Verification uses `timingSafeEqual` to prevent timing attacks.
- **Secret:** `process.env.ADMIN_JWT_SECRET` (fallback: dev-only constant).

### 8.2 Token Transport

The client may send the token via either:
1. **Authorization header** (preferred): `Authorization: Bearer <token>`.
2. **Cookie** (fallback): `bo_admin_token` HTTP-only cookie set by the login endpoint.

`getTokenFromRequest(req)` checks header first, then cookie.

### 8.3 Client-Side Token Storage

- `bo_admin_token` in `localStorage` (Zustand `useApp.adminToken`).
- `bo_admin_user` in `localStorage` (JSON: `{ name, email, role }`).

On mount, `hydrateAdmin()` reads these and hydrates Zustand state.

### 8.4 requireAdmin() Pattern

**Rule:** Every write endpoint (POST/PATCH/PUT/DELETE) calls `requireAdmin(req)` and
returns `401 Unauthorized` if the token is missing or invalid.

**Where enforced:** All admin route handlers, e.g.:

```ts
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... proceed with mutation
}
```

`requireAdmin()` returns the decoded `TokenPayload` (or `null`), so handlers can also
access `admin.sub`, `admin.email`, `admin.role` for auditing if needed.

### 8.5 Public vs Authenticated Endpoints

| Endpoint                       | Public GET | Public POST | Admin-only |
| ------------------------------ | :--------: | :---------: | :--------: |
| `/api/reservations`            | ❌         | ✅          | GET (list) |
| `/api/reservations/:id`        | ❌         | ❌          | PATCH/DELETE |
| `/api/menu`                    | ✅         | ❌          | POST       |
| `/api/menu/:id`                | ❌         | ❌          | PATCH/DELETE |
| `/api/categories`, `/:id`      | (via menu) | ❌          | POST/PATCH/DELETE |
| `/api/gallery`, `/:id`         | ✅         | ❌          | POST/PATCH/DELETE |
| `/api/testimonials`, `/:id`    | ✅         | ❌          | POST/PATCH/DELETE |
| `/api/events`, `/:id`          | ✅ (published only) | ❌ | POST/PATCH/DELETE |
| `/api/catering`, `/:id`        | ✅         | ❌          | POST/PATCH/DELETE |
| `/api/settings`                | ✅         | —           | PUT        |
| `/api/upload`                  | ❌         | ❌          | POST       |
| `/api/stats`                   | ❌         | ❌          | GET        |
| `/api/admin/login`             | —          | ✅ (public) | —          |
| `/api/admin/logout`            | —          | —           | POST       |
| `/api/admin/change-password`   | ❌         | ❌          | POST       |

**Public users can only:**
1. View all public content (menu, gallery, published events, catering, testimonials, settings).
2. Create a reservation (`POST /api/reservations`).
3. Login as admin (if they have credentials).

**Public users CANNOT:**
- Create/edit/delete any content other than reservations.
- Upload images.
- View unpublished events.
- List reservations (even their own — there's no "my reservations" feature).

### 8.6 Change Password

**Rule:** Admin can change their own password. The current password must be verified.
New password must be ≥ 8 chars, different from current, and match the confirmation.

**Where enforced:** `src/app/api/admin/change-password/route.ts`:
- Verifies `currentPassword` against stored hash.
- Validates `newPassword` length and inequality.
- Hashes new password with bcrypt.
- Updates the DB row.
- The client (`ChangePasswordModal`) signs the user out after success, forcing re-login.

### 8.7 Default Admin

Seeded via `prisma/seed.ts`:
- Email: `admin@blackorchid.com`
- Password: `admin123`
- Role: `ADMIN`

**These are demo credentials** and should be rotated in production.

---

## 9. Image Upload

### 9.1 Storage Location

**Rule:** Uploaded images are saved to `public/uploads/` on disk. The database stores
only the URL string (e.g. `/uploads/1783576002865-ae5e6ef2fc0d.png`), never Base64.

**Where enforced:** `src/app/api/upload/route.ts`:
```ts
const uploadDir = path.join(process.cwd(), "public", "uploads");
// ...
const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
const filePath = path.join(uploadDir, name);
await writeFile(filePath, Buffer.from(bytes));
return NextResponse.json({ url: `/uploads/${name}`, name, size: file.size });
```

### 9.2 Validation

- **Allowed types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`,
  `image/gif`, `image/avif`.
- **Max size:** 6 MB (`6 * 1024 * 1024`).
- **Empty files** rejected.
- **Filename:** `<timestamp>-<6-byte-hex>.<ext>` — collision-resistant.

### 9.3 Auth Required

`POST /api/upload` requires admin authentication. Public users cannot upload.

### 9.4 Client Upload Flow

`apiUpload(file)` (`src/lib/api.ts`):
1. Wraps `File` in `FormData` under key `"file"`.
2. POSTs to `/api/upload` with `Authorization` header (no `Content-Type` — browser sets
   the multipart boundary).
3. Returns the `url` string from the response.

The `ImageUploader` component (`src/components/admin/ui.tsx`) handles:
- Drag-and-drop + click-to-browse.
- Progress bar (0 → 100%).
- Preview with Replace/Remove buttons.
- "Paste URL" mode for external images (skips upload).

---

## 10. Cross-Cutting Rules

### 10.1 No Soft Deletes

The schema has no `deletedAt` field on any model. Deletes are hard deletes — the row is
removed from the database immediately.

### 10.2 Timestamps

Every model has `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
These are server-managed; clients cannot set them.

### 10.3 ID Format

All models use `@id @default(cuid())` except `SiteSettings` (which uses
`@default("singleton")`). CUIDs are URL-safe and sort-lexicographically by creation time.

### 10.4 JSON-in-String Fields (SQLite Workaround)

SQLite does not support array columns. Three fields use a JSON-encoded string instead:

| Model      | Field         | Stored As                |
| ---------- | ------------- | ------------------------ |
| MenuItem   | `images`      | `JSON.stringify(string[])` |
| MenuItem   | `ingredients` | `JSON.stringify(string[])` |
| MenuItem   | `allergens`   | `JSON.stringify(string[])` |

The API layer is responsible for serialization (on write) and deserialization (on read,
via `parseItem()`). Client code always sees real arrays.

### 10.5 Sort Order Conventions

- **Menu categories:** `order asc`.
- **Menu items within a category:** `order asc`.
- **Gallery images:** returned in `createdAt` order (UI sort by `order` is a gap).
- **Testimonials:** `order asc, createdAt desc`.
- **Events (public):** `date asc`, only `published: true`.
- **Catering packages:** `order asc`.
- **Reservations (admin):** `createdAt desc` by default; admin can sort by `date`,
  `guests`, `status`, `createdAt` in either direction.

### 10.6 Toast Feedback

Every admin mutation triggers a toast:
- Success: `toast.success("... marked CONFIRMED")` etc.
- Error: `toast.error("Update failed")` etc.

This is a UX rule, not a server rule — the server returns JSON; the client interprets
status codes and shows the toast.

### 10.7 Confirmation Dialogs

Destructive actions (delete reservation, delete menu item, delete category with cascade,
bulk delete) use `window.confirm()` via the `AdminButton` `confirm` prop:

```tsx
<AdminButton variant="danger"
  confirm="Delete this reservation permanently? This cannot be undone."
  onConfirm={() => remove(detail.id)}>
  Delete
</AdminButton>
```

The button intercepts the click, shows the browser confirm dialog, and only fires
`onConfirm` if the user clicks OK.

### 10.8 Reservation Hold Time

**Documented in UI only** (not enforced by backend):

> "Your table is held for 15 minutes past the reservation time."
> — `ReservationView.tsx`, step 4 helper text.

This is informational; there is no server-side enforcement or auto-cancellation.

### 10.9 No Public User Accounts

There is no public user model. Public users do not register, log in, or have accounts.
They can:
- Browse all public content.
- Submit a reservation (one-off form submission).
- Submit the contact form (simulated, no persistence).

All authenticated actions are admin-only.

### 10.10 Admin Role Field (Unused but Reserved)

`AdminUser.role` defaults to `"ADMIN"` and supports `ADMIN | MANAGER | EDITOR` per the
schema comment. However, the current codebase does not enforce role-based permissions —
any authenticated admin can perform any action. The role field is reserved for future
granular permissions.
