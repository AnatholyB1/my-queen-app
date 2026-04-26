import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

type DB = ReturnType<typeof drizzle>;

let _db: DB | null = null;

function init(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required to perform database operations",
    );
  }
  const sql = neon(url);
  return drizzle(sql, {
    // Verbose SQL logging is fine in dev but leaks data in prod logs.
    logger: process.env.NODE_ENV !== "production",
  });
}

/**
 * Lazy Drizzle client. We don't initialize at module-load so that bundling /
 * static analysis paths that import this module without ever calling it
 * (eg. typecheck, build-time tree-shaking on routes that only re-export types)
 * don't crash.
 */
export const db: DB = new Proxy({} as DB, {
  get(_t, prop, receiver) {
    if (!_db) _db = init();
    const value = Reflect.get(_db as object, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});
