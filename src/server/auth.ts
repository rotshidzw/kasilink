import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/server/db";
import { Role } from "@prisma/client"; // ✅ add this

const credentialsSchema = z.object({
  email: z.string().email(),
});

// ✅ make it Role, not string
const demoRoleByEmail = new Map<string, Role>([
  ["resident@kasilink.local", Role.RESIDENT],
  ["youth@kasilink.local", Role.YOUTH],
  ["business@kasilink.local", Role.BUSINESS],
  ["admin@kasilink.local", Role.ADMIN],
]);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          // ✅ role is Role enum now
          const role = demoRoleByEmail.get(parsed.data.email) ?? Role.RESIDENT;

          const user = await prisma.user.upsert({
            where: { email: parsed.data.email },
            update: {},
            create: {
              email: parsed.data.email,
              name: parsed.data.email.split("@")[0],
              role, // ✅ Role enum value
            },
          });

          return user;
        } catch (error) {
          console.error(
            "Credentials sign-in failed. Check DATABASE_URL and database status.",
            error,
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // ✅ will be typed after module augmentation (next step)
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role; // ✅ cleaner
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
