"use client";

import { useSession } from "next-auth/react";

import { api } from "@/app/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const myRequests = api.request.listMine.useQuery(undefined, {
    enabled: role === "RESIDENT"
  });

  const openRequests = api.request.listOpen.useQuery(undefined, {
    enabled: role === "YOUTH" || role === "BUSINESS"
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Role overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{session?.user?.email ?? "Guest"}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">Role: {role ?? "None"}</p>
        </CardContent>
      </Card>

      {role === "RESIDENT" && (
        <Card>
          <CardHeader>
            <CardTitle>My request progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {myRequests.data?.length ?? 0} requests submitted.
            </p>
          </CardContent>
        </Card>
      )}

      {(role === "YOUTH" || role === "BUSINESS") && (
        <Card>
          <CardHeader>
            <CardTitle>Open requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {openRequests.data?.length ?? 0} open requests available to claim.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
