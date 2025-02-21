"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();


  useEffect(() => {
    if (status === "unauthenticated") {
      signIn()
    }
  }, [status]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return <>{session ? children : null}</>;
};

export default ProtectedRoute;