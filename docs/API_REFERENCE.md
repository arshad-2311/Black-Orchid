# API Reference

Every route is a Next.js 16 App Router Route Handler under `src/app/api/`. All responses are JSON. Protected routes call `requireAdmin(req)` from `src/lib/auth.ts`, which inspects either the `Authorization: Bearer <token>` header or the `bo_admin_token` httpOnly cookie and returns the JWT payload (or `null`).

## Conventions

- **Auth**
  - 🌐 **Public** — no auth required
  - 🔒 **Admin** — `requireAdmin(req)` must return a non-null payload, else `401 { error: "Unauthorized" }`
- **Content-Type:** `application/json` for all bodies except `/api/upload` (multipart/form-data)
- **Errors:** `{ "error": "human-readable message" }` with appropriate HTTP status
- **Success:** the resource itself, or `{ ok: true }` for delete operations
- **IDs:** Prisma `cuid()` strings (24 chars, e.g. `clxxxxxxxxxxxxxxxxxxxxx`)

---

## Menu

### `GET /api/menu` 🌐

List all menu categories with their items, ordered by `order` asc. Parses the JSON-string fields (`images`, `ingredients`, `allergens`) into arrays before returning. The legacy `image` field is merged into the front of the `images` array if not already present.

**Response 200**
```json
[
  {
    "id": "cli...",
    "name": "Starters",
    "slug": "starters",
    "order": 0,
    "items": [
      {
        "id": "cli...",
        "name": "Truffle Arancini",
        "tagline": "A golden, truffle-laced beginning",
        "description": "...",
        "shortDescription": "Crispy saffron risotto, black truffle, parmesan",
        "price": 18,
        "image": "/img/05d707105d1a.webp",
        "images": ["/img/05d707105d1a.webp", "/img/c6769ef4861c.webp", "/img/ba5e7246e599.webp"],
        "categoryId": "cli...",
        "available": true,
        "veg": true,
        "spice": 0,
        "featured": true,
        "chefRecommended": true,
        "ingredients": ["Carnaroli risotto rice", "Saffron", ...],
        "allergens": ["Gluten", "Dairy", "Egg"],
        "servingSize": "4 pieces",
        "order": 0
      }
    ]
  }
]
```

### `POST /api/menu` 🔒

Creates either a **category** or a **menu item**, distinguished by `body._type`.

**Request body — category**
```json
{ "_type": "category", "name": "Starters", "slug": "starters", "order": 0 }
```
If `slug` is omitted, it's derived from `name` via `name.toLowerCase().replace(/\s+/g, "-")`.

**Request body — menu item**
```json
{
  "name": "Truffle Arancini",
  "tagline": "...",
  "description": "...",
  "shortDescription": "...",
  "price": 18,
  "image": "/img/...",         // legacy single-image field
  "images": ["/img/...", "/img/..."],  // preferred: array
  "categoryId": "cli...",
  "available": true,
  "veg": true,
  "spice": 0,
  "featured": true,
  "chefRecommended": true,
  "ingredients": ["..."],
  "allergens": ["..."],
  "servingSize": "4 pieces",
  "order": 0
}
```

The route serializes `images`, `ingredients`, and `allergens` to JSON strings before persisting (because Prisma SQLite doesn't support native arrays). `image` is set to `body.image || images[0] || null`.

**Response 201** — the created category or parsed menu item.

---

### `PATCH /api/menu/[id]` 🔒

Updates a menu item. Only fields in the allowlist are persisted:
`name, tagline, description, shortDescription, price, image, categoryId, available, veg, spice, featured, chefRecommended, servingSize, order, images, ingredients, allergens`.

`price` and `spice` are coerced to `Number`. `images`/`ingredients`/`allergens` are JSON-serialized; if `images` is provided, `image` is also updated to `images[0]` (or kept as-is if empty).

**Request body** — any subset of the allowlist.

**Response 200** — the updated item (raw Prisma row, not parsed).

### `DELETE /api/menu/[id]` 🔒

Deletes a menu item by ID.

**Response 200** — `{ "ok": true }`

---

## Categories

> Note: there is no `POST /api/categories` route. Categories are created via `POST /api/menu` with `body._type === "category"`.

### `PATCH /api/categories/[id]` 🔒

Updates a menu category. If `slug` is provided, it's slugified via `String(slug).toLowerCase().replace(/\s+/g, "-")`.

**Request body**
```json
{ "name": "Starters", "slug": "starters", "order": 0 }
```

**Response 200** — the updated category.

### `DELETE /api/categories/[id]` 🔒

Deletes a category. The Prisma schema declares `onDelete: Cascade` on `MenuItem.category`, so all items in the category are deleted too.

**Response 200** — `{ "ok": true }`

---

## Gallery

### `GET /api/gallery` 🌐

Lists all gallery images ordered by `order` asc.

**Response 200**
```json
[
  { "id": "cli...", "title": "Velvet Lounge", "url": "/img/...", "caption": "...", "category": "Interior", "order": 0, "createdAt": "...", "updatedAt": "..." }
]
```

### `POST /api/gallery` 🔒

Creates a gallery image. The `url` is typically obtained from `POST /api/upload` first, then this endpoint records the metadata.

**Request body**
```json
{ "title": "Velvet Lounge", "url": "/uploads/1783576002865-ae5e6ef2fc0d.png", "caption": "...", "category": "Interior", "order": 0 }
```
- `title` defaults to `"Untitled"` if missing
- `category` defaults to `"Interior"`; one of `Food | Drinks | Interior | Events | Banquet`
- `caption` defaults to `null`
- `order` defaults to `0`

**Response 200** — the created image.

### `PATCH /api/gallery/[id]` 🔒

Updates any field on a gallery image. Body is spread directly into Prisma's `update` (no allowlist — keep payloads clean).

**Response 200** — the updated image.

### `DELETE /api/gallery/[id]` 🔒

**Response 200** — `{ "ok": true }`

---

## Testimonials

### `GET /api/testimonials` 🌐

**Query params:**
- `featured=1` — return only `featured: true` testimonials (used by the Home page)

**Response 200** — array of testimonials ordered by `order` asc.

### `POST /api/testimonials` 🔒

**Request body**
```json
{ "name": "Eleanor Whitmore", "role": "Food Critic", "photo": "/img/...", "rating": 5, "message": "...", "featured": true, "order": 0 }
```
- `role`, `photo` default to `null`
- `rating` defaults to `5` (coerced via `Number(body.rating) || 5`)
- `featured` defaults to `false`
- `order` defaults to `0`

**Response 200** — the created testimonial.

### `PATCH /api/testimonials/[id]` 🔒

Updates any field. `rating` is coerced to `Number`.

### `DELETE /api/testimonials/[id]` 🔒

**Response 200** — `{ "ok": true }`

---

## Events

### `GET /api/events` 🌐

Returns only **published** events (`published: true`), ordered by `date` asc. Unpublished events are invisible to the public site (admin sees them via the Events section's local state, which fetches the same endpoint and filters client-side for the toggle).

> Note: the public GET filters by `published: true`. To list all events including unpublished, an admin-only list endpoint would be needed — currently the admin UI relies on the same public endpoint.

### `POST /api/events` 🔒

**Request body**
```json
{ "title": "Truffle & Wine Gala", "description": "...", "date": "2025-03-22", "image": "/img/...", "published": true }
```
- `description` defaults to `""`
- `image` defaults to `null`
- `published` defaults to `true`

**Response 200** — the created event.

### `PATCH /api/events/[id]` 🔒

Updates any field. Used by the admin's "publish/unpublish" toggle.

### `DELETE /api/events/[id]` 🔒

**Response 200** — `{ "ok": true }`

---

## Catering

### `GET /api/catering` 🌐

Lists all catering packages ordered by `order` asc.

**Response 200**
```json
[
  {
    "id": "cli...", "name": "Golden Gala", "description": "...",
    "price": 120, "image": "/img/...", "guests": "100–250 guests",
    "features": "7-course gourmet menu|Open premium bar|Live cooking stations|...",
    "order": 1, "createdAt": "...", "updatedAt": "..."
  }
]
```
`features` is a pipe-separated string (`|`). The client splits it into a list for display.

### `POST /api/catering` 🔒

**Request body**
```json
{ "name": "Golden Gala", "description": "...", "price": 120, "image": "/img/...", "guests": "100–250 guests", "features": "7-course gourmet menu|Open premium bar|...", "order": 1 }
```
- `description` defaults to `""`
- `image` defaults to `null`
- `guests`, `features` default to `""`
- `order` defaults to `0`
- `price` is coerced via `Number(body.price)`

**Response 200** — the created package.

### `PATCH /api/catering/[id]` 🔒

Updates any field. `price` is coerced to `Number`.

### `DELETE /api/catering/[id]` 🔒

**Response 200** — `{ "ok": true }`

---

## Reservations

### `POST /api/reservations` 🌐

Public endpoint — creates a new reservation from the public reservation form.

**Request body**
```json
{
  "name": "Jane Doe",
  "phone": "+1 555 010 1234",
  "email": "jane@example.com",
  "date": "2025-04-15",
  "time": "19:30",
  "guests": 4,
  "special": "Anniversary — window table if possible"
}
```

**Validation:** `name`, `phone`, `email`, `date`, `time`, `guests` are all required. Returns `400 { error: "All required fields must be provided" }` if any is missing. `special` is optional.

**Behavior:** `status` is forced to `"PENDING"` (the client cannot set it).

**Response 201** — the created reservation.

**Errors:**
- `400` — missing required fields
- `500` — `{ "error": "Failed to create reservation" }` (caught exception)

### `GET /api/reservations` 🔒

Admin-only list of all reservations.

**Query params:**
- `status=PENDING|CONFIRMED|CANCELLED|COMPLETED` — filter by status. `status=ALL` (or omitted) returns all.

**Response 200** — array of reservations ordered by `createdAt` desc.

**Errors:** `401 { error: "Unauthorized" }`

### `PATCH /api/reservations/[id]` 🔒

Updates a reservation. Most commonly used to change `status` (PENDING → CONFIRMED → COMPLETED, or → CANCELLED). `guests` is coerced to `Number`.

**Response 200** — the updated reservation.

### `DELETE /api/reservations/[id]` 🔒

**Response 200** — `{ "ok": true }`

---

## Settings

### `GET /api/settings` 🌐

Returns the singleton `SiteSettings` row (`id: "singleton"`).

**Response 200**
```json
{
  "id": "singleton",
  "restaurantName": "Black Orchid",
  "tagline": "Fine Dining & Banquet",
  "heroTitle": "An Exquisite Symphony of Flavour",
  "heroSubtitle": "...",
  "aboutTitle": "A Legacy of Culinary Excellence",
  "aboutBody": "...",
  "phone": "+1 (555) 010-2024",
  "email": "reservations@blackorchid.com",
  "address": "128 Velvet Lane, Downtown District, Metropolis",
  "mapEmbed": null,
  "hoursWeekday": "11:00 AM – 11:00 PM",
  "hoursWeekend": "10:00 AM – 12:30 AM",
  "instagram": "https://instagram.com",
  "facebook": "https://facebook.com",
  "twitter": "https://twitter.com",
  "whatsapp": "+15550102024",
  "banquetCapacity": "Up to 300 guests",
  "banquetDesc": "...",
  "metaTitle": "Black Orchid — Fine Dining & Banquet",
  "metaDesc": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `PUT /api/settings` 🔒

Updates the singleton. Only fields in the allowlist are persisted:
`restaurantName, tagline, heroTitle, heroSubtitle, aboutTitle, aboutBody, phone, email, address, mapEmbed, hoursWeekday, hoursWeekend, instagram, facebook, twitter, whatsapp, banquetCapacity, banquetDesc, metaTitle, metaDesc`.

If the singleton row doesn't exist (rare — it's seeded), it's created on the fly. The endpoint returns the freshly-read row after the update.

**Request body** — any subset of the allowlist.

**Response 200** — the updated settings object.

---

## Stats (Admin Dashboard)

### `GET /api/stats` 🔒

Returns aggregate counts for the admin Overview dashboard.

**Response 200**
```json
{
  "totalReservations": 47,
  "todayReservations": 3,
  "pendingReservations": 5,
  "totalMenuItems": 24,
  "totalGallery": 16,
  "totalEvents": 4,
  "totalTestimonials": 6,
  "totalPackages": 3,
  "visitors": 12840,
  "recentReservations": [ /* Reservation[], latest 6 */ ],
  "weekly": [
    { "date": "2025-04-09", "count": 2 },
    { "date": "2025-04-10", "count": 5 },
    /* ...7 days total, oldest first */
  ]
}
```

Notes:
- `visitors` is a hardcoded placeholder (`12840`) — there is no analytics integration yet.
- `weekly` is built by issuing 7 sequential `db.reservation.count({ where: { date: <key> } })` calls — one per day for the last 7 days. (This is a known performance TODO; a `groupBy` would be more efficient.)
- `todayReservations` uses `new Date().toISOString().slice(0, 10)` as the date key, matching the `YYYY-MM-DD` format the reservation form submits.

---

## Admin Auth

### `POST /api/admin/login` 🌐

Public — verifies credentials and issues a JWT.

**Request body**
```json
{ "email": "admin@blackorchid.com", "password": "admin123" }
```

**Behavior:**
1. Lowercase + trim the email
2. Look up `AdminUser` by email
3. `verifyPassword(password, user.password)` — supports both bcrypt (`$2...` prefix) and legacy scrypt hashes
4. If valid, `signToken({ sub: user.id, email, role })` — HS256 JWT, 12h expiry
5. Set the `bo_admin_token` httpOnly cookie (`maxAge: 12h`, `sameSite: "lax"`, `path: "/"`)
6. Return the token + safe user fields

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "cli...", "email": "admin@blackorchid.com", "name": "Restaurant Administrator", "role": "ADMIN" }
}
```

**Errors:**
- `400` — `{ "error": "Email and password are required" }`
- `401` — `{ "error": "Invalid credentials" }` (user not found OR password mismatch — same message to prevent user enumeration)
- `500` — `{ "error": "Login failed" }` (caught exception)

### `POST /api/admin/logout` 🔒 (effectively public)

Clears the `bo_admin_token` cookie by setting `maxAge: 0`.

**Response 200** — `{ "ok": true }`

> Note: this route doesn't actually call `requireAdmin()` — anyone can hit it, but the only effect is clearing the caller's cookie. This is intentional (logout should work even if the token is expired).

### `POST /api/admin/change-password` 🔒

Changes the current admin's password.

**Request body**
```json
{ "currentPassword": "admin123", "newPassword": "newSecurePassword123" }
```

**Validation:**
- Both fields required → `400`
- `newPassword.length >= 8` → `400` if shorter
- `currentPassword !== newPassword` → `400` if same

**Behavior:**
1. `requireAdmin(req)` — must return non-null (else `401`)
2. Fetch `AdminUser` by `admin.sub` (the JWT subject) → `404` if not found
3. `verifyPassword(currentPassword, user.password)` → `403` if wrong
4. `hashPassword(newPassword)` — bcrypt with 12 rounds
5. Persist via `db.adminUser.update`

**Response 200** — `{ "ok": true }`

**Client behavior:** After a successful change, the admin UI calls `onSignOut()` to clear the session and force re-login with the new password. The old token remains technically valid until it expires (12h), so immediate re-login is the safer UX.

---

## Upload

### `POST /api/upload` 🔒

Uploads a single image file. Saves to `public/uploads/` with a `{timestamp}-{random-hex}.<ext>` filename.

**Request:** `multipart/form-data` with a single field `file` containing the image.

**Validation (client-side, in `ImageUploader`/`MultiImageUploader`):**
- File type must match `/image\/(jpeg|jpg|png|webp|gif|avif)/`
- File size ≤ 6 MB (`6 * 1024 * 1024` bytes)

**Response 200**
```json
{ "url": "/uploads/1783576002865-ae5e6ef2fc0d.png" }
```

The returned URL is a relative path (served from `public/`). It's stored directly in the DB (e.g. `MenuItem.image`, `GalleryImage.url`).

**Errors:**
- `401` — no/invalid admin token
- `400` — `{ "error": "No file provided" }` or `{ "error": "Invalid file type" }`
- `413` — file too large (server-side guard, if implemented)
- `500` — `{ "error": "Upload failed" }`

> **Note on storage:** Files live on the local filesystem under `public/uploads/`. There is **no cloud storage** integration (no S3, no Cloudinary). Uploaded files are served as static assets by Next.js. In a production deployment, this directory must be writable by the Node process and persisted across restarts (the `bun run build` script copies `public/` into `.next/standalone/`).

---

## Status Codes Summary

| Code | Meaning | Example routes |
|------|---------|-----------------|
| 200 | Success (default) | All GET, PATCH, PUT, DELETE |
| 201 | Created | `POST /api/reservations` |
| 400 | Bad request (validation) | `POST /api/admin/login` (missing fields), `POST /api/admin/change-password` (weak password) |
| 401 | Unauthorized (no/invalid token) | All 🔒 routes when `requireAdmin()` returns null |
| 403 | Forbidden (wrong current password) | `POST /api/admin/change-password` |
| 404 | Not found | `POST /api/admin/change-password` (user missing) |
| 500 | Server error | `POST /api/reservations` (caught), `POST /api/admin/login` (caught) |

---

## Rate Limiting

**None.** There is no rate limiter on any route. The login endpoint is the most exposed (public, accepts credentials). For production deployment behind a reverse proxy, add rate limiting at the gateway layer (e.g. Caddy's `rate_limit` directive) — see `Caddyfile`.

---

## CORS

All routes are same-origin (served from the same Next.js app at `/api/*`). No `Access-Control-Allow-Origin` headers are set. The frontend uses relative paths exclusively (`/api/menu`, not `http://localhost:3000/api/menu`), so CORS preflight is never triggered.

---

## Request/Response Examples by Component

| Component | Calls |
|----------|-------|
| `Home.tsx` | `GET /api/menu`, `GET /api/gallery`, `GET /api/testimonials?featured=1`, `GET /api/settings` |
| `MenuView.tsx` | `GET /api/menu` |
| `GalleryView.tsx` | `GET /api/gallery` |
| `ReservationView.tsx` | `POST /api/reservations` |
| `AdminApp.LoginScreen` | `POST /api/admin/login` |
| `AdminApp.ChangePasswordModal` | `POST /api/admin/change-password` |
| `AdminOverview` | `GET /api/stats`, `GET /api/menu` |
| `AdminReservations` | `GET /api/reservations?status=...`, `PATCH /api/reservations/:id`, `DELETE /api/reservations/:id` |
| `AdminMenu` | `GET /api/menu`, `POST /api/menu` (item + category), `PATCH /api/menu/:id`, `DELETE /api/menu/:id`, `PATCH /api/categories/:id`, `DELETE /api/categories/:id` |
| `AdminGallery` | `GET /api/gallery`, `POST /api/gallery`, `PATCH /api/gallery/:id`, `DELETE /api/gallery/:id` |
| `AdminTestimonials` | `GET /api/testimonials`, `POST /api/testimonials`, `PATCH /api/testimonials/:id`, `DELETE /api/testimonials/:id` |
| `AdminEvents` | `GET /api/events`, `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id` |
| `AdminCatering` | `GET /api/catering`, `POST /api/catering`, `PATCH /api/catering/:id`, `DELETE /api/catering/:id` |
| `AdminSettings` | `GET /api/settings`, `PUT /api/settings` |
| `ImageUploader` / `MultiImageUploader` | `POST /api/upload` |
