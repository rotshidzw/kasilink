import Image from "next/image";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductCreateForm, ProductRowActions } from "@/app/business/products/product-forms";

export const dynamic = "force-dynamic";

export default async function BusinessProductsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const store = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
    include: { products: { include: { inventory: true } }, orders: { include: { resident: true }, take: 5 } }
  });

  const requests = await prisma.serviceRequest.findMany({
    where: { assignedBusinessId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  if (!store) {
    redirect("/business/store");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products & inventory</h1>
          <p className="text-sm text-slate-600">Manage your catalog, pricing, and stock status.</p>
        </div>
        <div className="relative h-40 w-full">
          <Image src="/illustrations/shop-owner.svg" alt="Store illustration" fill className="object-cover" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Catalog</CardTitle>
          <Badge variant="secondary">{store.products.length} items</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.description}</div>
                  </TableCell>
                  <TableCell>R {Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.inventory?.status === "OUT_OF_STOCK" ? "outline" : "secondary"}>
                      {product.inventory?.status ?? "IN_STOCK"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      product={{
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        unit: product.unit,
                        price: Number(product.price)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incoming orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {store.orders.length === 0 && <p className="text-sm text-slate-600">No orders yet.</p>}
            {store.orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{order.resident.email}</p>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">Total: R {Number(order.total).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotions & requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
              Promotion: Free delivery on orders over R300 this week.
            </div>
            {requests.length === 0 && <p className="text-sm text-slate-600">No assigned service requests.</p>}
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{request.title}</p>
                <p className="text-xs text-slate-500">{request.address}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
