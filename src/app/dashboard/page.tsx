import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const [requestCount, openJobs] = await Promise.all([
    prisma.serviceRequest.count({ where: { residentId: session.user.id } }),
    prisma.deliveryJob.count({ where: { status: "OPEN" } })
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{session.user.email}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">Role: {role}</p>
        </CardContent>
      </Card>

      {role === "RESIDENT" && (
        <Card>
          <CardHeader>
            <CardTitle>My requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{requestCount} active requests submitted.</p>
          </CardContent>
        </Card>
      )}

      {role === "DRIVER" && (
        <Card>
          <CardHeader>
            <CardTitle>Open delivery jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{openJobs} jobs waiting for a driver.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
