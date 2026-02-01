import { redirect } from "next/navigation";
import { CallbackStatus } from "@prisma/client";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default async function CallCenterCallbacksPage() {
  const session = await getServerAuthSession();
  if (!session?.user || !["CALLCENTER", "ADMIN"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const callbacks = await prisma.callbackTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  const openCallbacks = callbacks.filter((callback) => callback.status === CallbackStatus.OPEN);
  const doneCallbacks = callbacks.filter((callback) => callback.status === CallbackStatus.DONE);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Callbacks</h1>
        <p className="text-sm text-slate-600">Keep track of residents waiting for assistance.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Log a new callback</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/callbacks" method="post" className="grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Resident name" />
            <Input name="phone" placeholder="Phone number" required />
            <Input name="area" placeholder="Area" />
            <Textarea name="notes" placeholder="Notes for the call center" className="md:col-span-2" />
            <Button type="submit" className="w-fit">
              Create callback
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Open callbacks</CardTitle>
            <Badge variant="secondary">{openCallbacks.length} waiting</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {openCallbacks.length === 0 ? (
              <p className="text-sm text-slate-600">No callbacks waiting right now.</p>
            ) : (
              openCallbacks.map((callback) => (
                <div key={callback.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{callback.name ?? "Resident"}</p>
                    <Badge variant="default">Open</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{callback.phone}</p>
                  {callback.area && <p className="mt-1 text-xs text-slate-500">Area: {callback.area}</p>}
                  {callback.notes && <p className="mt-2 text-xs text-slate-600">{callback.notes}</p>}
                  <form action={`/api/callbacks/${callback.id}/resolve`} method="post" className="mt-3">
                    <Button type="submit" size="sm" variant="outline">
                      Mark done
                    </Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recently completed</CardTitle>
            <Badge variant="secondary">{doneCallbacks.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {doneCallbacks.length === 0 ? (
              <p className="text-sm text-slate-600">No completed callbacks yet.</p>
            ) : (
              doneCallbacks.slice(0, 6).map((callback) => (
                <div key={callback.id} className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{callback.name ?? "Resident"}</p>
                    <Badge variant="secondary">Done</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{callback.phone}</p>
                  {callback.area && <p className="mt-1 text-xs text-slate-500">Area: {callback.area}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
