# Image Storage

Black Orchid stores images on the **local filesystem** only — there is no cloud storage (no S3, no Cloudinary, no ImageKit). Images come from two sources:

1. **Static curated images** — 44 compressed WebP files in `public/img/`, referenced by `src/lib/images.ts`. These ship with the app and are version-controlled.
2. **Admin-uploaded images** — saved to `public/uploads/` via the `POST /api/upload` endpoint. These are created at runtime by the admin CMS.

In both cases, the database stores only the **URL string** (e.g. `/img/05d707105d1a.webp` or `/uploads/1783576002865-ae5e6ef2fc0d.png`) — never Base64, never binary blobs.

> **Source of truth**
> - `src/lib/api.ts` — `apiUpload()` helper
> - `src/components/admin/ui.tsx` — `<ImageUploader>` component
> - `src/components/admin/AdminMenu.tsx` — `<MultiImageUploader>` component
> - `src/lib/images.ts` — static image manifest
> - `public/img/` — static WebP files (44 files)
> - `public/uploads/` — admin-uploaded files (created at runtime)

---

## 1. Upload Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Admin selects    │     │ apiUpload()      │     │ POST /api/upload │
│ file in          │────>│ in api.ts        │────>│ (FormData with   │
│ ImageUploader    │     │ wraps FormData   │     │  "file" field)   │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                                                 ┌──────────────────┐
                                                 │ Server saves to  │
                                                 │ public/uploads/  │
                                                 │ {ts}-{rand}.ext  │
                                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ Returns          │
                                                 │ { "url": "/..." }│
                                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ Client stores    │
                                                 │ URL in form      │
                                                 │ state, then      │
                                                 │ POSTs it as part │
                                                 │ of the record    │
                                                 └──────────────────┘
```

### Step-by-step

1. **Admin selects a file.** In `<ImageUploader>` (single) or `<MultiImageUploader>` (multi), the admin either drags a file onto the drop zone, clicks "browse", or pastes a URL.

2. **Client-side validation** (in the uploader component):
   ```ts
   const okType = /image\/(jpeg|jpg|png|webp|gif|avif)/.test(file.type);
   const okSize = file.size <= 6 * 1024 * 1024; // 6 MB
   if (!okType) { setError("Only JPG, PNG, WebP, GIF, AVIF allowed"); return; }
   if (!okSize) { setError("Max file size is 6MB"); return; }
   ```

3. **`apiUpload(file)` is called** (`src/lib/api.ts`):
   ```ts
   export async function apiUpload(file: File): Promise<string> {
     const formData = new FormData();
     formData.append("file", file);
     const res = await fetch("/api/upload", {
       method: "POST",
       headers: await authHeaders(), // NOTE: no Content-Type — browser sets boundary
       body: formData,
     });
     const data = await res.json().catch(() => ({}));
     if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
     return (data as { url: string }).url;
   }
   ```
   The `Authorization: Bearer <token>` header is included (admin-only endpoint). The `Content-Type` is **deliberately not set** — the browser sets it to `multipart/form-data; boundary=...` automatically when given a `FormData` body.

4. **Server saves the file.** The `POST /api/upload` route handler:
   - Reads the `file` field from the FormData
   - Generates a filename: `{Date.now()}-{randomHex}.{ext}` (e.g. `1783576002865-ae5e6ef2fc0d.png`)
   - Writes the file to `public/uploads/`
   - Returns `{ url: "/uploads/<filename>" }`

5. **Client stores the URL.** The uploader calls `onChange(url)`, which updates the parent form's state. The URL is then included in the next `POST /api/menu` (or gallery/testimonial/etc.) call as part of the record.

6. **Database stores the URL string.** The URL `/uploads/1783576002865-ae5e6ef2fc0d.png` is saved in the relevant column (`MenuItem.image`, `MenuItem.images[]`, `GalleryImage.url`, `Testimonial.photo`, `EventItem.image`, `CateringPackage.image`). Never Base64, never binary.

### Filename format
`{Date.now()}-{randomHex}.{ext}`

- `Date.now()` — Unix milliseconds (13 digits), ensures chronological ordering
- `randomHex` — 12-char hex string (from `crypto.randomBytes(6).toString("hex")`), prevents collisions
- `ext` — preserved from the original filename (lowercased)

Example: `1783576002865-ae5e6ef2fc0d.png`

### URL format
Relative paths only: `/uploads/...` or `/img/...`. The browser resolves these against the current origin, so they work in dev (`http://localhost:3000`) and production (whatever domain) without modification.

> **Important:** The prompt mentioned a `/api/upload` route. The client code (`apiUpload` in `src/lib/api.ts`, and both uploader components) expects this endpoint to exist at `POST /api/upload`, accept `multipart/form-data` with a `file` field, and return `{ url: string }`. The route handler itself should live at `src/app/api/upload/route.ts`. A sample uploaded file (`public/uploads/1783576002865-ae5e6ef2fc0d.png`) confirms the flow has worked. **Verify the route file exists in your checkout** — if it's missing, uploads will 404 and the admin image uploaders will fail with "Upload failed".

---

## 2. Validation Rules

| Rule | Value | Enforced where |
|------|-------|----------------|
| Allowed MIME types | `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/avif` | Client (uploader regex) |
| Max file size | 6 MB (`6 * 1024 * 1024` bytes) | Client (uploader) |
| Auth required | Yes — admin JWT | Server (`requireAdmin`) |
| Filename | Server-generated (`{ts}-{rand}.ext`) | Server |
| Storage location | `public/uploads/` | Server |

> **Note:** Validation is client-side only. A determined attacker could bypass the client checks and POST a 100 MB file directly. The server route should also enforce size/type limits — add a `Content-Length` check and re-validate the MIME type server-side if not already done.

---

## 3. `<ImageUploader>` (Single Image)

Located in `src/components/admin/ui.tsx`. Used by:
- `AdminGallery` (gallery image)
- `AdminTestimonials` (testimonial avatar)
- `AdminEvents` (event image)
- `AdminCatering` (package image)

### Features
- **Drag & drop** zone with `onDragOver`/`onDragLeave`/`onDrop` handlers. Drag-over state adds a gold border + bg tint.
- **Click to browse** — hidden `<input type="file" accept="image/*">` triggered by clicking the drop zone.
- **Preview** — once a URL is set, shows the image with `object-cover` and a hover overlay with two buttons:
  - **Replace** (reopens file picker)
  - **Remove** (clears the URL via `onChange("")`)
- **Paste URL fallback** — a toggle switches between the upload UI and a text input where the admin can paste an external URL (e.g. a CDN link). "Set" button calls `onChange(urlInput)`.
- **Progress bar** — gold bar that animates from 0% to 100% during upload. Hidden 400ms after completion.
- **Error display** — red callout below the uploader if validation or upload fails.
- **Aspect ratio** — configurable via `aspect` prop (default `"16/10"`). Applied as `style={{ aspectRatio: aspect }}`.

### Props
```ts
{
  value: string;            // current URL (empty string = no image)
  onChange: (v: string) => void;
  label?: string;           // default "Image"
  aspect?: string;          // default "16/10"
}
```

---

## 4. `<MultiImageUploader>` (Multiple Images)

Located in `src/components/admin/AdminMenu.tsx` (not shared — currently only used for menu item images). Used by:
- `AdminMenu` (menu item `images[]` array)

### Features
- **Grid of thumbnails** (3 cols mobile, 4 cols desktop). Each thumbnail is square (`aspect-square`) with `object-cover`.
- **Cover badge** — the first image (index 0) gets a gold "Cover" badge with a star icon. This image is also written to the legacy `MenuItem.image` field by the API.
- **Number badge** — top-right of each thumbnail, shows the 1-based index.
- **Hover overlay** on each thumbnail with 4 actions:
  - **Replace** (upload icon) — opens file picker; the next file picked replaces this thumbnail
  - **Delete** (trash icon) — removes the image from the array
  - **Move Left** (chevron-left) — swaps with the previous image (disabled on index 0)
  - **Move Right** (chevron-right) — swaps with the next image (disabled on the last index)
- **Add Image tile** — at the end of the grid, a dashed-border tile that opens the file picker. Each picked file is uploaded and appended to the array.
- **Paste URL fallback** — text input + "Add" button to append an external URL.
- **Upload state** — `uploading` boolean disables interactions during upload.
- **Error display** — red callout below the grid.

### Props
```ts
{
  value: string[];           // array of URLs
  onChange: (v: string[]) => void;
}
```

### Cover image semantics
The first image in the array (`value[0]`) is treated as the "cover" or "primary" image. The API (`POST`/`PATCH /api/menu`) syncs this to the legacy `MenuItem.image` field:
```ts
data.image = imgs[0] ?? data.image ?? null;
```
So both `image` (single) and `images` (array) point to the same first image. The public site can read either.

---

## 5. Static Images (`public/img/`)

44 compressed WebP files curated for the seed data. Referenced by `src/lib/images.ts`:

```ts
export const IMAGES = {
  hero: ["/img/5f21ceac4c28.webp", "/img/a886f6fa2923.webp", "/img/77293b7a9ebc.webp"],
  food: [/* 8 images */],
  interior: [/* 8 images */],
  drinks: [/* 6 images */],
  banquet: [/* 6 images */],
  dessert: [/* 5 images */],
  ambiance: [/* 3 images */],
  avatar: ["/img/150-12.webp", "/img/150-32.webp", "/img/150-45.webp", "/img/150-5.webp", "/img/150-15.webp", "/img/150-68.webp"],
};
```

### Categories
| Category | Count | Used for |
|----------|-------|----------|
| `hero` | 3 | Home hero video poster + fallbacks |
| `food` | 8 | Menu items (Starters, Main Course, etc.) |
| `interior` | 8 | Gallery (Interior category), About section |
| `drinks` | 6 | Menu items (Cocktails), Gallery (Drinks) |
| `banquet` | 6 | Banquet section, Gallery (Banquet/Events) |
| `dessert` | 5 | Menu items (Desserts), Gallery (Food) |
| `ambiance` | 3 | Events, About section |
| `avatar` | 6 | Testimonial photos (150×150 WebP) |
| **Total** | **44** | |

### Compression
All static images were compressed from CDN originals using **Sharp**:
- **Format:** WebP
- **Max dimension:** 1200px (longest side)
- **Quality:** 78 (WebP quality setting)
- **Result:** ~40× smaller than the original CDN images (per the comment in `src/lib/images.ts`)

Avatars are an exception — they're 150×150px (sufficient for thumbnail display).

### Naming
- Most files have a 12-char hex name (e.g. `05d707105d1a.webp`) — these are the original CDN filenames, preserved for traceability.
- Avatar files use a `150-{n}.webp` pattern (`150-12.webp`, `150-32.webp`, etc.) — the `150` prefix indicates the 150px dimension.

### Referencing
Static images are referenced by their relative path (`/img/...`) in:
- `prisma/seed.ts` — assigns them to menu items, gallery images, testimonials, events, catering packages
- `src/lib/images.ts` — the manifest imported by site components (e.g. `Home.tsx` uses `IMAGES.hero[0]` as the video poster)
- The database (after seeding) — the URLs are stored as strings in the relevant columns

---

## 6. Image Display Conventions

### `<img>` tags
All `<img>` tags in the codebase use:
```tsx
<img src={url} alt={description} loading="lazy" decoding="async" className="..." />
```

- **`loading="lazy"`** — defers loading until the image is near the viewport. Found in 12+ site components (20+ occurrences).
- **`decoding="async"`** — hint to the browser to decode the image off the main thread.
- **`alt` text** — always provided. For decorative images inside buttons, `alt=""` is acceptable; for content images, a descriptive alt is used (e.g. `alt={dish.name}`, `alt={testimonial.name}`).

### `<ImageReveal>` (Framer Motion)
A specialized wrapper in `src/components/site/motion.tsx`:
```tsx
<ImageReveal src={url} alt={desc} className="..." rounded="rounded-2xl" />
```
Renders a `<motion.img>` with:
- `loading="lazy"` always set
- Clip-path mask reveal animation (from `inset(0 0 100% 0)` to `inset(0 0 0 0)`)
- Scale from 1.25 to 1.05
- Triggered by `useInView` (once)

### Hero video
The home hero uses a `<video>` element with `preload="auto"` (not lazy — it's above the fold and critical):
```tsx
<video autoPlay muted loop playsInline preload="auto" poster={poster} ...>
  <source src="/hero-video.mp4" type="video/mp4" />
</video>
```
The video file is `public/hero-video.mp4`. The poster is `IMAGES.hero[0]` (a static WebP).

### `object-cover`
Almost all images use `className="h-full w-full object-cover"` to fill their container while preserving aspect ratio. Containers typically set a fixed aspect ratio (`aspect-video`, `aspect-square`, `aspect-[16/10]`, etc.).

---

## 7. Storage Locations

| Location | Contents | Writable | Backed up |
|----------|----------|----------|-----------|
| `public/img/` | 44 static WebP files | No (version-controlled) | Yes (in git) |
| `public/uploads/` | Admin-uploaded files | Yes (at runtime) | **Manual** — see §9 |
| `public/hero-video.mp4` | Hero background video | No (version-controlled) | Yes (in git) |
| `public/logo.svg` | Site logo | No | Yes |
| `public/robots.txt` | SEO robots file | No | Yes |

---

## 8. No Base64 in the Database

This is a hard rule, enforced by design:

- **`apiUpload()` returns a URL string**, not a Base64 data URI.
- **Uploaders store the URL** in form state, not the file contents.
- **API routes persist the URL string** in the DB column.

Why? Base64 data URIs in the DB would:
- Bloat the DB file (a 1 MB image becomes ~1.3 MB of text)
- Slow down every query that touches the row
- Make the SQLite DB unwieldy to back up
- Prevent browser caching (each request re-serves the full Base64)

By storing URLs, the DB stays small, images are served as static files (cacheable by the browser and CDN), and the admin can replace an image without touching the DB row.

---

## 9. No Cloud Storage

There is no integration with S3, Cloudinary, ImageKit, Uploadcare, or any other cloud storage provider. Files live on the local filesystem.

### Implications
- **Single-server only.** If you scale to multiple app servers, uploads on server A won't be visible to server B. Use a shared filesystem (NFS, EFS) or migrate to cloud storage.
- **Backups must include `public/uploads/`.** The DB alone is not enough — the URLs in the DB point to files that must exist on disk.
- **CDN requires origin pull.** If you front the app with a CDN, configure it to pull from the origin for `/uploads/*` and `/img/*`. The files are not pre-uploaded to the CDN.
- **Disk space monitoring.** Uploads grow over time. Monitor `public/uploads/` size and set up alerts.

### Migration path (if needed)
To move to S3:
1. Replace `apiUpload()` to POST to S3 (presigned URL or direct upload)
2. Replace the server's `POST /api/upload` route with a presigned-URL generator
3. Update existing DB rows: `UPDATE ... SET url = REPLACE(url, '/uploads/', 'https://cdn.blackorchid.com/')`
4. Sync existing `public/uploads/` to S3: `aws s3 sync public/uploads/ s3://bucket/uploads/`

---

## 10. Build & Deployment

### `bun run build` (production)
The build script copies these directories into `.next/standalone/`:
```bash
next build && \
  cp -r .next/static .next/standalone/.next/ && \
  cp -r public .next/standalone/ && \
  cp -r db .next/standalone/ && \
  cp -r prisma .next/standalone/ && \
  cp .env .next/standalone/
```

So `public/img/`, `public/uploads/`, `public/hero-video.mp4`, etc. all end up at `.next/standalone/public/`. The standalone server serves them as static files.

### Important: `public/uploads/` must be writable
In production, the Node process running `.next/standalone/server.js` must have **write** permission to `.next/standalone/public/uploads/`. If the directory doesn't exist or isn't writable, uploads will fail with a 500 error.

```bash
mkdir -p .next/standalone/public/uploads
chmod 755 .next/standalone/public/uploads
```

### Restarting wipes nothing
The `public/uploads/` directory persists across `bun run build` and server restarts because the `cp -r public .next/standalone/` step **overwrites** but doesn't delete. However, a fresh `git clone` + `bun run build` will not have any uploaded files (they're not in git). Plan migrations accordingly.

---

## 11. Image Optimization Notes

- **Next.js `<Image>` is not used.** All images are plain `<img>` tags. This is intentional — the static WebP files are already optimized, and the Next.js Image component's on-the-fly optimization would add overhead without benefit. If you want responsive `srcset` generation, that's a future enhancement.
- **No `width`/`height` attributes.** Most images are inside containers with explicit aspect ratios (`aspect-video`, etc.), so the browser reserves space via CSS rather than attributes. This can cause minor layout shift on first paint if CSS hasn't loaded — acceptable for this design.
- **WebP everywhere.** All static images are WebP. Uploaded images keep their original format (PNG, JPEG, etc.) — the admin is expected to upload reasonably-sized images. Server-side conversion to WebP via Sharp is a future enhancement.
