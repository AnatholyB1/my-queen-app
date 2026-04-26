import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  // Verbose SQL logging is fine in dev but leaks data in prod logs.
  logger: process.env.NODE_ENV !== "production",
});
