import { describe, expect, it } from "vitest";
import {
  newMovieSchema,
  notificationSchema,
  parseInput,
  swipeChoiceSchema,
  ValidationError,
  fcmTokenSchema,
  idListSchema,
} from "@/lib/validation";

describe("newMovieSchema", () => {
  it("accepts a valid movieId/page", () => {
    expect(parseInput(newMovieSchema, { movieId: 5, page: 1 })).toEqual({
      movieId: 5,
      page: 1,
    });
  });

  it("rejects negative ids", () => {
    expect(() => parseInput(newMovieSchema, { movieId: -1, page: 1 })).toThrow(
      ValidationError,
    );
  });

  it("rejects pages above 1000 (TMDB max)", () => {
    expect(() => parseInput(newMovieSchema, { movieId: 1, page: 9999 })).toThrow(
      ValidationError,
    );
  });

  it("coerces numeric strings", () => {
    expect(parseInput(newMovieSchema, { movieId: "5", page: "2" })).toEqual({
      movieId: 5,
      page: 2,
    });
  });
});

describe("swipeChoiceSchema", () => {
  it("requires a boolean choice", () => {
    expect(() =>
      parseInput(swipeChoiceSchema, {
        movieData: { movieId: 1, page: 1 },
        choice: "yes",
      }),
    ).toThrow(ValidationError);
  });
});

describe("notificationSchema", () => {
  it("rejects external links", () => {
    expect(() =>
      parseInput(notificationSchema, {
        title: "hi",
        message: "msg",
        link: "https://evil.com/path",
      }),
    ).toThrow(ValidationError);
  });

  it("rejects protocol-relative URLs", () => {
    expect(() =>
      parseInput(notificationSchema, {
        title: "hi",
        message: "msg",
        link: "//evil.com",
      }),
    ).toThrow(ValidationError);
  });

  it("accepts same-origin paths", () => {
    expect(
      parseInput(notificationSchema, { title: "t", message: "m", link: "/notification" }),
    ).toEqual({ title: "t", message: "m", link: "/notification" });
  });

  it("rejects oversized message", () => {
    expect(() =>
      parseInput(notificationSchema, {
        title: "t",
        message: "x".repeat(2000),
        link: "/",
      }),
    ).toThrow(ValidationError);
  });
});

describe("fcmTokenSchema", () => {
  it("rejects too-short tokens", () => {
    expect(() => parseInput(fcmTokenSchema, "short")).toThrow();
  });

  it("accepts long tokens", () => {
    expect(() => parseInput(fcmTokenSchema, "a".repeat(50))).not.toThrow();
  });
});

describe("idListSchema", () => {
  it("accepts a single id", () => {
    expect(parseInput(idListSchema, 4)).toBe(4);
  });

  it("accepts an array of ids", () => {
    expect(parseInput(idListSchema, [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("rejects empty arrays", () => {
    expect(() => parseInput(idListSchema, [])).toThrow();
  });
});

describe("ValidationError", () => {
  it("collects all issues", () => {
    try {
      parseInput(notificationSchema, {});
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const err = e as ValidationError;
      expect(err.issues.length).toBeGreaterThan(0);
    }
  });
});
