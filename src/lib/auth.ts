import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

const SECRET = process.env.ADMIN_JWT_SECRET || "black-orchid-dev-secret-change-me";

/* ---------- Password hashing (scrypt) ---------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

/* ---------- Simple signed token (HMAC) ---------- */
export type TokenPayload = { sub: string; email: string; role: string; exp: number };

export function signToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 60 * 60 * 12): string {
  const full: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string | null | undefined): TokenPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = "bo_admin_token";

/* ---------- Express-like header/cookie helpers for route handlers ---------- */
export function getTokenFromRequest(req: Request): string | null {
  // Prefer Authorization header, fall back to cookie
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

export async function requireAdmin(req: Request) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token);
  return payload; // null if not authenticated
}
