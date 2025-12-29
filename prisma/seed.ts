import bcrypt from "bcryptjs";
import {
  AnnouncementType,
  DeliveryJobStatus,
  InventoryStatus,
  OrderStatus,
  Role,
  ServiceRequestStatus,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.deliveryJob.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.serviceCategory.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.address.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const [resident, business, driver, admin] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Rina Resident",
        email: "resident@kasilink.local",
        role: Role.RESIDENT,
        hashedPassword: passwordHash,
        profile: {
          create: {
            phone: "+27 82 555 0101",
            bio: "Community organizer"
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        name: "Bella Business",
        email: "business@kasilink.local",
        role: Role.BUSINESS,
        hashedPassword: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Dumisani Driver",
        email: "driver@kasilink.local",
        role: Role.DRIVER,
        hashedPassword: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Amina Admin",
        email: "admin@kasilink.local",
        role: Role.ADMIN,
        hashedPassword: passwordHash
      }
    })
  ]);

  const residentAddress = await prisma.address.create({
    data: {
      userId: resident.id,
      label: "Home",
      line1: "12 Pine Street",
      city: "Soweto",
      province: "Gauteng",
      postalCode: "1804",
      isDefault: true
    }
  });

  await prisma.serviceCategory.createMany({
    data: [
      { name: "Water", description: "Water delivery and shortages", icon: "Droplet" },
      { name: "Gas", description: "Gas cylinder exchanges", icon: "Flame" },
      { name: "Bulk Grocery", description: "Monthly bulk restock", icon: "ShoppingBasket" },
      { name: "Handyman", description: "Home fixes and maintenance", icon: "Wrench" }
    ],
    skipDuplicates: true
  });

  const categories = await prisma.serviceCategory.findMany();

  const shop = await prisma.shop.create({
    data: {
      ownerId: business.id,
      name: "Sisonke Spaza",
      description: "Bulk grocery essentials and household staples.",
      phone: "+27 11 555 1212",
      line1: "88 Market Road",
      city: "Johannesburg",
      province: "Gauteng",
      postalCode: "2001"
    }
  });

  const maizeMeal = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: "Maize Meal 10kg",
      description: "Family-size staple pack",
      price: 189.99,
      unit: "bag",
      inventory: {
        create: {
          status: InventoryStatus.IN_STOCK,
          quantity: 32
        }
      }
    }
  });

  const gasRefill = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: "Gas Cylinder Refill",
      description: "9kg cylinder refill",
      price: 260.0,
      unit: "refill",
      inventory: {
        create: {
          status: InventoryStatus.LOW,
          quantity: 8
        }
      }
    }
  });

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      title: "Water delivery for Section D",
      description: "Need 5 drums delivered before 5pm.",
      address: "Section D Community Hall",
      status: ServiceRequestStatus.OPEN,
      residentId: resident.id,
      categoryId: categories.find((category) => category.name === "Water")?.id ?? categories[0]!.id
    }
  });

  const order = await prisma.order.create({
    data: {
      residentId: resident.id,
      shopId: shop.id,
      status: OrderStatus.CONFIRMED,
      total: 449.99,
      deliveryAddressId: residentAddress.id,
      items: {
        create: [
          {
            productId: maizeMeal.id,
            quantity: 2,
            price: 189.99
          },
          {
            productId: gasRefill.id,
            quantity: 1,
            price: 70.01
          }
        ]
      }
    }
  });

  await prisma.deliveryJob.create({
    data: {
      orderId: order.id,
      driverId: driver.id,
      status: DeliveryJobStatus.ASSIGNED,
      otpCode: "731204"
    }
  });

  await prisma.deliveryJob.create({
    data: {
      requestId: serviceRequest.id,
      status: DeliveryJobStatus.OPEN,
      otpCode: "449120"
    }
  });

  await prisma.announcement.create({
    data: {
      createdById: admin.id,
      title: "Bulk Grocery Restock Day",
      body: "Sisonke Spaza restocks bulk staples every Saturday at 9am.",
      type: AnnouncementType.RESTOCK,
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }
  });

  await prisma.announcement.create({
    data: {
      createdById: admin.id,
      title: "Community Helper Meetup",
      body: "Join the monthly helper briefing at the community hall.",
      type: AnnouncementType.COMMUNITY,
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10)
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
