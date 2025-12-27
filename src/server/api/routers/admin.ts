import { createTRPCRouter, roleProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  stats: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    const [totalRequests, completedRequests, users, events, rsvps] = await Promise.all([
      ctx.prisma.serviceRequest.count(),
      ctx.prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
      ctx.prisma.user.count(),
      ctx.prisma.event.count(),
      ctx.prisma.rSVP.count()
    ]);

    return {
      totalRequests,
      completedRequests,
      users,
      events,
      rsvps
    };
  })
});
