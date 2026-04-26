import type { NotificationDto } from "@/backEnd/notification";

/**
 * Build the list of distinct senders from notifications, in insertion order.
 * The chart series adapt to whoever has actually sent something — no more
 * `anatholy`/`axelle` hardcoded.
 */
export function distinctSenders(notifications: NotificationDto[]): {
  email: string;
  name: string;
}[] {
  const seen = new Map<string, string>();
  for (const n of notifications) {
    if (!n.senderEmail) continue;
    if (!seen.has(n.senderEmail)) {
      seen.set(n.senderEmail, n.senderName?.trim() || n.senderEmail.split("@")[0]!);
    }
  }
  return Array.from(seen, ([email, name]) => ({ email, name }));
}

export function senderLabel(n: NotificationDto): string {
  return n.senderName?.trim() || n.senderEmail.split("@")[0] || "Unknown";
}
