import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { useSessionMock, sendNotificationMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  sendNotificationMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));
vi.mock("@/backEnd/firebaseNotification", () => ({
  sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ButtonChoice } from "@/components/ButtonChoice";
import { toast } from "sonner";

const buttonData = [
  { text: "Hi", title: "Hi", short: "hi", message: "Hello", link: "/" },
];

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("ButtonChoice", () => {
  it("shows a loader while session loads", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });
    renderWithClient(<ButtonChoice buttonData={buttonData} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders nothing when unauthenticated", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = renderWithClient(<ButtonChoice buttonData={buttonData} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sends a notification when an action button is clicked", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "u@e.com" } },
      status: "authenticated",
    });
    sendNotificationMock.mockResolvedValue({ success: true, data: { id: 1 } });
    renderWithClient(<ButtonChoice buttonData={buttonData} />);

    const btn = await screen.findByRole("button", { name: /hi/i });
    await userEvent.click(btn);
    expect(sendNotificationMock).toHaveBeenCalledWith({
      title: "Hi",
      message: "Hello",
      link: "/",
    });
  });

  it("surfaces an error toast when the server returns failure", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "u@e.com" } },
      status: "authenticated",
    });
    sendNotificationMock.mockResolvedValue({
      success: false,
      error: { code: "INTERNAL", message: "boom" },
    });
    renderWithClient(<ButtonChoice buttonData={buttonData} />);
    const btn = await screen.findByRole("button", { name: /hi/i });
    await userEvent.click(btn);
    // wait for the mutation onSuccess
    await new Promise((r) => setTimeout(r, 0));
    expect(toast.error).toHaveBeenCalled();
  });
});
