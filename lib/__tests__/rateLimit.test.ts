import { afterEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit, rateLimit } from "@/lib/rateLimit";

afterEach(() => {
  _resetRateLimit();
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const r1 = rateLimit("k", { max: 3, windowMs: 1000 });
    const r2 = rateLimit("k", { max: 3, windowMs: 1000 });
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.ok).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks requests over the limit", () => {
    rateLimit("k", { max: 2, windowMs: 1000 });
    rateLimit("k", { max: 2, windowMs: 1000 });
    const r3 = rateLimit("k", { max: 2, windowMs: 1000 });
    expect(r3.ok).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("isolates buckets per key", () => {
    rateLimit("a", { max: 1, windowMs: 1000 });
    expect(rateLimit("b", { max: 1, windowMs: 1000 }).ok).toBe(true);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    rateLimit("k", { max: 1, windowMs: 100 });
    expect(rateLimit("k", { max: 1, windowMs: 100 }).ok).toBe(false);
    vi.advanceTimersByTime(150);
    expect(rateLimit("k", { max: 1, windowMs: 100 }).ok).toBe(true);
  });
});
