import { redirect } from "next/navigation";
import Image from "next/image";

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

  if (!["RESIDENT", "BUSINESS", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    include: { driverProfile: true, profile: true },
    orderBy: { createdAt: "desc" }
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Drivers</h1>
          <p className="text-sm text-slate-600">View availability and delivery capacity across the driver fleet.</p>
        </div>
        <div className="decorative-image relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-driver.svg" alt="Drivers hero" fill className="object-cover" data-decorative />
        </div>
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
              {driver.profile?.phone && (
                <p>
                  <a href={`tel:${driver.profile.phone}`} className="text-slate-900 underline">
                    {driver.profile.phone}
                  </a>
                </p>
              )}
              <p>Vehicle: {driver.driverProfile?.vehicleType ?? "Unspecified"}</p>
              <p>Rating: {driver.driverProfile?.ratingAvg?.toFixed(1) ?? "5.0"}</p>
              <p>Completed jobs: {driver.driverProfile?.completedJobs ?? 0}</p>
              {driver.profile?.phone && (
                <a
                  href={`https://wa.me/${driver.profile.phone.replace(/\\D/g, "")}`}
                  className="text-sm font-semibold text-slate-900 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp driver
                </a>
              )}
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
