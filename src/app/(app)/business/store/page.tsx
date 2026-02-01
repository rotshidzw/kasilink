import Image from "next/image";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { upsertStore } from "@/app/(app)/business/actions";

export default async function BusinessStorePage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS") {
    redirect("/dashboard");
  }

  const store = await prisma.shop.findFirst({ where: { ownerId: session.user.id } });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Store profile</h1>
          <p className="text-sm text-slate-600">
            Keep your spaza profile updated so residents can find you quickly.
          </p>
        </div>
        <div className="decorative-image relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-business.svg" alt="Shop owner illustration" fill className="object-cover" data-decorative />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{store ? "Update store details" : "Create your store"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertStore} className="grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Store name" defaultValue={store?.name ?? ""} required />
            <Input name="phone" placeholder="Phone" defaultValue={store?.phone ?? ""} required />
            <Input name="description" placeholder="Short description" defaultValue={store?.description ?? ""} required />
            <Input name="line1" placeholder="Street address" defaultValue={store?.line1 ?? ""} required />
            <Input name="city" placeholder="City" defaultValue={store?.city ?? ""} required />
            <div className="md:col-span-2">
              <Button type="submit">Save store</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
