import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "./prisma";
import { isDemoMode } from "./demo";
import { PUBLIC_DEMO_SESSION_SECRET, PUBLIC_DEMO_USER } from "./demo-user";

export const authOptions: AuthOptions = {
  // This public signing key is only used when the app has no database or is
  // explicitly isolated in demo mode. Demo sessions can access fictional data
  // only, and every mutation is rejected by the API.
  secret: process.env.NEXTAUTH_SECRET || (isDemoMode() ? PUBLIC_DEMO_SESSION_SECRET : undefined),
  providers: [
    CredentialsProvider({
      id: "demo-guest",
      name: "Public demo guest",
      credentials: {},
      async authorize() {
        if (!isDemoMode()) return null;

        return {
          ...PUBLIC_DEMO_USER,
          isDemo: true,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@rentflow.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        if (!process.env.DATABASE_URL || isDemoMode()) {
          throw new Error("Use guest access to explore the public demo.");
        }

        const landlord = await prisma.landlord.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!landlord || !landlord.password) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(credentials.password, landlord.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: landlord.id,
          email: landlord.email,
          name: landlord.name
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isDemo = Boolean((user as typeof user & { isDemo?: boolean }).isDemo);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string | unknown }).id = token.id;
        (session.user as { isDemo?: boolean }).isDemo = Boolean(token.isDemo);
      }
      return session;
    }
  }
};
