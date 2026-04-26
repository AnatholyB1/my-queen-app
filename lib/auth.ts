import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import Auth0Provider from "next-auth/providers/auth0";

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
      issuer: process.env.AUTH0_ISSUER,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.sub && !token.sub) token.sub = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as Session["user"] & { id: string }).id = token.sub;
      }
      return session;
    },
  },
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Returns the authenticated user or throws UnauthorizedError.
 * Use in every server action that touches user data.
 */
export async function requireUser(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    throw new UnauthorizedError();
  }
  const id =
    (session?.user as (Session["user"] & { id?: string }) | undefined)?.id ??
    email;
  return {
    id,
    email,
    name: session?.user?.name ?? null,
  };
}

export async function getOptionalUser(): Promise<AuthUser | null> {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}
