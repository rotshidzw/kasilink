import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter } from "@/server/api/routers/admin";
import { eventRouter } from "@/server/api/routers/event";
import { requestRouter } from "@/server/api/routers/request";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  event: eventRouter,
  request: requestRouter
});

export type AppRouter = typeof appRouter;
