import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/server/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email }
          });

          if (!user) {
            return null;
          }

          const isValid = await bcrypt.compare(parsed.data.password, user.hashedPassword);
          if (!isValid) {
            return null;
          }

          const { hashedPassword, ...safeUser } = user;
          return safeUser;
        } catch (error) {
          console.error("Credentials sign-in failed. Check DATABASE_URL and database status.", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true }
        });
        token.role = dbUser?.role;
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
