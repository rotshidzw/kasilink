import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  assignDriver,
  createCategory,
  toggleProductActive,
  updateJobStatus,
  updateOrderStatus,
  updateRequestStatus
} from "@/app/admin/actions";

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

  const [requests, orders, jobs, users, stores, drivers, categories, products] = await Promise.all([
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
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.shop.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { owner: true } }),
    prisma.user.findMany({ where: { role: "DRIVER" }, orderBy: { createdAt: "desc" } }),
    prisma.serviceCategory.findMany({ orderBy: { name: "asc" }, take: 5 }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { shop: true } })
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
                        {[
                          "DRAFT",
                          "SUBMITTED",
                          "MATCHED",
                          "ACCEPTED",
                          "PICKED_UP",
                          "EN_ROUTE",
                          "DELIVERED",
                          "COMPLETED",
                          "CANCELLED",
                          "REJECTED"
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs font-semibold text-slate-900">Save</button>
                    </form>
                    <form action={assignDriver} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <select
                        name="driverId"
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        defaultValue=""
                      >
                        <option value="">Assign driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.email}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs font-semibold text-slate-900">Assign</button>
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
                        {["OPEN", "ASSIGNED", "EN_ROUTE", "PICKED_UP", "DELIVERED", "CANCELLED"].map((status) => (
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

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent users</CardTitle>
            <Badge variant="secondary">{users.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stores</CardTitle>
            <Badge variant="secondary">{stores.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>{store.name}</TableCell>
                    <TableCell>{store.city}</TableCell>
                    <TableCell>{store.owner?.email ?? store.ownerId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service categories</CardTitle>
            <Badge variant="secondary">{categories.length} shown</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createCategory} className="grid gap-2 md:grid-cols-2">
              <input
                name="name"
                placeholder="Category name"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <input
                name="description"
                placeholder="Description"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:col-span-2">
                Add category
              </button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products</CardTitle>
            <Badge variant="secondary">{products.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.shop.name}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "secondary" : "outline"}>
                        {product.isActive ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={toggleProductActive} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
                        <button className="text-xs font-semibold text-slate-900">
                          {product.isActive ? "Pause" : "Activate"}
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
