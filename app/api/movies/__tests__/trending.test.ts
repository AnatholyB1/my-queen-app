/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
vi.mock("next-auth/next", () => ({
  getServerSession: () => getServerSessionMock(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { _resetRateLimit } from "@/lib/rateLimit";
import { GET } from "@/app/api/movies/trending/route";

afterEach(() => {
  _resetRateLimit();
  vi.restoreAllMocks();
});

function makeReq(url = "http://localhost/api/movies/trending?page=1") {
  return new Request(url);
}

describe("GET /api/movies/trending", () => {
  it("returns 401 when no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid page", async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: "a@b.c" } });
    const res = await GET(makeReq("http://localhost/api/movies/trending?page=-3"));
    expect(res.status).toBe(400);
  });

  it("proxies upstream JSON when valid", async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: "a@b.c" } });
    process.env.TMDB_API_KEY = "fake-key";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ page: 1, results: [], total_pages: 1 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body).toEqual({ page: 1, results: [], total_pages: 1 });
  });

  it("rate-limits aggressive callers", async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: "a@b.c" } });
    process.env.TMDB_API_KEY = "fake-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    let last: Response | undefined;
    for (let i = 0; i < 35; i++) {
      last = await GET(makeReq());
    }
    expect(last?.status).toBe(429);
  });
});
