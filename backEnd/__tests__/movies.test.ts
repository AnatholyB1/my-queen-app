/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { dbMock, userMock } = vi.hoisted(() => ({
  dbMock: {
    insert: vi.fn(),
    select: vi.fn(),
    selectDistinct: vi.fn(),
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
  checkMatch,
  getLastMoviePage,
  getMatchedMovies,
  matchMovie,
  updateLastMovie,
} from "@/backEnd/movies";

const ME = { id: 1, externalId: "ext-1", email: "me@example.com", name: "Me" };

function chainable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "limit",
    "orderBy",
    "values",
    "set",
    "returning",
    "as",
    "onConflictDoUpdate",
  ];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  // Allow `await` directly on the chain by exposing then()
  (chain as { then: (cb: (v: T) => unknown) => unknown }).then = (cb) =>
    Promise.resolve(result).then(cb);
  return chain;
}

afterEach(() => {
  vi.clearAllMocks();
  userMock.mockReset();
});

describe("getMatchedMovies", () => {
  it("requires authentication", async () => {
    userMock.mockRejectedValue(
      new (await import("@/lib/auth")).UnauthorizedError(),
    );
    const r = await getMatchedMovies();
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe("UNAUTHORIZED");
  });

  it("returns matched rows when authed", async () => {
    userMock.mockResolvedValue(ME);
    const inner = chainable([{ id: 10, movieId: 200, page: 1 }]);
    dbMock.select.mockReturnValueOnce(inner);
    dbMock.selectDistinct.mockReturnValueOnce(inner);
    const r = await getMatchedMovies();
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual([{ id: 10, movieId: 200, page: 1 }]);
  });
});

describe("checkMatch", () => {
  it("rejects negative ids with VALIDATION", async () => {
    userMock.mockResolvedValue(ME);
    const r = await checkMatch(-1);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe("VALIDATION");
  });

  it("returns matched=true when both me + other liked", async () => {
    userMock.mockResolvedValue(ME);
    const rows = [
      { userId: 1, choice: true },
      { userId: 2, choice: true },
    ];
    dbMock.select.mockReturnValueOnce(chainable(rows));
    const r = await checkMatch(42);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.matched).toBe(true);
  });

  it("returns matched=false when only I liked", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.select.mockReturnValueOnce(chainable([{ userId: 1, choice: true }]));
    const r = await checkMatch(42);
    expect(r.success && r.data.matched).toBe(false);
  });
});

describe("matchMovie", () => {
  it("upserts swipe + returns matched=false on dislike", async () => {
    userMock.mockResolvedValue(ME);
    const upsert = chainable([{ id: 100 }]);
    dbMock.insert.mockReturnValueOnce(upsert).mockReturnValueOnce(chainable(undefined));

    const r = await matchMovie({
      movieData: { movieId: 99, page: 1 },
      choice: false,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.matched).toBe(false);
    expect(dbMock.insert).toHaveBeenCalledTimes(2);
  });

  it("flags a match when another user already liked", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.insert
      .mockReturnValueOnce(chainable([{ id: 100 }]))
      .mockReturnValueOnce(chainable(undefined));
    dbMock.select.mockReturnValueOnce(chainable([{ userId: 2 }]));

    const r = await matchMovie({
      movieData: { movieId: 99, page: 1 },
      choice: true,
    });
    expect(r.success && r.data.matched).toBe(true);
  });

  it("rejects invalid input", async () => {
    userMock.mockResolvedValue(ME);
    const r = await matchMovie({
      movieData: { movieId: "abc" as unknown as number, page: 1 },
      choice: true,
    });
    expect(r.success).toBe(false);
  });
});

describe("getLastMoviePage", () => {
  it("returns null when nothing recorded", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.select.mockReturnValueOnce(chainable([]));
    const r = await getLastMoviePage();
    expect(r.success && r.data.movie).toBeNull();
  });

  it("returns last seen movie", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.select.mockReturnValueOnce(
      chainable([{ id: 7, movieId: 555, page: 3 }]),
    );
    const r = await getLastMoviePage();
    expect(r.success && r.data.movie).toEqual({ id: 7, movieId: 555, page: 3 });
  });
});

describe("updateLastMovie", () => {
  it("persists swipe + last position atomically per call", async () => {
    userMock.mockResolvedValue(ME);
    dbMock.insert
      .mockReturnValueOnce(chainable([{ id: 100 }])) // upsert movie
      .mockReturnValueOnce(chainable(undefined)) // upsert swipe
      .mockReturnValueOnce(chainable(undefined)); // upsert last

    dbMock.select.mockReturnValueOnce(chainable([])); // no other likes

    const r = await updateLastMovie({
      movieData: { movieId: 99, page: 1 },
      choice: true,
    });
    expect(r.success && r.data.matched).toBe(false);
    expect(dbMock.insert).toHaveBeenCalledTimes(3);
  });
});
