import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";

export const createContext = async () => {
  const session = await getServerAuthSession();
  return { session, prisma };
};

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  }
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      prisma: ctx.prisma
    }
  });
});

export const requireRole = (roles: string[]) =>
  t.middleware(({ ctx, next }) => {
    const role = ctx.session?.user?.role;
    if (!role || !roles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });

export const roleProcedure = (roles: string[]) =>
  protectedProcedure.use(requireRole(roles));

export const paginationSchema = z.object({
  take: z.number().min(1).max(50).default(20),
  skip: z.number().min(0).default(0)
});
