import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Calendar, ClipboardList, Heart, Store, Ticket, Truck } from "lucide-react";
import { DeliveryJobStatus } from "@prisma/client";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  const [requests, announcements, shops, openJobs, favorites, reorders, wallet] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { residentId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 3 }),
    prisma.shop.findMany({ orderBy: { name: "asc" }, take: 3 }),
    prisma.deliveryJob.count({ where: { status: DeliveryJobStatus.OPEN } }),
    prisma.favorite.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.orderHistory.findMany({
      where: { userId: session.user.id },
      include: { request: true },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } })
  ]);

  if (role === "RESIDENT") {
    return (
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="overflow-hidden">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr,200px] md:items-center">
              <div>
                <Badge variant="secondary">Resident dashboard</Badge>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900">Welcome back, {session.user.name ?? "Resident"}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Track service requests, upcoming restock days, and new community announcements.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/requests/new" className={buttonVariants()}>
                    Create request
                  </Link>
                  <Link href="/events" className={cn(buttonVariants({ variant: "outline" }))}>
                    View restock days
                  </Link>
                </div>
              </div>
              <div className="relative h-40 w-full">
                <Image src="/illustrations/resident.svg" alt="Resident illustration" fill className="object-cover" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {[
              { label: "Open requests", value: requests.length, icon: ClipboardList },
              { label: "Restock alerts", value: announcements.length, icon: Calendar },
              { label: "Nearby stores", value: shops.length, icon: Store }
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-full bg-slate-100 p-3 text-slate-900">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">{stat.label}</p>
                    <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Request history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requests.length === 0 && <p className="text-sm text-slate-600">No requests yet.</p>}
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{request.title}</p>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{request.address}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                    <p className="text-xs text-slate-500">{announcement.body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {favorites.length === 0 && <p className="text-sm text-slate-600">No favorites saved yet.</p>}
              {favorites.map((favorite) => (
                <div key={favorite.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{favorite.label}</p>
                  <p className="text-xs text-slate-500">{favorite.type}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600">Wallet balance</p>
              <p className="text-2xl font-semibold text-slate-900">
                R {((wallet?.balanceCents ?? 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick reorder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reorders.length === 0 && <p className="text-sm text-slate-600">No reorders yet.</p>}
              {reorders.map((history) => (
                <div key={history.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{history.request.title}</p>
                  <p className="text-xs text-slate-500">{history.request.address}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Featured local stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{shop.name}</p>
                    <p className="text-xs text-slate-500">{shop.city}</p>
                  </div>
                  <Link href="/shop" className="text-sm font-semibold text-slate-900">
                    Order
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                Your next restock day is scheduled soon. Check the Events tab for details.
              </div>
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                New helper teams are available for handyman requests.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{session.user.email}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">Role: {role}</p>
        </CardContent>
      </Card>

      {role === "BUSINESS" && (
        <Card>
          <CardHeader>
            <CardTitle>Business quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/business/store" className={buttonVariants()}>
              Store profile
            </Link>
            <Link href="/business/products" className={cn(buttonVariants({ variant: "outline" }))}>
              Manage products
            </Link>
          </CardContent>
        </Card>
      )}

      {role === "DRIVER" && (
        <Card>
          <CardHeader>
            <CardTitle>Driver summary</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open delivery jobs</p>
              <p className="text-2xl font-semibold text-slate-900">{openJobs}</p>
            </div>
            <Truck className="h-8 w-8 text-slate-400" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
