/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { dbMock, userMock } = vi.hoisted(() => ({
  dbMock: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
  userMock: vi.fn(),
}));

vi.mock("@/app/db", () => ({ db: dbMock }));
vi.mock("@/backEnd/users", () => ({
  getOrCreateCurrentUser: () => userMock(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  createNotification,
  getAllNotifications,
  getUnreadNotifications,
  markNotificationRead,
} from "@/backEnd/notification";

const ME = { id: 1, externalId: "ext", email: "me@example.com", name: "Me" };
const OTHER_ROW = {
  id: 10,
  senderId: 2,
  title: "Hi",
  message: "msg",
  link: "/",
  read: false,
  timestamp: "2025-01-01T00:00:00Z",
  senderEmail: "you@example.com",
  senderName: "You",
};

function chainable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  for (const m of [
    "from",
    "where",
    "innerJoin",
    "leftJoin",
    "limit",
    "orderBy",
    "values",
    "set",
    "returning",
    "as",
    "onConflictDoUpdate",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  (chain as { then: (cb: (v: T) => unknown) => unknown }).then = (cb) =>
    Promise.resolve(result).then(cb);
  return chain;
}

afterEach(() => {
  vi.clearAllMocks();
  userMock.mockReset();
});

describe("createNotification", () => {
  it("rejects external links", async () => {
    userMock.mockResolvedValue(ME);
    const r = await createNotification({
      title: "t",
      message: "m",
      link: "https://evil.com",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe("VALIDATION");
  });

  it("inserts when input is valid", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.insert.mockReturnValueOnce(
      chainable([
        {
          id: 5,
          senderId: ME.id,
          title: "t",
          message: "m",
          link: "/",
          read: false,
          timestamp: "2025-01-01T00:00:00Z",
        },
      ]),
    );
    const r = await createNotification({ title: "t", message: "m", link: "/" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.id).toBe(5);
      expect(r.data.senderEmail).toBe(ME.email);
    }
  });
});

describe("getUnreadNotifications", () => {
  it("excludes the current user as sender", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.select.mockReturnValueOnce(chainable([OTHER_ROW]));
    const r = await getUnreadNotifications();
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toHaveLength(1);
      expect(r.data[0].senderId).not.toBe(ME.id);
    }
  });
});

describe("markNotificationRead", () => {
  it("rejects empty arrays", async () => {
    userMock.mockResolvedValue(ME);
    const r = await markNotificationRead([]);
    expect(r.success).toBe(false);
  });

  it("normalizes a single id into an array under the hood", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.update.mockReturnValueOnce(chainable(undefined));
    const r = await markNotificationRead(7);
    expect(r.success).toBe(true);
  });
});

describe("getAllNotifications", () => {
  it("returns all rows for stats", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.select.mockReturnValueOnce(chainable([OTHER_ROW]));
    const r = await getAllNotifications();
    expect(r.success).toBe(true);
    if (r.success) expect(r.data[0].senderName).toBe("You");
  });
});
