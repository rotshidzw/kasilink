import { redirect } from "next/navigation";
import Image from "next/image";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ShopDashboard from "@/app/(app)/shop/shop-dashboard";
import { createOrder, createShop } from "@/app/(app)/shop/actions";

export default async function ShopPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "BUSINESS") {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      include: { products: { include: { inventory: true } } }
    });

    if (!shop) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Set up your spaza shop</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createShop} className="grid gap-3 md:grid-cols-2">
              <Input name="name" placeholder="Shop name" required />
              <Input name="phone" placeholder="Phone" required />
              <Input name="description" placeholder="Short description" required />
              <Input name="line1" placeholder="Street address" required />
              <Input name="city" placeholder="City" required />
              <div className="md:col-span-2">
                <Button type="submit">Create shop</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    }

    const products = shop.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      unit: product.unit,
      inventory: product.inventory
        ? { status: product.inventory.status, quantity: product.inventory.quantity }
        : null
    }));

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Shop dashboard</h1>
            <p className="text-sm text-slate-600">Manage products and stock updates for your store.</p>
          </div>
          <div className="relative h-40 w-full overflow-hidden rounded-2xl">
            <Image src="/brand/hero-business.svg" alt="Shop hero" fill className="object-cover" />
          </div>
        </div>
        <ShopDashboard
          shop={{ id: shop.id, name: shop.name, description: shop.description, city: shop.city }}
          products={products}
        />
      </div>
    );
  }

  const [shops, defaultAddress] = await Promise.all([
    prisma.shop.findMany({
      include: { products: { include: { inventory: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.address.findFirst({ where: { userId: session.user.id, isDefault: true } })
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Spaza marketplace</h1>
          <p className="text-sm text-slate-600">
            Browse local shops and place grocery orders for delivery.{" "}
            {!defaultAddress && "Add a default address to speed up checkout."}
          </p>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-resident.svg" alt="Marketplace hero" fill className="object-cover" />
        </div>
      </div>

      {shops.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No shops available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Check back later for nearby spaza listings.</p>
          </CardContent>
        </Card>
      )}

      {shops.map((shop) => (
        <Card key={shop.id}>
          <CardHeader>
            <CardTitle>{shop.name}</CardTitle>
            <p className="text-sm text-slate-600">{shop.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {shop.products.map((product) => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.description}</p>
                </div>
                <div className="text-sm font-semibold text-slate-900">R {Number(product.price).toFixed(2)}</div>
                <form action={createOrder} className="flex items-center gap-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <Input name="quantity" type="number" min={1} defaultValue={1} className="w-20" />
                  <Button type="submit" size="sm">
                    Order
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
