"use server";

import { z } from "zod";
import { ServiceRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const createRequestSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  address: z.string().min(5, "Address is required"),
  categoryId: z.string().cuid("Select a service category")
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
    address: formData.get("address"),
    categoryId: formData.get("categoryId")
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  await prisma.serviceRequest.create({
    data: {
      ...parsed.data,
      residentId: session.user.id
    }
  });

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

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceRequestStatus.ASSIGNED,
      assignedToId: session.user.id
    }
  });

  revalidatePath("/requests");
}
