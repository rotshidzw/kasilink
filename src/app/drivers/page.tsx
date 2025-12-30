import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DriversPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    include: { driverProfile: true },
    orderBy: { createdAt: "desc" }
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Drivers</h1>
        <p className="text-sm text-slate-600">View availability and delivery capacity across the driver fleet.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{driver.name ?? driver.email}</CardTitle>
              <Badge variant={driver.driverProfile?.isAvailable ? "secondary" : "outline"}>
                {driver.driverProfile?.isAvailable ? "Available" : "Offline"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{driver.email}</p>
              <p>Vehicle: {driver.driverProfile?.vehicleType ?? "Unspecified"}</p>
              <p>Rating: {driver.driverProfile?.ratingAvg?.toFixed(1) ?? "5.0"}</p>
              <p>Completed jobs: {driver.driverProfile?.completedJobs ?? 0}</p>
              {isAdmin && (
                <form action={`/api/drivers/${driver.id}/availability`} method="post">
                  <input type="hidden" name="isAvailable" value={(!driver.driverProfile?.isAvailable).toString()} />
                  <Button type="submit" variant="outline" size="sm">
                    {driver.driverProfile?.isAvailable ? "Set offline" : "Set available"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
