# Authentication

Black Orchid uses a custom JWT-based auth system built on **bcrypt** (password hashing) and **HMAC-SHA256** (token signing). There is no third-party auth library (NextAuth.js is installed but unused). Tokens are stored both client-side (in `localStorage` for the SPA) and server-side (as an httpOnly cookie for API routes that don't send the `Authorization` header).

> **Source of truth**
> - `src/lib/auth.ts` — `hashPassword`, `verifyPassword`, `signToken`, `verifyToken`, `requireAdmin`, `AUTH_COOKIE`
> - `src/app/api/admin/login/route.ts` — login flow
> - `src/app/api/admin/logout/route.ts` — logout (clears cookie)
> - `src/app/api/admin/change-password/route.ts` — password change
> - `src/lib/store.ts` — client-side token persistence
> - `src/lib/api.ts` — `Authorization: Bearer <token>` header injection

---

## 1. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Password hashing | bcrypt (12 rounds) | Industry standard, slow enough to resist brute force, well-supported by `bcryptjs` |
| Token format | Custom JWT (HS256) | Avoids a dependency on `jsonwebtoken`; the implementation is ~30 lines and uses Node's built-in `crypto` |
| Token transport | Bearer header **and** httpOnly cookie | The SPA uses the header (read from `localStorage`); server-side fetches (if any) can rely on the cookie |
| Token lifetime | 12 hours | Balances security (short-ish) with UX (don't make the admin re-login mid-shift) |
| Session store | Stateless (JWT only) | No session DB table; the JWT is the source of truth |
| Refresh tokens | **None** | When the 12h token expires, the admin re-logs in. Acceptable for a CMS with low daily usage. |
| Role-based access | Schema field exists, **not enforced** | Future work |

---

## 2. Password Hashing (`src/lib/auth.ts`)

### `hashPassword(password)` → `Promise<string>`

```ts
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}
```

12 rounds is the project's chosen cost factor. As of 2024, this takes ~250ms on typical hardware — slow enough to deter brute force, fast enough not to annoy a login attempt. The salt is generated per-hash via `bcrypt.genSalt` (which uses `crypto.randomBytes` under the hood).

### `verifyPassword(password, stored)` → `Promise<boolean>`

```ts
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);   // bcrypt hashes start with $2a$, $2b$, or $2y$
  }
  return verifyScryptLegacy(password, stored); // backward compat
}
```

The function detects the hash format by its prefix:
- **`$2...`** → bcrypt. Verified via `bcrypt.compare`, which is constant-time.
- **Anything else** → assumed to be a legacy scrypt hash in `salt:hash` (both hex) format. Verified via `verifyScryptLegacy`.

### Legacy scrypt verification

```ts
function verifyScryptLegacy(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}
```

This exists for backward compatibility with hashes created before the bcrypt migration. The comparison uses `timingSafeEqual` to prevent timing attacks. **New passwords are always hashed with bcrypt** — the scrypt path is read-only.

> **When can the legacy path be removed?** Once every admin user has logged in at least once after the bcrypt migration (which re-hashes their password on change), the scrypt path is dead code. Until then, it must stay.

---

## 3. JWT Tokens (`src/lib/auth.ts`)

### Token structure

A Black Orchid JWT has the standard 3-part structure: `header.payload.signature`, all base64url-encoded and dot-separated.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbH...IiwiZW1haWwiOiJhZG1pbkBibGFja29yY2hpZC5jb20iLCJyb2xlIjoiQURNSU4iLCJleHAiOjE3MTM...fQ.<signature>
```

| Part | Content |
|------|---------|
| `header` | `{"alg":"HS256","typ":"JWT"}` |
| `payload` | `{"sub":"<userId>","email":"<email>","role":"ADMIN","exp":<unix-seconds>}` |
| `signature` | HMAC-SHA256 of `header.payload`, base64url-encoded, signed with `ADMIN_JWT_SECRET` |

### `signToken(payload, expiresInSeconds = 43200)` → `string`

```ts
const SECRET = process.env.ADMIN_JWT_SECRET || "black-orchid-dev-secret-change-me";

export function signToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 60 * 60 * 12): string {
  const full: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signingInput = `${header}.${payloadB64}`;
  const sig = createHmac("sha256", SECRET).update(signingInput).digest("base64url");
  return `${signingInput}.${sig}`;
}
```

The `exp` claim is computed at sign time as `now + 43200` (12 hours in seconds).

### `verifyToken(token)` → `TokenPayload | null`

```ts
export function verifyToken(token: string | null | undefined): TokenPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payloadB64, sig] = parts;
  const signingInput = `${header}.${payloadB64}`;
  const expected = createHmac("sha256", SECRET).update(signingInput).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
```

Verification steps:
1. Split into 3 parts (rejects malformed tokens)
2. Recompute the HMAC over `header.payload` and compare with the provided signature using `timingSafeEqual` (constant-time, prevents timing attacks)
3. Parse the payload JSON (catches malformed payloads)
4. Check `exp` — if it's in the past, the token is expired
5. Returns the payload (`{ sub, email, role, exp }`) or `null`

### `TokenPayload`

```ts
export type TokenPayload = { sub: string; email: string; role: string; exp: number };
```

- `sub` — the admin user's Prisma ID (used by `change-password` to look up the user)
- `email` — for display
- `role` — `"ADMIN"` | `"MANAGER"` | `"EDITOR"` (currently unused by route guards)
- `exp` — Unix timestamp in seconds

### Secret

```ts
const SECRET = process.env.ADMIN_JWT_SECRET || "black-orchid-dev-secret-change-me";
```

**In production, `ADMIN_JWT_SECRET` must be set** to a strong random string (≥ 32 chars). If it's not set, the fallback `"black-orchid-dev-secret-change-me"` is used — which is fine for local dev but a critical security hole in production.

Generate a strong secret:
```bash
openssl rand -base64 32
```

---

## 4. Login Flow (`POST /api/admin/login`)

```
Client                          Server
  |                               |
  | POST /api/admin/login         |
  | { email, password }           |
  |------------------------------>|
  |                               | 1. lowercase + trim email
  |                               | 2. db.adminUser.findUnique({ email })
  |                               | 3. verifyPassword(password, user.password)
  |                               |    - bcrypt.compare OR scrypt fallback
  |                               | 4. (if valid) signToken({ sub, email, role })
  |                               | 5. set httpOnly cookie "bo_admin_token"
  |                               |    - maxAge: 43200 (12h)
  |                               |    - sameSite: "lax"
  |                               |    - path: "/"
  |                               |    - httpOnly: true
  |<------------------------------|
  | { token, user: {...} }        |
  |                               |
  | Store token in localStorage   |
  | Store user in localStorage    |
  | Update Zustand store          |
```

### Client side (after receiving the response)
```ts
// In AdminApp.LoginScreen.submit():
const res = await apiPost("/api/admin/login", { email, password });
onSuccess(res.token, res.user);

// onSuccess calls store.setAdmin(token, user), which:
// - sets adminToken + adminUser in the Zustand store
// - writes both to localStorage
```

### Why both localStorage **and** a cookie?
- **localStorage** is read by `api.ts`'s `authHeaders()` to send `Authorization: Bearer <token>` on every API call. This works for fetches initiated by client-side JS.
- **httpOnly cookie** is sent automatically by the browser on every request to the same origin, including requests that don't go through `fetch` (e.g. direct navigation). The cookie is also inaccessible to client-side JS, so an XSS attack can't steal it.
- `requireAdmin()` accepts **either** — see §6.

### Error responses
| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "Email and password are required" }` | Missing field |
| 401 | `{ "error": "Invalid credentials" }` | User not found OR wrong password (same message — prevents user enumeration) |
| 500 | `{ "error": "Login failed" }` | Unexpected exception |

---

## 5. Token Extraction (`getTokenFromRequest`)

```ts
export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
```

Preference order:
1. **`Authorization: Bearer <token>` header** — preferred, set by `api.ts`
2. **`bo_admin_token` httpOnly cookie** — fallback for requests that don't set the header

The cookie name is the exported constant `AUTH_COOKIE = "bo_admin_token"`.

---

## 6. `requireAdmin(req)` — Route Guard

```ts
export async function requireAdmin(req: Request) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token);
  return payload; // null if not authenticated
}
```

Every protected route uses the same pattern:

```ts
export async function PATCH(req: Request, { params }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... proceed with admin.sub, admin.email, admin.role
}
```

`requireAdmin` returns the `TokenPayload` (so routes can use `admin.sub` to identify the user) or `null`. It does **not** throw — the route handler is responsible for checking and returning 401.

### Routes protected by `requireAdmin`
- `POST /api/menu`
- `PATCH /api/menu/[id]`, `DELETE /api/menu/[id]`
- `PATCH /api/categories/[id]`, `DELETE /api/categories/[id]`
- `POST /api/gallery`, `PATCH /api/gallery/[id]`, `DELETE /api/gallery/[id]`
- `POST /api/testimonials`, `PATCH /api/testimonials/[id]`, `DELETE /api/testimonials/[id]`
- `POST /api/events`, `PATCH /api/events/[id]`, `DELETE /api/events/[id]`
- `POST /api/catering`, `PATCH /api/catering/[id]`, `DELETE /api/catering/[id]`
- `GET /api/reservations`, `PATCH /api/reservations/[id]`, `DELETE /api/reservations/[id]`
- `PUT /api/settings`
- `GET /api/stats`
- `POST /api/admin/change-password`
- `POST /api/upload`

### Routes that are **not** protected
- `POST /api/admin/login` (obviously)
- `POST /api/admin/logout` (clears the cookie; safe to call without a token)
- All `GET` endpoints on public content (`/api/menu`, `/api/gallery`, `/api/testimonials`, `/api/events`, `/api/catering`, `/api/settings`)
- `POST /api/reservations` (public — visitors create reservations)

---

## 7. Change Password (`POST /api/admin/change-password`)

```
Client                                Server
  |                                     |
  | POST /api/admin/change-password     |
  | Authorization: Bearer <old-token>   |
  | { currentPassword, newPassword }    |
  |------------------------------------>|
  |                                     | 1. requireAdmin(req) → must return payload
  |                                     | 2. Validate body (both fields, length >= 8, different)
  |                                     | 3. db.adminUser.findUnique({ id: admin.sub })
  |                                     | 4. verifyPassword(currentPassword, user.password)
  |                                     |    - if false → 403 "Current password is incorrect"
  |                                     | 5. hashPassword(newPassword)  ← bcrypt 12 rounds
  |                                     | 6. db.adminUser.update({ password: hashed })
  |<------------------------------------|
  | { ok: true }                        |
  |                                     |
  | Client calls onSignOut()            |
  | - clears localStorage               |
  | - clears Zustand store              |
  | - redirects to /                    |
  | (admin must re-login)               |
```

### Validation rules
| Rule | Status | Error |
|------|--------|-------|
| `currentPassword` and `newPassword` both present | 400 | `"Current password and new password are required"` |
| `newPassword.length >= 8` | 400 | `"New password must be at least 8 characters"` |
| `newPassword !== currentPassword` | 400 | `"New password must be different from the current password"` |
| Valid admin token | 401 | `"Unauthorized"` |
| User exists in DB | 404 | `"User not found"` |
| `currentPassword` correct | 403 | `"Current password is incorrect"` |

### Why force re-login after change?
The old token is **not invalidated** — JWTs are stateless, so there's no way to revoke a specific token without a server-side blocklist. Forcing re-login ensures:
- The admin confirms they know the new password
- Any other tabs/sessions holding the old token will fail their next API call (the password changed, but the token is still technically valid for 12h — the next `change-password` call would fail at step 4)

If immediate revocation is needed, implement a `tokenVersion` column on `AdminUser` and include it in the JWT payload; bump it on password change.

---

## 8. Logout (`POST /api/admin/logout`)

```ts
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 0,
  });
  return res;
}
```

Server-side: sets the cookie's `maxAge` to 0, which deletes it.

Client-side (`AdminApp.signOut`):
1. Calls `clearAdmin()` on the Zustand store — nulls `adminToken` + `adminUser` in memory
2. Removes `bo_admin_token` and `bo_admin_user` from `localStorage`
3. Calls `router.push("/")` to leave the admin route

> Note: `signOut` does **not** call `/api/admin/logout`. The cookie is cleared only on the next API call to `/api/admin/logout`. In practice, the client doesn't need the cookie (it uses the `Authorization` header from `localStorage`), so this is fine. If you want strict logout (clear cookie too), call `await apiPost("/api/admin/logout", {})` before `clearAdmin()`.

---

## 9. Session Persistence

| What | Where | Read by | Lifetime |
|------|-------|---------|----------|
| JWT token | `localStorage.bo_admin_token` | `api.ts`'s `authHeaders()` → `Authorization` header | Until explicit logout OR 12h expiry (token becomes invalid server-side) |
| JWT token | httpOnly cookie `bo_admin_token` | `requireAdmin()` fallback | `maxAge: 43200` (12h), or cleared by `/api/admin/logout` |
| User info | `localStorage.bo_admin_user` (JSON) | `hydrateAdmin()` on app mount | Until explicit logout |

### Hydration on app mount

`src/app/page.tsx` and `src/app/admin/page.tsx` both call `hydrateAdmin()` in a `useEffect`:

```ts
useEffect(() => { hydrateAdmin(); ... }, []);
```

`hydrateAdmin()` reads both `localStorage` keys and, if present, restores the session in the Zustand store. This is what keeps the admin logged in across page reloads.

> The Zustand store is in-memory only — it does **not** persist between reloads. Without `hydrateAdmin()`, every reload would log the admin out (even though the cookie would still be valid). Hydration bridges the gap.

---

## 10. Role-Based Access Control (Future Work)

The schema declares:
```prisma
model AdminUser {
  ...
  role String @default("ADMIN") // ADMIN | MANAGER | EDITOR
}
```

But `requireAdmin()` does **not** check the role — any valid token (regardless of role) can perform any admin action. The `role` field is currently:
- Stored in the JWT payload
- Returned from `/api/admin/login`
- Displayed in the admin sidebar ("ADMIN" badge)

To implement RBAC, extend `requireAdmin`:

```ts
export async function requireAdmin(req: Request, allowedRoles: string[] = ["ADMIN", "MANAGER", "EDITOR"]) {
  const payload = verifyToken(getTokenFromRequest(req));
  if (!payload) return null;
  if (!allowedRoles.includes(payload.role)) return null;
  return payload;
}
```

Then per-route:
```ts
const admin = await requireAdmin(req, ["ADMIN"]); // only ADMIN can delete
```

This is a non-breaking change — existing calls without the second argument would default to allowing all three roles (current behavior).

---

## 11. Security Considerations

### What's done well
- ✅ bcrypt with 12 rounds for password hashing
- ✅ Constant-time comparison (`timingSafeEqual`) for both password verification and JWT signature check
- ✅ httpOnly cookie (inaccessible to client-side JS, mitigating XSS theft)
- ✅ `sameSite: "lax"` on the cookie (mitigates CSRF for top-level navigations)
- ✅ Generic "Invalid credentials" message (no user enumeration)
- ✅ Tokens expire (12h)
- ✅ Password change requires the current password

### Known gaps
- ⚠️ **No rate limiting** on `/api/admin/login` — vulnerable to brute force. Mitigate at the gateway (Caddy `rate_limit`) or add an in-memory limiter.
- ⚠️ **No CSRF token** — `sameSite: "lax"` protects against most CSRF, but not all. If you add state-changing `GET` routes (anti-pattern, but possible), add a CSRF token.
- ⚠️ **No token revocation** — a stolen token is valid for up to 12h. Implement a `tokenVersion` field if this matters.
- ⚠️ **Default JWT secret in source code** — `"black-orchid-dev-secret-change-me"` is committed to `auth.ts`. Production **must** set `ADMIN_JWT_SECRET` env var. Add a startup check that fails fast if the secret is the default in production.
- ⚠️ **No password complexity rules** — only `length >= 8` is enforced. Consider requiring mixed case + digits for production.
- ⚠️ **No 2FA** — single-factor only. Acceptable for a small CMS, but worth noting.

### Default credentials
The seed script creates:
- **Email:** `admin@blackorchid.com`
- **Password:** `admin123`

These are documented in the login screen (demo banner). **Change them immediately after seeding in any non-local environment** via the "Change Password" modal in the admin sidebar.
