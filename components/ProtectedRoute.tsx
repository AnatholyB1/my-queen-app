"use client";

import { LoaderCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <LoaderCircle className="w-full h-screen p-16 flex items-center justify-center animate-spin" />
    );
  }

  return <>{session ? children : null}</>;
};

export default ProtectedRoute;
