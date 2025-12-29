import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateJobStatus, updateOrderStatus, updateRequestStatus } from "@/app/admin/actions";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const [requestCount, orderCount, jobCount, userCount] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.order.count(),
    prisma.deliveryJob.count(),
    prisma.user.count()
  ]);

  const [requests, orders, jobs] = await Promise.all([
    prisma.serviceRequest.findMany({
      include: { resident: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.order.findMany({
      include: { resident: true, shop: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.deliveryJob.findMany({
      include: { driver: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin control center</h1>
        <p className="text-sm text-slate-600">Monitor service delivery, orders, and dispatch status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Requests", value: requestCount },
          { label: "Orders", value: orderCount },
          { label: "Jobs", value: jobCount },
          { label: "Users", value: userCount }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent service requests</CardTitle>
          <Badge variant="secondary">{requests.length} shown</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{request.title}</div>
                    <div className="text-xs text-slate-500">{request.category.name}</div>
                  </TableCell>
                  <TableCell>{request.resident.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{request.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={updateRequestStatus} className="flex items-center gap-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <select
                        name="status"
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        defaultValue={request.status}
                      >
                        {["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs font-semibold text-slate-900">Save</button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Badge variant="secondary">{orders.length} shown</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{order.resident.email}</div>
                    <div className="text-xs text-slate-500">R {Number(order.total).toFixed(2)}</div>
                  </TableCell>
                  <TableCell>{order.shop.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={updateOrderStatus} className="flex items-center gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <select
                        name="status"
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        defaultValue={order.status}
                      >
                        {["PENDING", "CONFIRMED", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map(
                          (status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          )
                        )}
                      </select>
                      <button className="text-xs font-semibold text-slate-900">Save</button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery jobs</CardTitle>
          <Badge variant="secondary">{jobs.length} shown</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-slate-900">{job.orderId ?? job.requestId}</TableCell>
                  <TableCell>{job.driver?.email ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={updateJobStatus} className="flex items-center gap-2">
                      <input type="hidden" name="jobId" value={job.id} />
                      <select
                        name="status"
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        defaultValue={job.status}
                      >
                        {["OPEN", "ASSIGNED", "PICKED_UP", "DELIVERED", "CANCELLED"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs font-semibold text-slate-900">Save</button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
