import { z } from "zod";

import { createTRPCRouter, protectedProcedure, roleProcedure } from "@/server/api/trpc";

const createRequestSchema = z.object({
  type: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(5)
});

const updateStatusSchema = z.object({
  requestId: z.string().cuid(),
  status: z.enum(["NEW", "CLAIMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
});

export const requestRouter = createTRPCRouter({
  create: roleProcedure(["RESIDENT"]).input(createRequestSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.serviceRequest.create({
      data: {
        ...input,
        residentId: ctx.session.user.id
      }
    });
  }),
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.serviceRequest.findMany({
      where: { residentId: ctx.session.user.id },
      orderBy: { createdAt: "desc" }
    });
  }),
  listOpen: roleProcedure(["YOUTH", "BUSINESS"]).query(async ({ ctx }) => {
    return ctx.prisma.serviceRequest.findMany({
      where: { status: "NEW" },
      include: { resident: true },
      orderBy: { createdAt: "desc" }
    });
  }),
  claim: roleProcedure(["YOUTH", "BUSINESS"]).input(z.object({ requestId: z.string().cuid() })).mutation(
    async ({ ctx, input }) => {
      return ctx.prisma.serviceRequest.update({
        where: { id: input.requestId },
        data: {
          status: "CLAIMED",
          claimedById: ctx.session.user.id
        }
      });
    }
  ),
  updateStatus: roleProcedure(["YOUTH", "BUSINESS"]).input(updateStatusSchema).mutation(
    async ({ ctx, input }) => {
      return ctx.prisma.serviceRequest.update({
        where: { id: input.requestId },
        data: {
          status: input.status
        }
      });
    }
  )
});
