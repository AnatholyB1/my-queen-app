import { describe, expect, it } from "vitest";
import { distinctSenders, senderLabel } from "@/components/ui/chart/chartUtils";
import type { NotificationDto } from "@/backEnd/notification";

const make = (over: Partial<NotificationDto>): NotificationDto => ({
  id: 1,
  senderId: 1,
  senderEmail: "a@b.c",
  senderName: "A",
  title: "Don't ignore me",
  message: "x",
  link: "/",
  read: false,
  timestamp: "2025-01-01T00:00:00Z",
  ...over,
});

describe("distinctSenders", () => {
  it("returns unique senders preserving order", () => {
    const senders = distinctSenders([
      make({ senderEmail: "a@b.c", senderName: "A" }),
      make({ senderEmail: "b@b.c", senderName: "B" }),
      make({ senderEmail: "a@b.c", senderName: "A" }),
    ]);
    expect(senders).toEqual([
      { email: "a@b.c", name: "A" },
      { email: "b@b.c", name: "B" },
    ]);
  });

  it("falls back to email prefix when name missing", () => {
    const senders = distinctSenders([
      make({ senderEmail: "claude@anthropic.com", senderName: null }),
    ]);
    expect(senders[0].name).toBe("claude");
  });

  it("ignores entries with no senderEmail", () => {
    const senders = distinctSenders([
      make({ senderEmail: "", senderName: null }),
    ]);
    expect(senders).toEqual([]);
  });
});

describe("senderLabel", () => {
  it("uses name when present", () => {
    expect(senderLabel(make({ senderName: "X" }))).toBe("X");
  });
  it("falls back to email prefix", () => {
    expect(senderLabel(make({ senderName: null, senderEmail: "x@y.z" }))).toBe("x");
  });
});
