"use server";

import { z } from "zod";
import { DeliveryJobStatus, InventoryStatus, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const shopSchema = z.object({
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

const orderSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive()
});

export async function createShop(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    city: formData.get("city")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.shop.create({
    data: {
      ownerId: session.user.id,
      ...parsed.data
    }
  });

  revalidatePath("/shop");
}

export async function createProduct(formData: FormData) {
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

  revalidatePath("/shop");
}

export async function createOrder(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "RESIDENT") {
    return;
  }

  const parsed = orderSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity")
  });

  if (!parsed.success) {
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    include: { shop: true }
  });

  if (!product) {
    return;
  }

  const address = await prisma.address.findFirst({
    where: { userId: session.user.id, isDefault: true }
  });

  const total = Number(product.price) * parsed.data.quantity;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const order = await prisma.order.create({
    data: {
      residentId: session.user.id,
      shopId: product.shopId,
      status: OrderStatus.PENDING,
      total,
      deliveryAddressId: address?.id,
      items: {
        create: [
          {
            productId: product.id,
            quantity: parsed.data.quantity,
            price: product.price
          }
        ]
      },
      deliveryJob: {
        create: {
          otpCode,
          status: DeliveryJobStatus.OPEN
        }
      }
    }
  });

  revalidatePath("/shop");
  redirect(`/shop/checkout?orderId=${order.id}`);
}

const inventorySchema = z.object({
  productId: z.string().cuid(),
  status: z.nativeEnum(InventoryStatus),
  quantity: z.coerce.number().int().nonnegative()
});

export async function updateInventory(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "BUSINESS") {
    return;
  }

  const parsed = inventorySchema.safeParse({
    productId: formData.get("productId"),
    status: formData.get("status"),
    quantity: formData.get("quantity")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.inventory.update({
    where: { productId: parsed.data.productId },
    data: { status: parsed.data.status, quantity: parsed.data.quantity }
  });

  revalidatePath("/shop");
}
