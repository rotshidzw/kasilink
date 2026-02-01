import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BusinessDashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  const store = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
    include: {
      products: { include: { inventory: true } },
      orders: { include: { resident: true }, take: 5 }
    }
  });

  const requests = await prisma.serviceRequest.findMany({
    where: { assignedBusinessId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const shops = isAdmin
    ? await prisma.shop.findMany({
        include: { owner: true, products: true },
        orderBy: { createdAt: "desc" },
        take: 6
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <Badge variant="secondary">Business hub</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Spaza operations</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track incoming requests, update your catalog, and keep your store profile fresh.
          </p>
          {!isAdmin && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/business/store" className={buttonVariants()}>
                Store profile
              </Link>
              <Link href="/business/products" className={buttonVariants({ variant: "outline" })}>
                Manage products
              </Link>
            </div>
          )}
        </div>
        <div className="decorative-image relative h-44 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-business.svg" alt="Business hero" fill className="object-cover" data-decorative />
        </div>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent businesses</CardTitle>
            <Badge variant="secondary">{shops.length}</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shops.length === 0 && <p className="text-sm text-slate-600">No businesses yet.</p>}
            {shops.map((shop) => (
              <div key={shop.id} className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                <p className="text-base font-semibold text-slate-900">{shop.name}</p>
                <p>{shop.city}</p>
                <p className="text-xs text-slate-500">{shop.owner.email}</p>
                <p className="mt-2 text-xs text-slate-500">{shop.products.length} products</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Store profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {store ? (
                  <>
                    <p className="text-base font-semibold text-slate-900">{store.name}</p>
                    <p>{store.city}</p>
                    <p>{store.phone ?? "No phone listed"}</p>
                  </>
                ) : (
                  <p>No store profile yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p className="text-2xl font-semibold text-slate-900">{store?.products.length ?? 0}</p>
                <p>Products listed</p>
                <p>{store?.products.filter((product) => product.inventory?.status === "LOW").length ?? 0} low stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {store?.orders.length ? (
                  store.orders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{order.resident.email}</p>
                      <p className="text-xs text-slate-500">R {Number(order.total).toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p>No orders yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned service requests</CardTitle>
              <Badge variant="secondary">{requests.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 && <p className="text-sm text-slate-600">No assigned requests yet.</p>}
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{request.title}</p>
                  <p className="text-xs text-slate-500">{request.address}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
