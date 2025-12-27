"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@/server/api/root";

export const api = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export const trpcClient = api.createClient({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error)
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`
    })
  ]
});
