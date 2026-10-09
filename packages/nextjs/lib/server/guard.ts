import { blobToken } from "./blob";
import { HttpError } from "./errors";
import { put } from "@vercel/blob";
import { createHash, timingSafeEqual } from "node:crypto";
import "server-only";

/**
 * Abuse guards for the API layer. State lives in module memory, so it is per serverless instance and resets on
 * a cold start. That slows abuse down but is not a hard guarantee; only the Blob-backed drip claim is durable.
 */

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Constant-time comparison: both sides are hashed first so the length never leaks. */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

const buckets = new Map<string, { count: number; reset: number }>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
}

/** Fixed-window counter. Throws 429 once `max` hits are used inside `windowMs`. */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  message = "Terlalu banyak permintaan, coba lagi nanti",
) {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  if (b.count >= max) throw new HttpError(429, message);
  b.count++;
}

// Operator-code lockout per IP: after MAX_FAILS wrong codes the IP is locked out, and every failure also costs delay.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const fails = new Map<string, { count: number; lockedUntil: number }>();

export function assertNotLocked(ip: string) {
  const f = fails.get(ip);
  if (f && f.lockedUntil > Date.now()) throw new HttpError(429, "Terlalu banyak percobaan kode salah, coba lagi nanti");
}

export async function recordFailure(ip: string) {
  const f = fails.get(ip) ?? { count: 0, lockedUntil: 0 };
  f.count++;
  if (f.count >= MAX_FAILS) {
    f.lockedUntil = Date.now() + LOCK_MS;
    f.count = 0;
  }
  fails.set(ip, f);
  await new Promise(r => setTimeout(r, 600));
}

export function recordSuccess(ip: string) {
  fails.delete(ip);
}

// Per-key mutex so two parallel requests from the same user cannot both pass a check-then-act.
const locks = new Map<string, Promise<unknown>>();
export async function withLock<T>(key: string, job: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const run = prev.then(job, job);
  const tail = run.catch(() => undefined);
  locks.set(key, tail);
  try {
    return await run;
  } finally {
    if (locks.get(key) === tail) locks.delete(key);
  }
}

// Daily top-up budget per user (in-memory).
const DAY = 24 * 3600_000;
export const TOPUP_DAILY_LIMIT = 2_000_000;
const topups = new Map<string, { total: number; reset: number }>();

/** Reserves part of the user's daily budget; returns a function that gives it back if the mint fails. */
export function reserveTopup(userId: string, amount: number): () => void {
  const now = Date.now();
  let t = topups.get(userId);
  if (!t || t.reset <= now) {
    t = { total: 0, reset: now + DAY };
    topups.set(userId, t);
  }
  if (t.total + amount > TOPUP_DAILY_LIMIT)
    throw new HttpError(429, "Batas isi saldo harian tercapai (Rp2.000.000 per hari)");
  t.total += amount;
  const entry = t;
  return () => {
    entry.total = Math.max(0, entry.total - amount);
  };
}

// Gas drip: one per Privy user. The durable claim is a Blob that cannot be overwritten, so the write itself is
// the atomic "first one wins"; without a Blob token only the in-memory set protects (per instance).
const dripped = new Set<string>();
const dripId = (userId: string) => createHash("sha256").update(`drip:${userId}`).digest("hex");

/** Returns true if this call won the claim, false if the user already received a drip. */
export async function claimDrip(userId: string): Promise<boolean> {
  const id = dripId(userId);
  if (dripped.has(id)) return false;
  const token = blobToken();
  if (token) {
    try {
      await put(`claims/drip-${id}.json`, JSON.stringify({ at: Date.now() }), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: false,
        token,
      });
    } catch (e) {
      if (/already exists/i.test(String((e as Error)?.message))) {
        dripped.add(id);
        return false;
      }
      throw e;
    }
  }
  dripped.add(id);
  return true;
}

/** Lets the user try again when the drip transaction itself failed (in-memory only; the Blob claim stays). */
export function releaseDrip(userId: string) {
  dripped.delete(dripId(userId));
}

/** Private, loopback, link-local and metadata addresses must never be fetched on behalf of a user. */
export function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.includes(":")) {
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  const p = v.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}
