"use server";

import { z } from "zod";
import { DeliveryJobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function acceptJob(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "DRIVER") {
    return;
  }

  const jobId = formData.get("jobId");
  if (typeof jobId !== "string") {
    return;
  }

  await prisma.deliveryJob.update({
    where: { id: jobId },
    data: {
      driverId: session.user.id,
      status: DeliveryJobStatus.ASSIGNED
    }
  });

  revalidatePath("/driver");
}

const statusSchema = z.object({
  jobId: z.string().cuid(),
  status: z.nativeEnum(DeliveryJobStatus)
});

export async function updateJobStatus(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "DRIVER") {
    return;
  }

  const parsed = statusSchema.safeParse({
    jobId: formData.get("jobId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return;
  }

  const job = await prisma.deliveryJob.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.driverId !== session.user.id) {
    return;
  }

  await prisma.deliveryJob.update({
    where: { id: parsed.data.jobId },
    data: { status: parsed.data.status }
  });

  revalidatePath("/driver");
}

const completeSchema = z.object({
  jobId: z.string().cuid(),
  otpCode: z.string().min(4)
});

export async function completeJob(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "DRIVER") {
    return;
  }

  const parsed = completeSchema.safeParse({
    jobId: formData.get("jobId"),
    otpCode: formData.get("otpCode")
  });

  if (!parsed.success) {
    return;
  }

  const job = await prisma.deliveryJob.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.driverId !== session.user.id || job.otpCode !== parsed.data.otpCode) {
    return;
  }

  await prisma.deliveryJob.update({
    where: { id: parsed.data.jobId },
    data: { status: DeliveryJobStatus.DELIVERED }
  });

  revalidatePath("/driver");
}
