import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";
import { apiEnv, superAdminEmails } from "./env";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  personId: string | null;
  isSuperAdmin: boolean;
  canViewTransactions: boolean;
  canViewRevenueShares: boolean;
  canViewPersonalData: boolean;
  canEditPeople: boolean;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64");
}

function sign(payload: string) {
  return createHmac("sha256", apiEnv.SESSION_SECRET).update(payload).digest();
}

export function createJWT(user: SessionUser): string {
  const now = Date.now();
  const payload = { ...user, iat: now, exp: now + SESSION_TTL_MS };
  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${base64url(signature)}`;
}

export function verifyJWT(token: string): SessionUser | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const actual = base64urlDecode(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encoded).toString("utf8")) as SessionUser & { exp: number };
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSessionUser(
  user: { id: string; email: string; name: string | null; image: string | null; canViewTransactions: boolean; canViewRevenueShares: boolean; canViewPersonalData: boolean; canEditPeople: boolean },
  personId: string | null,
): SessionUser {
  const isSuperAdmin = superAdminEmails.includes(user.email);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    personId,
    isSuperAdmin,
    canViewTransactions: isSuperAdmin || user.canViewTransactions,
    canViewRevenueShares: isSuperAdmin || user.canViewRevenueShares,
    canViewPersonalData: isSuperAdmin || user.canViewPersonalData,
    canEditPeople: isSuperAdmin || user.canEditPeople,
  };
}

/** Middleware: extracts JWT from Authorization header and sets c.user */
export async function jwtAuth(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const user = verifyJWT(token);
    c.set("user", user);
  } else {
    c.set("user", null);
  }
  await next();
}

/** Helper to get user from context */
export function getUser(c: Context): SessionUser | null {
  return c.get("user") as SessionUser | null;
}

/** Middleware: requires authenticated user */
export async function requireAuth(c: Context, next: Next) {
  const user = getUser(c);
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  await next();
}
