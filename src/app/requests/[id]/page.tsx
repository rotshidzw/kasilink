import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, MapPin } from "lucide-react";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const cancellableStatuses = new Set(["DRAFT", "SUBMITTED", "MATCHED", "ACCEPTED"]);

export default async function RequestDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      resident: true,
      assignedDriver: { include: { driverProfile: true } },
      assignedBusiness: true,
      events: { orderBy: { createdAt: "desc" }, include: { actor: true } },
      disputes: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!request) {
    redirect("/requests");
  }

  const canAccess =
    session.user.role === "ADMIN" ||
    request.residentId === session.user.id ||
    request.assignedDriverId === session.user.id ||
    request.assignedBusinessId === session.user.id;

  if (!canAccess) {
    redirect("/requests");
  }

  const isResident = session.user.role === "RESIDENT" && request.residentId === session.user.id;
  const isDriver = session.user.role === "DRIVER" && request.assignedDriverId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{request.category.name}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{request.title}</h1>
        </div>
        <Badge variant="secondary">{request.status}</Badge>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>{request.description}</p>
            <div className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Delivery address</p>
                <p className="text-xs text-slate-500">{request.address}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Price estimate</p>
                <p className="text-base font-semibold text-slate-900">
                  {request.priceEstimateCents ? `R ${(request.priceEstimateCents / 100).toFixed(2)}` : "Pending"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Delivery fee</p>
                <p className="text-base font-semibold text-slate-900">
                  {request.deliveryFeeCents ? `R ${(request.deliveryFeeCents / 100).toFixed(2)}` : "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="text-xs text-slate-500">Driver</p>
              <p className="text-sm font-semibold text-slate-900">
                {request.assignedDriver?.name ?? request.assignedDriver?.email ?? "Unassigned"}
              </p>
              {request.assignedDriver?.driverProfile && (
                <p className="text-xs text-slate-500">
                  {request.assignedDriver.driverProfile.vehicleType ?? "Vehicle"} ·{" "}
                  {request.assignedDriver.driverProfile.isAvailable ? "Available" : "Offline"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Business</p>
              <p className="text-sm font-semibold text-slate-900">
                {request.assignedBusiness?.name ?? request.assignedBusiness?.email ?? "Unassigned"}
              </p>
            </div>
            {request.assignedDriver?.driverProfile && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Tracking</p>
                <p className="text-sm text-slate-700">
                  {request.assignedDriver.driverProfile.lastLat && request.assignedDriver.driverProfile.lastLng
                    ? `Lat ${request.assignedDriver.driverProfile.lastLat}, Lng ${request.assignedDriver.driverProfile.lastLng}`
                    : "Location updates pending."}
                </p>
                <Button size="sm" variant="outline" className="mt-2 w-full" disabled>
                  Open map (coming soon)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isResident && request.status === "DRAFT" && (
              <form action={`/api/requests/${request.id}/submit`} method="post">
                <Button type="submit">Submit request</Button>
              </form>
            )}
            {isResident && cancellableStatuses.has(request.status) && (
              <form action={`/api/requests/${request.id}/cancel`} method="post">
                <Button type="submit" variant="outline">
                  Cancel request
                </Button>
              </form>
            )}
            {isResident && request.status === "DELIVERED" && (
              <form action={`/api/requests/${request.id}/status`} method="post">
                <input type="hidden" name="newStatus" value="COMPLETED" />
                <Button type="submit" variant="secondary">
                  Confirm completed
                </Button>
              </form>
            )}
            {isResident && (
              <form action={`/api/requests/${request.id}/apply-voucher`} method="post" className="space-y-2">
                <Input name="code" placeholder="Voucher code" />
                <Button type="submit" variant="outline">
                  Apply voucher
                </Button>
              </form>
            )}
            {isResident && (
              <form action="/api/favorites" method="post">
                <input type="hidden" name="type" value="REQUEST_TEMPLATE" />
                <input type="hidden" name="label" value={request.title} />
                <input
                  type="hidden"
                  name="payload"
                  value={JSON.stringify({
                    title: request.title,
                    description: request.description,
                    address: request.address,
                    categoryId: request.categoryId
                  })}
                />
                <input type="hidden" name="requestId" value={request.id} />
                <Button type="submit" variant="outline">
                  Save as favorite
                </Button>
              </form>
            )}
            {isDriver && (
              <div className="space-y-2">
                {[
                  { label: "Accept", status: "ACCEPTED" },
                  { label: "Picked up", status: "PICKED_UP" },
                  { label: "En route", status: "EN_ROUTE" },
                  { label: "Delivered", status: "DELIVERED" }
                ].map((action) => (
                  <form key={action.status} action={`/api/requests/${request.id}/status`} method="post">
                    <input type="hidden" name="newStatus" value={action.status} />
                    <Button type="submit" variant="outline" className="w-full">
                      {action.label}
                    </Button>
                  </form>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="space-y-2">
                <form action={`/api/requests/${request.id}/assign-driver`} method="post" className="space-y-2">
                  <Input name="driverId" placeholder="Driver ID" />
                  <Button type="submit" variant="outline">
                    Assign driver
                  </Button>
                </form>
                <form action={`/api/requests/${request.id}/assign-business`} method="post" className="space-y-2">
                  <Input name="businessId" placeholder="Business ID" />
                  <Button type="submit" variant="outline">
                    Assign business
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proof of delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Upload proof photo URL or add OTP when delivered.</p>
            <form action={`/api/requests/${request.id}/proof`} method="post" className="space-y-2">
              <Input name="proofOfDeliveryUrl" placeholder="Photo URL" />
              <Input name="deliveryOtp" placeholder="Delivery OTP" />
              <Button type="submit" variant="outline">
                Save proof
              </Button>
            </form>
            {request.proofOfDeliveryUrl && (
              <Link href={request.proofOfDeliveryUrl} className="text-sm font-semibold text-slate-900">
                View proof
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.events.length === 0 && <p className="text-sm text-slate-600">No updates yet.</p>}
            {request.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{event.type}</p>
                  <span className="text-xs text-slate-500">{event.createdAt.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500">{event.message}</p>
                {event.actor && (
                  <p className="text-xs text-slate-400">By {event.actor.name ?? event.actor.email}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.disputes.length > 0 ? (
              request.disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{dispute.reason}</p>
                  <p className="text-xs text-slate-500">{dispute.status}</p>
                  {dispute.details && <p className="text-xs text-slate-500">{dispute.details}</p>}
                </div>
              ))
            ) : isResident && ["DELIVERED", "COMPLETED"].includes(request.status) ? (
              <form action={`/api/requests/${request.id}/disputes`} method="post" className="space-y-2">
                <Input name="reason" placeholder="Reason" required />
                <Textarea name="details" placeholder="Details (optional)" />
                <Button type="submit" variant="outline">
                  Open dispute
                </Button>
              </form>
            ) : (
              <p className="text-sm text-slate-600">No disputes filed.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-900">
          <CheckCircle className="h-4 w-4" />
          <p className="font-semibold">Need to reorder?</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Use quick reorder to submit the same request again.
        </p>
        <form action={`/api/requests/${request.id}/reorder`} method="post" className="mt-3">
          <Button type="submit" variant="outline">
            Quick reorder
          </Button>
        </form>
      </section>
    </div>
  );
}
