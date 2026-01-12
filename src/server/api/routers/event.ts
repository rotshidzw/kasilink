import { z } from "zod";

import { createTRPCRouter, protectedProcedure, roleProcedure } from "@/server/api/trpc";

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(3),
  startsAt: z.string().datetime()
});

export const eventRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.event.findMany({
      include: { rsvps: true },
      orderBy: { startsAt: "asc" }
    });
  }),
  create: roleProcedure(["ADMIN"]).input(createEventSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt: new Date(input.startsAt),
        organizerId: ctx.session.user.id
      }
    });
  }),
  rsvp: protectedProcedure.input(z.object({ eventId: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    return ctx.prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId: input.eventId,
          userId: ctx.session.user.id
        }
      },
      update: {},
      create: {
        eventId: input.eventId,
        userId: ctx.session.user.id
      }
    });
  }),
  addProof: roleProcedure(["ADMIN"]).input(z.object({ eventId: z.string().cuid(), proofImageUrl: z.string().url() })).mutation(
    async ({ ctx, input }) => {
      return ctx.prisma.event.update({
        where: { id: input.eventId },
        data: { proofImageUrl: input.proofImageUrl }
      });
    }
  )
});
