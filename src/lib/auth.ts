import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "./prisma";

export const authOptions: AuthOptions = {
  providers: [
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string | unknown }).id = token.id;
      }
      return session;
    }
  }
};
