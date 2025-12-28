import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { Role } from "@prisma/client";

import { prisma } from "@/server/db";

const credentialsSchema = z.object({
  email: z.string().email()
});

const demoRoleByEmail = new Map<string, Role>([
  ["resident@kasilink.local", Role.RESIDENT],
  ["youth@kasilink.local", Role.YOUTH],
  ["business@kasilink.local", Role.BUSINESS],
  ["admin@kasilink.local", Role.ADMIN]
]);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const role = demoRoleByEmail.get(parsed.data.email) ?? Role.RESIDENT;
          const user = await prisma.user.upsert({
            where: { email: parsed.data.email },
            update: {},
            create: {
              email: parsed.data.email,
              name: parsed.data.email.split("@")[0],
              role
            }
          });

          return user;
        } catch (error) {
          console.error("Credentials sign-in failed. Check DATABASE_URL and database status.", error);
          const fallbackRole = demoRoleByEmail.get(parsed.data.email) ?? Role.RESIDENT;
          return {
            id: `demo-${parsed.data.email}`,
            email: parsed.data.email,
            name: parsed.data.email.split("@")[0],
            role: fallbackRole
          };
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};

export const getServerAuthSession = () => getServerSession(authOptions);
