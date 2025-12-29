import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { acceptJob, completeJob } from "@/app/driver/actions";

export default async function DriverPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const jobs = await prisma.deliveryJob.findMany({
    where: {
      OR: [{ status: "OPEN" }, { driverId: session.user.id }]
    },
    include: {
      order: { include: { shop: true } },
      request: { include: { category: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Driver dispatch</h1>
        <p className="text-sm text-slate-600">Accept new delivery jobs and confirm OTP handoffs.</p>
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
                        <form action={completeJob} className="flex items-center gap-2">
                          <input type="hidden" name="jobId" value={job.id} />
                          <Input name="otpCode" placeholder="OTP" className="w-24" />
                          <Button size="sm" type="submit">
                            Mark delivered
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
