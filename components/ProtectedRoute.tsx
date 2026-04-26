"use client";

import { LoaderCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("auth0", { callbackUrl: window.location.href });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Chargement de la session"
        className="w-full h-screen flex items-center justify-center"
      >
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated" || !session) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
