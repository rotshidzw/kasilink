"use server";

import { z } from "zod";
import { RequestEventType, ServiceRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { sendWhatsAppMessage } from "@/server/notifications/whatsapp";

const requiredStringField = (minLength: number, message: string) =>
  z.preprocess((value) => (typeof value === "string" ? value : ""), z.string().min(minLength, message));
const optionalStringField = z.preprocess(
  (value) => (typeof value === "string" ? value : value == null ? undefined : ""),
  z.string().optional()
);
const requiredCuidField = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string().cuid("Select a service category")
);

const createRequestSchema = z.object({
  title: requiredStringField(3, "Title is required"),
  description: requiredStringField(10, "Description is required"),
  addressLine1: requiredStringField(5, "Address is required"),
  addressLabel: requiredStringField(2, "Address label is required"),
  addressId: optionalStringField,
  categoryId: requiredCuidField
});

export type RequestState = {
  error?: string;
};

export async function createServiceRequest(prevState: RequestState, formData: FormData): Promise<RequestState> {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "RESIDENT") {
    return { error: "Only residents can create requests." };
  }

  const parsed = createRequestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    addressLine1: formData.get("addressLine1"),
    addressLabel: formData.get("addressLabel"),
    addressId: formData.get("addressId") || "",
    categoryId: formData.get("categoryId")
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  await prisma.serviceRequest.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      address: `${parsed.data.addressLabel} · ${parsed.data.addressLine1}`,
      categoryId: parsed.data.categoryId,
      residentId: session.user.id,
      status: ServiceRequestStatus.SUBMITTED,
      events: {
        create: {
          type: RequestEventType.SUBMITTED,
          message: "Request submitted.",
          actorId: session.user.id
        }
      }
    }
  });

  const resident = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true }
  });

  if (resident?.profile?.phone) {
    await sendWhatsAppMessage({
      to: resident.profile.phone,
      message: "KasiLink: Your request has been submitted. We will update you shortly."
    });
  }

  redirect("/requests");
}

export async function assignRequest(requestId: string) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (!session.user.role || !["BUSINESS", "DRIVER", "ADMIN"].includes(session.user.role)) {
    return { error: "Not allowed" };
  }

  const assignmentData =
    session.user.role === "DRIVER"
      ? { assignedDriverId: session.user.id }
      : { assignedBusinessId: session.user.id };

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceRequestStatus.MATCHED,
      assignedAt: new Date(),
      ...assignmentData,
      events: {
        create: {
          type: session.user.role === "DRIVER" ? RequestEventType.DRIVER_ASSIGNED : RequestEventType.BUSINESS_ASSIGNED,
          message: "Assignment added.",
          actorId: session.user.id
        }
      }
    }
  });

  revalidatePath("/requests");
}
