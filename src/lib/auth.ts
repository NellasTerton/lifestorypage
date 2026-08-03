import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The cookie holds the user id plus an HMAC of it. Without the signature a
 * visitor could simply write `session=2` and read another account's dashboard,
 * so the signature is what makes the id trustworthy — no JWT library needed.
 */
function sign(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function verify(value: string, signature: string): boolean {
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  // Lengths must match before timingSafeEqual, which throws otherwise.
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const value = String(userId);
  const store = await cookies();
  store.set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the signed-in user's id, or null. Never trusts the raw cookie value. */
export async function getUserId(): Promise<number | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  const at = raw.lastIndexOf(".");
  if (at <= 0) return null;

  const value = raw.slice(0, at);
  const signature = raw.slice(at + 1);
  if (!verify(value, signature)) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getCurrentUser() {
  const id = await getUserId();
  if (!id) return null;

  const [user] = await getDb()
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}
