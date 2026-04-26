"use server";

import { db } from "@/app/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser, type AuthUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type DbUser = {
  id: number;
  externalId: string;
  email: string;
  name: string | null;
};

/**
 * Resolve the authenticated session user to a row in the `users` table,
 * inserting one on first sight (just-in-time provisioning).
 */
export async function getOrCreateCurrentUser(): Promise<DbUser> {
  const auth: AuthUser = await requireUser();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.externalId, auth.id))
    .limit(1);

  if (existing.length > 0) {
    const u = existing[0]!;
    return {
      id: u.id,
      externalId: u.externalId,
      email: u.email,
      name: u.name ?? null,
    };
  }

  // External-id missing: try to recover by email so legacy rows are reused.
  const byEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, auth.email))
    .limit(1);

  if (byEmail.length > 0) {
    const u = byEmail[0]!;
    await db
      .update(users)
      .set({ externalId: auth.id, name: auth.name ?? u.name })
      .where(eq(users.id, u.id));
    return {
      id: u.id,
      externalId: auth.id,
      email: u.email,
      name: auth.name ?? u.name,
    };
  }

  const inserted = await db
    .insert(users)
    .values({
      externalId: auth.id,
      email: auth.email,
      name: auth.name ?? null,
    })
    .returning();

  logger.info({ userId: inserted[0]!.id }, "Provisioned new user from session");
  return {
    id: inserted[0]!.id,
    externalId: inserted[0]!.externalId,
    email: inserted[0]!.email,
    name: inserted[0]!.name ?? null,
  };
}
