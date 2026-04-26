import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

const PROTECTED_PATHS = ["/", "/movie", "/notification", "/stats"];
const PUBLIC_API = ["/api/auth"];

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://image.tmdb.org"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://fcm.googleapis.com",
      "https://api.themoviedb.org",
      ...(isDev ? ["ws://localhost:*", "http://localhost:*"] : []),
    ],
    "frame-src": ["'self'", "https://*.auth0.com"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", "https://*.auth0.com"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit /api/* (NextAuth, server actions go through the action endpoint)
  if (pathname.startsWith("/api/") && !PUBLIC_API.some((p) => pathname.startsWith(p))) {
    const ip = getClientIp(req);
    const result = rateLimit(`api:${ip}:${pathname}`);
    if (!result.ok) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
  }

  // Auth gate for protected pages
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p)),
  );
  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL("/api/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // CSP with per-request nonce
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
