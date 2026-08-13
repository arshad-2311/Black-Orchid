import { timingSafeEqual, createHmac, scryptSync } from "crypto";
import bcrypt from "bcryptjs";

const DEFAULT_SECRET = "black-orchid-dev-secret-change-me";

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return DEFAULT_SECRET;
  }
  return secret;
}

const SECRET = getJwtSecret();
const BCRYPT_ROUNDS = 12;

/* ---------- Password hashing (bcrypt) ---------- */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Backward compat: old scrypt hashes are "salt:hash" (hex), bcrypt hashes start with "$2"
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }
  // Legacy scrypt verification (for hashes created before the bcrypt migration)
  return verifyScryptLegacy(password, stored);
}

function verifyScryptLegacy(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

/* ---------- JWT (HMAC-SHA256 signed token) ---------- */
export type TokenPayload = { sub: string; email: string; role: string; exp: number };

export function signToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 60 * 60 * 12): string {
  const full: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  // JWT-style structure: header.payload.signature (HS256)
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signingInput = `${header}.${payloadB64}`;
  const sig = createHmac("sha256", SECRET).update(signingInput).digest("base64url");
  return `${signingInput}.${sig}`;
}

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
