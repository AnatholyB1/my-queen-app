import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET ??= "test-secret-test-secret-test-secret";
process.env.AUTH0_CLIENT_ID ??= "test";
process.env.AUTH0_CLIENT_SECRET ??= "test";
process.env.AUTH0_ISSUER ??= "https://example.auth0.com";
process.env.TMDB_API_KEY ??= "test-tmdb-key";
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, "NODE_ENV", {
    value: "test",
    writable: true,
  });
}

// jsdom doesn't implement matchMedia — embla-carousel needs it.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// IntersectionObserver shim for embla-carousel + framer-motion under jsdom.
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}
if (typeof window !== "undefined" && !window.IntersectionObserver) {
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: IOStub,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    value: IOStub,
  });
}

// ResizeObserver shim for recharts.
class ROStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== "undefined" && !window.ResizeObserver) {
  Object.defineProperty(window, "ResizeObserver", { writable: true, value: ROStub });
  Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: ROStub });
}
