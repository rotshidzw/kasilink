import { redirect } from "next/navigation";
import { DeliveryJobStatus } from "@prisma/client";
import Image from "next/image";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { acceptJob, completeJob, updateJobStatus } from "@/app/(app)/driver/actions";

export default async function DriverPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DRIVER") {
    redirect("/dashboard");
  }

  const jobs = await prisma.deliveryJob.findMany({
    where: {
      OR: [{ status: DeliveryJobStatus.OPEN }, { driverId: session.user.id }]
    },
    include: {
      order: { include: { shop: true } },
      request: { include: { category: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Driver dispatch</h1>
          <p className="text-sm text-slate-600">Accept new delivery jobs and confirm OTP handoffs.</p>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-driver.svg" alt="Driver hero" fill className="object-cover" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery jobs</CardTitle>
          <Badge variant="secondary">{jobs.length} jobs</Badge>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-600">No delivery jobs available right now.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {job.order ? `Order from ${job.order.shop.name}` : job.request?.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {job.order ? job.order.shop.city : job.request?.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.status === "OPEN" ? "default" : "secondary"}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.order ? job.order.shop.line1 : job.request?.category.name}</TableCell>
                    <TableCell>
                      {job.status === "OPEN" && (
                        <form action={acceptJob}>
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button size="sm" type="submit">
                            Accept job
                          </Button>
                        </form>
                      )}
                      {job.status !== "OPEN" && job.driverId === session.user.id && (
                        <div className="space-y-2">
                          <form action={updateJobStatus} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="status" value="PICKED_UP" />
                            <Button size="sm" type="submit" variant="outline">
                              Picked up
                            </Button>
                          </form>
                          <form action={updateJobStatus} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="status" value="EN_ROUTE" />
                            <Button size="sm" type="submit" variant="outline">
                              En route
                            </Button>
                          </form>
                          <form action={completeJob} className="flex items-center gap-2">
                            <input type="hidden" name="jobId" value={job.id} />
                            <Input name="otpCode" placeholder="OTP" className="w-24" />
                            <Button size="sm" type="submit">
                              Mark delivered
                            </Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.1fr,0.9fr] md:items-center">
          <div className="space-y-2 text-sm text-slate-600">
            <p>Live tracking is coming soon. Use this route preview to plan your next delivery stops.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>View pickup points and drop-offs.</li>
              <li>Update statuses as you move.</li>
              <li>Share progress with residents.</li>
            </ul>
            <div className="mt-4 space-y-2">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs text-slate-500">
                    {job.order ? job.order.shop.name : job.request?.title}
                  </span>
                  <Badge variant="secondary">{job.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-48 w-full">
            <Image src="/illustrations/map-placeholder.svg" alt="Map preview" fill className="object-cover" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
