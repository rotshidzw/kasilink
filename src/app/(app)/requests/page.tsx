import Link from "next/link";
import { ClipboardList } from "lucide-react";
import Image from "next/image";
import { ServiceRequestStatus } from "@prisma/client";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignRequest } from "@/app/(app)/requests/actions";
import { cn } from "@/lib/utils";

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "MATCHED":
      return "Matched";
    case "ACCEPTED":
      return "Accepted";
    case "PICKED_UP":
      return "Picked up";
    case "EN_ROUTE":
      return "En route";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export default async function RequestsPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to manage service requests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Residents can submit water, gas, bulk grocery, and handyman requests. Helpers can browse available work.
          </p>
          <Link href="/login" className={cn(buttonVariants({ className: "w-fit" }))}>
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isResident = session.user.role === "RESIDENT";
  const isDriver = session.user.role === "DRIVER";
  const isBusiness = session.user.role === "BUSINESS";

  const requests = await prisma.serviceRequest.findMany({
    where: isResident
      ? { residentId: session.user.id }
      : isDriver
        ? { OR: [{ assignedDriverId: session.user.id }, { status: ServiceRequestStatus.SUBMITTED }] }
        : isBusiness
          ? { OR: [{ assignedBusinessId: session.user.id }, { status: ServiceRequestStatus.SUBMITTED }] }
          : { status: ServiceRequestStatus.SUBMITTED },
    include: {
      category: true,
      resident: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Service requests</h1>
          <p className="text-sm text-slate-600">
            {isResident
              ? "Track your requests and updates from helpers."
              : "Browse open requests that need immediate attention."}
          </p>
          {isResident && (
            <Link href="/requests/new" className={buttonVariants()}>
              Create new request
            </Link>
          )}
        </div>
        <div className="relative h-32 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-resident.svg" alt="Requests hero" fill className="object-cover" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isResident ? "My requests" : "Open requests"}</CardTitle>
          <Badge variant="secondary">{requests.length} total</Badge>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-600">
              <ClipboardList className="h-6 w-6 text-slate-400" />
              <p>No requests found yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  {!isResident && <TableHead>Resident</TableHead>}
                  {!isResident && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const action = assignRequest.bind(null, request.id);
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Link href={`/requests/${request.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
                          {request.title}
                        </Link>
                        <div className="text-xs text-slate-500">{request.address}</div>
                      </TableCell>
                      <TableCell>{request.category.name}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === "SUBMITTED" ? "default" : "secondary"}>
                          {statusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      {!isResident && <TableCell>{request.resident.name ?? request.resident.email}</TableCell>}
                      {!isResident && (
                        <TableCell>
                          <form action={action}>
                            <Button type="submit" size="sm" disabled={request.status !== "SUBMITTED"}>
                              Assign to me
                            </Button>
                          </form>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
