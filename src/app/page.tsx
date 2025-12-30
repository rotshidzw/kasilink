import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock, Package, ShieldCheck, Truck } from "lucide-react";
import { DeliveryJobStatus, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const [openRequests, openJobs] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: ServiceRequestStatus.SUBMITTED } }),
    prisma.deliveryJob.count({ where: { status: DeliveryJobStatus.OPEN } })
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-white shadow-xl md:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
          <Badge className="w-fit bg-white/10 text-white" variant="secondary">
            Community-first delivery network
          </Badge>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            KasiLink connects residents, spaza shops, and drivers for trusted local service delivery.
          </h1>
          <p className="text-base text-slate-200 md:text-lg">
            Launch service requests, coordinate restock days, and keep deliveries moving with real-time status updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/requests/new"
              className={cn(
                buttonVariants({ className: "bg-white text-slate-900 hover:bg-slate-100" })
              )}
            >
              Create a service request
            </Link>
            <Link
              href="/events"
              className={cn(
                buttonVariants({ variant: "outline", className: "border-white text-white hover:bg-white/10" })
              )}
            >
              View restock days
            </Link>
          </div>
        </div>
          <div className="relative h-64 w-full md:h-72">
            <Image
              src="/illustrations/hero-community.svg"
              alt="Community dashboard illustration"
              fill
              className="rounded-2xl object-cover"
              priority
            />
          </div>
        </div>
        <div className="absolute -right-8 -top-10 hidden h-40 w-40 rounded-full bg-white/10 blur-2xl md:block" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Open service requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-slate-900">{openRequests}</p>
              <p className="text-sm text-slate-600">Residents waiting for water, gas, and handyman support.</p>
              <Link href="/requests" className="inline-flex items-center text-sm font-medium text-slate-900">
                Review requests <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-slate-900">{openJobs}</p>
              <p className="text-sm text-slate-600">Delivery jobs ready for drivers to accept now.</p>
              <Link href="/driver" className="inline-flex items-center text-sm font-medium text-slate-900">
                See driver board <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>How KasiLink works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: BadgeCheck, label: "Verified helpers", copy: "Track trusted shops and helpers." },
              { icon: ShieldCheck, label: "Secure handoffs", copy: "OTP delivery confirmation on every job." },
              { icon: Clock, label: "Live status", copy: "Residents receive updates instantly." }
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-slate-100 p-2 text-slate-900">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-600">{item.copy}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Service requests",
            description: "Residents raise water, gas, bulk grocery, or handyman needs in seconds.",
            icon: Package,
            image: "/illustrations/resident.svg"
          },
          {
            title: "Spaza inventory",
            description: "Merchants keep stock levels updated and publish restock days.",
            icon: BadgeCheck,
            image: "/illustrations/shop-owner.svg"
          },
          {
            title: "Driver network",
            description: "Drivers accept delivery jobs with verified OTP handoffs.",
            icon: Truck,
            image: "/illustrations/driver.svg"
          }
        ].map((feature) => (
          <Card key={feature.title} className="overflow-hidden">
            <div className="relative h-40 w-full">
              <Image src={feature.image} alt={`${feature.title} illustration`} fill className="object-cover" />
            </div>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                <feature.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
