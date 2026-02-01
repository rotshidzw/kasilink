import { NextResponse } from "next/server";
import { DeliveryJobStatus, RequestEventType, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { notifyRequestEvent, sendWhatsApp } from "@/server/whatsapp";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "BUSINESS"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let driverId: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    driverId = body?.driverId as string | undefined;
  } else {
    const formData = await request.formData();
    driverId = (formData.get("driverId") as string | null) ?? undefined;
  }
  if (!driverId) {
    return NextResponse.json({ error: "Driver is required." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (session.user.role === "BUSINESS" && serviceRequest.assignedBusinessId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      assignedDriverId: driverId,
      assignedAt: new Date(),
      status: ServiceRequestStatus.MATCHED,
      updatedById: session.user.id,
      deliveryJob: {
        upsert: {
          create: {
            otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
            driverId,
            status: DeliveryJobStatus.ASSIGNED
          },
          update: {
            driverId,
            status: DeliveryJobStatus.ASSIGNED
          }
        }
      },
      events: {
        create: {
          type: RequestEventType.DRIVER_ASSIGNED,
          message: "Driver assigned.",
          actorId: session.user.id
        }
      }
    },
    include: {
      resident: { include: { profile: true } },
      contact: true,
      assignedDriver: { include: { profile: true } }
    }
  });

  const driverPhone = updatedRequest.assignedDriver?.profile?.phone;
  if (driverPhone) {
    await sendWhatsApp({
      to: driverPhone,
      body: `New job assigned: ${updatedRequest.title} pickup: ${updatedRequest.address}`,
      template: "DRIVER_ASSIGNED",
      requestId: updatedRequest.id
    });
  }

  const residentPhone = updatedRequest.resident?.profile?.phone ?? updatedRequest.contact?.phone;
  const driverName =
    updatedRequest.assignedDriver?.name ??
    updatedRequest.assignedDriver?.email ??
    "your driver";
  if (residentPhone) {
    await notifyRequestEvent({
      requestId: updatedRequest.id,
      eventType: "DRIVER_ASSIGNED",
      toPhone: residentPhone,
      message: `Driver assigned: ${driverName}`
    });
  }

  return NextResponse.json({ ok: true });
}
