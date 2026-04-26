import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { pageSchema } from "@/lib/validation";

export const runtime = "nodejs";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`tmdb:${session.user.email}`, {
    windowMs: 60_000,
    max: 30,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page") ?? "1";
  const parsed = pageSchema.safeParse(pageParam);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid page parameter" },
      { status: 400 },
    );
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    logger.error("TMDB_API_KEY is not configured");
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(
      `${TMDB_BASE}/trending/movie/day?language=en-US&page=${parsed.data}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Cache trending feed for a minute server-side
        next: { revalidate: 60 },
      },
    );

    if (!upstream.ok) {
      logger.warn({ status: upstream.status }, "TMDB upstream non-OK");
      return NextResponse.json(
        { error: "Upstream error" },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "TMDB proxy failed");
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
