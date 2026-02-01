import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type AssistedOrdersPageProps = {
  searchParams?: { phone?: string };
};

export default async function AssistedOrdersPage({ searchParams }: AssistedOrdersPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const phone = searchParams?.phone ?? "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assisted order</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/admin/assisted-orders" method="POST" className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                WhatsApp phone
              </label>
              <Input id="phone" name="phone" defaultValue={phone} placeholder="+2782..." required />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Name
                </label>
                <Input id="name" name="name" placeholder="Contact name" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="area">
                  Area
                </label>
                <Input id="area" name="area" placeholder="Soweto, Tembisa..." />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="addressNote">
                Address
              </label>
              <Input id="addressNote" name="addressNote" placeholder="12 Main St, Extension 3" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="category">
                  Category
                </label>
                <Input id="category" name="category" placeholder="Water delivery" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                  Title
                </label>
                <Input id="title" name="title" placeholder="Request title" required />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <Textarea id="description" name="description" placeholder="Describe what the resident needs." />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Create request</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
