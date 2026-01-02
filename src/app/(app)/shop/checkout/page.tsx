import { redirect } from "next/navigation";
import Image from "next/image";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams?: { orderId?: string };
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const orderId = searchParams?.orderId;
  if (!orderId) {
    redirect("/shop");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: true,
      items: { include: { product: true } },
      deliveryJob: { include: { driver: true } }
    }
  });

  if (!order || order.residentId !== session.user.id) {
    redirect("/shop");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-600">Review your order, confirm delivery, and complete payment.</p>
        </div>
        <div className="decorative-image relative h-32 w-full overflow-hidden rounded-2xl">
          <Image src="/illustrations/hero-community.svg" alt="Checkout" fill className="object-cover" data-decorative />
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase text-slate-400">Shop</p>
              <p className="text-base font-semibold text-slate-900">{order.shop.name}</p>
              <p className="text-xs text-slate-500">{order.shop.city}</p>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">R {Number(item.price).toFixed(2)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Total</p>
              <p className="text-lg font-semibold text-slate-900">R {Number(order.total).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demo payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>Payment is simulated for now. Tap confirm to finalize the demo checkout.</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                Card ending 4242 · Demo mode
              </div>
              <Button className="w-full" disabled>
                Confirm payment (demo)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p className="text-xs uppercase text-slate-400">Status</p>
              <p className="text-base font-semibold text-slate-900">{order.status}</p>
              <p className="text-xs text-slate-500">OTP: {order.deliveryJob?.otpCode ?? "Pending"}</p>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-400">Delivery partner</p>
                <p className="text-sm font-semibold text-slate-900">
                  {order.deliveryJob?.driver?.name ?? order.deliveryJob?.driver?.email ?? "Assigning a driver"}
                </p>
                <p className="text-xs text-slate-500">Verified KasiLink delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
