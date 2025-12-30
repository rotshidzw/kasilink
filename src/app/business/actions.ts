"use server";

import { z } from "zod";
import { InventoryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const storeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  phone: z.string().min(5),
  line1: z.string().min(3),
  city: z.string().min(2)
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  unit: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative()
});

const updateProductSchema = z.object({
  productId: z.string().cuid(),
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  unit: z.string().min(1)
});

export async function upsertStore(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const parsed = storeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    city: formData.get("city")
  });

  if (!parsed.success) {
    return;
  }

  const existingShop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true }
  });

  if (existingShop) {
    await prisma.shop.update({
      where: { id: existingShop.id },
      data: parsed.data
    });
  } else {
    await prisma.shop.create({
      data: {
        ownerId: session.user.id,
        ...parsed.data
      }
    });
  }

  revalidatePath("/business/store");
}

export async function createBusinessProduct(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const shop = await prisma.shop.findFirst({ where: { ownerId: session.user.id } });
  if (!shop) {
    return;
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    unit: formData.get("unit"),
    quantity: formData.get("quantity")
  });

  if (!parsed.success) {
    return;
  }

  const status = parsed.data.quantity <= 0 ? InventoryStatus.OUT_OF_STOCK : InventoryStatus.IN_STOCK;

  await prisma.product.create({
    data: {
      shopId: shop.id,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      unit: parsed.data.unit,
      inventory: {
        create: {
          quantity: parsed.data.quantity,
          status
        }
      }
    }
  });

  revalidatePath("/business/products");
}

export async function updateBusinessProduct(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const parsed = updateProductSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    unit: formData.get("unit")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      unit: parsed.data.unit
    }
  });

  revalidatePath("/business/products");
}

export async function deleteBusinessProduct(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const productId = formData.get("productId");
  if (typeof productId !== "string") {
    return;
  }

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/business/products");
}
