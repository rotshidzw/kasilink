"use server";

import { z } from "zod";
import { DeliveryJobStatus, OrderStatus, ServiceRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

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

  await prisma.serviceRequest.update({
    where: { id: parsed.data.requestId },
    data: { status: parsed.data.status }
  });

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
