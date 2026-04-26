type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs?: number;
  max?: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const DEFAULT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 60);

/**
 * Lightweight in-memory rate limiter. Suitable for a single-instance
 * deployment or per-edge-function. For multi-instance production traffic
 * back this with Redis or Upstash.
 */
export function rateLimit(key: string, opts: RateLimitOptions = {}): RateLimitResult {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW;
  const max = opts.max ?? DEFAULT_MAX;
  const now = Date.now();

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { ok: true, remaining: max - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

export function _resetRateLimit() {
  buckets.clear();
}
