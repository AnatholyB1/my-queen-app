import { afterEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

import { getOptionalUser, requireUser, UnauthorizedError } from "@/lib/auth";

afterEach(() => {
  getServerSessionMock.mockReset();
});

describe("requireUser", () => {
  it("throws Unauthorized when no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws Unauthorized when session has no email", async () => {
    getServerSessionMock.mockResolvedValue({ user: {} });
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns user info when session has email", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "a@b.c", name: "A B", id: "ext-1" },
    });
    await expect(requireUser()).resolves.toEqual({
      id: "ext-1",
      email: "a@b.c",
      name: "A B",
    });
  });

  it("falls back to email as id if no provider sub", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "a@b.c", name: null },
    });
    await expect(requireUser()).resolves.toMatchObject({
      id: "a@b.c",
      email: "a@b.c",
    });
  });
});

describe("getOptionalUser", () => {
  it("returns null when unauthorized", async () => {
    getServerSessionMock.mockResolvedValue(null);
    await expect(getOptionalUser()).resolves.toBeNull();
  });
});
