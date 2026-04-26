import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  AUTH0_ISSUER: z.string().url(),
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required"),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  APP_BASE_URL: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";
const isTest = () => process.env.NODE_ENV === "test";

function validate<T extends z.ZodTypeAny>(
  schema: T,
  raw: Record<string, unknown>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    if (isBuild() || isTest()) {
      console.warn(`[env] ${label} validation skipped:\n${issues}`);
      return raw as z.infer<T>;
    }
    throw new Error(`Invalid ${label} environment variables:\n${issues}`);
  }
  return result.data;
}

const clientRaw = () => ({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
});

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

/**
 * Validate server-side env on first access. Safe to call from server modules
 * that may also be imported on the client (returns the un-validated raw object
 * with TS types when called outside of a server context).
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    return process.env as unknown as ServerEnv;
  }
  if (!_serverEnv) {
    _serverEnv = validate(serverSchema, process.env, "server");
  }
  return _serverEnv;
}

export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = validate(clientSchema, clientRaw(), "client");
  }
  return _clientEnv;
}

// Backwards-compat exports — these used to be eagerly-evaluated constants.
// They're now Proxies that defer until first property access.
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get: (_t, prop) => Reflect.get(getServerEnv(), prop),
});

export const clientEnv: ClientEnv = new Proxy({} as ClientEnv, {
  get: (_t, prop) => Reflect.get(getClientEnv(), prop),
});
