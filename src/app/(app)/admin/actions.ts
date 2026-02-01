"use server";

import { z } from "zod";
import { DeliveryJobStatus, OrderStatus, RequestEventType, ServiceRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { notifyRequestEvent, sendWhatsApp } from "@/server/whatsapp";

const requestSchema = z.object({
  requestId: z.string().cuid(),
  status: z.nativeEnum(ServiceRequestStatus)
});

const orderSchema = z.object({
  orderId: z.string().cuid(),
  status: z.nativeEnum(OrderStatus)
});

const jobSchema = z.object({
  jobId: z.string().cuid(),
  status: z.nativeEnum(DeliveryJobStatus)
});

const assignSchema = z.object({
  requestId: z.string().cuid(),
  driverId: z.string().cuid()
});

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5)
});

const productToggleSchema = z.object({
  productId: z.string().cuid(),
  isActive: z.preprocess((value) => value === "true", z.boolean())
});

async function requireAdmin() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function updateRequestStatus(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return;
  }

  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: parsed.data.requestId },
    data: {
      status: parsed.data.status,
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.STATUS_CHANGED,
          message: `Status updated to ${parsed.data.status}.`,
          actorId: session.user.id
        }
      }
    },
    include: { resident: { include: { profile: true } }, contact: true }
  });

  const phone = updatedRequest.resident?.profile?.phone ?? updatedRequest.contact?.phone;
  if (phone) {
    await notifyRequestEvent({
      requestId: updatedRequest.id,
      eventType: "STATUS_UPDATE",
      toPhone: phone,
      message: `Status update: ${parsed.data.status}`
    });
  }

  revalidatePath("/admin");
}

export async function updateOrderStatus(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = orderSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { status: parsed.data.status }
  });

  revalidatePath("/admin");
}

export async function updateJobStatus(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = jobSchema.safeParse({
    jobId: formData.get("jobId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.deliveryJob.update({
    where: { id: parsed.data.jobId },
    data: { status: parsed.data.status }
  });

  revalidatePath("/admin");
}

export async function assignDriver(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = assignSchema.safeParse({
    requestId: formData.get("requestId"),
    driverId: formData.get("driverId")
  });

  if (!parsed.success) {
    return;
  }

  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: parsed.data.requestId },
    data: {
      status: ServiceRequestStatus.MATCHED,
      assignedDriverId: parsed.data.driverId,
      assignedAt: new Date(),
      deliveryJob: {
        upsert: {
          create: {
            otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
            driverId: parsed.data.driverId,
            status: DeliveryJobStatus.ASSIGNED
          },
          update: {
            driverId: parsed.data.driverId,
            status: DeliveryJobStatus.ASSIGNED
          }
        }
      },
      events: {
        create: {
          type: RequestEventType.DRIVER_ASSIGNED,
          message: "Driver assigned by admin.",
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

  revalidatePath("/admin");
}

export async function createCategory(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.serviceCategory.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description
    }
  });

  revalidatePath("/admin");
}

export async function toggleProductActive(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const parsed = productToggleSchema.safeParse({
    productId: formData.get("productId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { isActive: parsed.data.isActive }
  });

  revalidatePath("/admin");
}
