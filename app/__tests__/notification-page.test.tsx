import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushMock, markReadMock, useFcmTokenMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  markReadMock: vi.fn(),
  useFcmTokenMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/hooks/useFcmToken", () => ({
  useFcmToken: () => useFcmTokenMock(),
}));

import NotificationPage from "@/app/notification/page";

describe("NotificationPage", () => {
  it("shows an empty state when no notifications", () => {
    useFcmTokenMock.mockReturnValue({
      notifications: [],
      markRead: markReadMock,
    });
    render(<NotificationPage />);
    expect(screen.getByText(/aucune nouvelle notification/i)).toBeInTheDocument();
  });

  it("renders a notification and marks it read on click", async () => {
    useFcmTokenMock.mockReturnValue({
      notifications: [
        {
          id: 1,
          senderId: 2,
          senderEmail: "a@b.c",
          senderName: "A",
          title: "Hello",
          message: "World",
          link: "/notification",
          read: false,
          timestamp: "2025-01-01T12:00:00Z",
        },
      ],
      markRead: markReadMock,
    });
    render(<NotificationPage />);
    const item = await screen.findByRole("button", { name: /hello/i });
    await userEvent.click(item);
    expect(markReadMock).toHaveBeenCalledWith(1);
    expect(pushMock).toHaveBeenCalledWith("/notification");
  });

  it("does not navigate to external links", async () => {
    useFcmTokenMock.mockReturnValue({
      notifications: [
        {
          id: 1,
          senderId: 2,
          senderEmail: "a@b.c",
          senderName: "A",
          title: "Hi",
          message: "evil",
          link: "https://evil.com",
          read: false,
          timestamp: "2025-01-01T12:00:00Z",
        },
      ],
      markRead: markReadMock,
    });
    render(<NotificationPage />);
    const item = await screen.findByRole("button", { name: /hi/i });
    await userEvent.click(item);
    expect(markReadMock).toHaveBeenCalledWith(1);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clears all unread notifications via the trash button", async () => {
    useFcmTokenMock.mockReturnValue({
      notifications: [
        {
          id: 1,
          senderId: 2,
          senderEmail: "a@b.c",
          senderName: "A",
          title: "x",
          message: "y",
          link: "/",
          read: false,
          timestamp: "2025-01-01T12:00:00Z",
        },
        {
          id: 2,
          senderId: 2,
          senderEmail: "a@b.c",
          senderName: "A",
          title: "x",
          message: "y",
          link: "/",
          read: false,
          timestamp: "2025-01-01T12:00:00Z",
        },
      ],
      markRead: markReadMock,
    });
    render(<NotificationPage />);
    const clearAll = screen.getByRole("button", {
      name: /marquer toutes comme lues/i,
    });
    await userEvent.click(clearAll);
    expect(markReadMock).toHaveBeenCalledWith([1, 2]);
  });
});
