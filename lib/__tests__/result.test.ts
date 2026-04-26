import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  },
}));

import { action, fail, ok } from "@/lib/result";
import { UnauthorizedError } from "@/lib/auth";
import { ValidationError } from "@/lib/validation";

describe("ok / fail", () => {
  it("ok wraps a payload", () => {
    expect(ok({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });
  it("fail wraps an error", () => {
    expect(fail({ code: "INTERNAL", message: "x" })).toEqual({
      success: false,
      error: { code: "INTERNAL", message: "x" },
    });
  });
});

describe("action", () => {
  it("returns success when the body resolves", async () => {
    const r = await action("test", async () => 42);
    expect(r).toEqual({ success: true, data: 42 });
  });

  it("maps UnauthorizedError to UNAUTHORIZED", async () => {
    const r = await action("test", async () => {
      throw new UnauthorizedError();
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe("UNAUTHORIZED");
  });

  it("maps ValidationError to VALIDATION with issues", async () => {
    const r = await action("test", async () => {
      throw new ValidationError([{ path: "x", message: "bad" }]);
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.code).toBe("VALIDATION");
      if (r.error.code === "VALIDATION") {
        expect(r.error.issues).toEqual([{ path: "x", message: "bad" }]);
      }
    }
  });

  it("hides raw errors as INTERNAL", async () => {
    const r = await action("test", async () => {
      throw new Error("DB connection password=hunter2 leak");
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.code).toBe("INTERNAL");
      expect(r.error.message).not.toContain("hunter2");
    }
  });
});
