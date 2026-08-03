import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

type Db = ReturnType<typeof drizzle>;

let cached: Db | null = null;

/**
 * Lazily built so importing this module during `next build` doesn't require
 * DATABASE_URL to be present — only actually querying does.
 */
export function getDb(): Db {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    cached = drizzle(neon(url));
  }
  return cached;
}
