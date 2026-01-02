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
          <div className="decorative-image relative h-40 w-full overflow-hidden rounded-2xl">
            <Image src="/brand/hero-business.svg" alt="Shop hero" fill className="object-cover" data-decorative />
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

  const serviceHighlights = [
    {
      title: "Handyman support",
      description: "Plumbing, carpentry, and repairs from vetted KasiLink helpers.",
      cta: "Request a handyman",
      href: "/requests/new"
    },
    {
      title: "Gas & water delivery",
      description: "Get gas cylinder swaps and water drums delivered safely.",
      cta: "Start a service request",
      href: "/requests/new"
    },
    {
      title: "Bulk grocery restock",
      description: "Schedule monthly staples and track delivery status live.",
      cta: "View restock days",
      href: "/events"
    }
  ];

  const handymanProfiles = [
    {
      name: "Sizwe Dlamini",
      role: "Electrician",
      experience: "12 yrs · Certified",
      specialty: "Wiring, prepaid meters, solar installs",
      rating: "4.9"
    },
    {
      name: "Nomsa Khumalo",
      role: "Plumber",
      experience: "9 yrs · Verified",
      specialty: "Leaks, geysers, bathroom fittings",
      rating: "4.8"
    },
    {
      name: "Thabo Molefe",
      role: "Builder",
      experience: "15 yrs · Verified",
      specialty: "Brickwork, paving, extensions",
      rating: "5.0"
    }
  ];

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
        <div className="decorative-image relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-resident.svg" alt="Marketplace hero" fill className="object-cover" data-decorative />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {serviceHighlights.map((service) => (
          <Card key={service.title} className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">{service.title}</CardTitle>
              <p className="text-sm text-slate-600">{service.description}</p>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <a href={service.href}>{service.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

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
              <div
                key={product.id}
                className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-[120px,1fr,auto]"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-md bg-slate-100">
                  <Image
                    src="/illustrations/shop-owner.svg"
                    alt={`${product.name} preview`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    {product.inventory?.status === "OUT_OF_STOCK" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Out of stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        In stock · {product.inventory?.quantity ?? 0} left
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{product.description}</p>
                  <p className="text-sm font-semibold text-slate-900">R {Number(product.price).toFixed(2)}</p>
                </div>
                <form action={createOrder} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <Input name="quantity" type="number" min={1} defaultValue={1} className="w-20" />
                  <Button type="submit" size="sm">
                    Order now
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <section className="grid gap-4 lg:grid-cols-3">
        {handymanProfiles.map((profile) => (
          <Card key={profile.name}>
            <CardHeader>
              <CardTitle className="text-base">{profile.name}</CardTitle>
              <p className="text-xs text-slate-500">{profile.role}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{profile.experience}</p>
              <p>{profile.specialty}</p>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Verified KasiLink Pro
                </span>
                <span className="text-xs font-semibold text-emerald-700">★ {profile.rating}</span>
              </div>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <a href="/requests/new">Request this helper</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle>Verified workers, zero scams</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-900">
          Every helper is verified by the call center. You can see their role, professionalism level, and track your
          order or service request from start to finish.
        </CardContent>
      </Card>
    </div>
  );
}
