import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { useSessionMock, signInMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signIn: (...args: unknown[]) => signInMock(...args),
}));

import ProtectedRoute from "@/components/ProtectedRoute";

describe("ProtectedRoute", () => {
  it("shows a loader while session is loading", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });
    render(
      <ProtectedRoute>
        <div>kids</div>
      </ProtectedRoute>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("kids")).not.toBeInTheDocument();
  });

  it("redirects to signIn when unauthenticated", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    render(
      <ProtectedRoute>
        <div>kids</div>
      </ProtectedRoute>,
    );
    expect(signInMock).toHaveBeenCalled();
  });

  it("renders children when authenticated", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "a@b.c" } },
      status: "authenticated",
    });
    render(
      <ProtectedRoute>
        <div>kids</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText("kids")).toBeInTheDocument();
  });
});
