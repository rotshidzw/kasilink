import bcrypt from "bcryptjs";
import {
  DeliveryJobStatus,
  InventoryStatus,
  OrderStatus,
  RequestEventType,
  ServiceRequestStatus,
  Role,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.dispute.deleteMany(),
    prisma.voucherRedemption.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.orderHistory.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.serviceRequestEvent.deleteMany(),
    prisma.driverProfile.deleteMany(),
    prisma.review.deleteMany(),
    prisma.deliveryJob.deleteMany(),
    prisma.callbackTicket.deleteMany(),
    prisma.voiceNoteRequest.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.assistedContact.deleteMany(),
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

  const assistedContact = await prisma.assistedContact.create({
    data: {
      name: "Gogo Nandi",
      phone: "+27 82 777 2211",
      area: "Alexandra",
      addressNote: "Corner of 3rd Ave and Main Street",
      createdById: admin.id
    }
  });

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

  const rice = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: "Golden Rice 5kg",
      description: "Premium long-grain rice",
      price: 149.0,
      unit: "bag",
      inventory: {
        create: {
          status: InventoryStatus.IN_STOCK,
          quantity: 24
        }
      }
    }
  });

  const detergent = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: "Laundry Detergent 2L",
      description: "Fresh scent liquid detergent",
      price: 89.99,
      unit: "bottle",
      inventory: {
        create: {
          status: InventoryStatus.IN_STOCK,
          quantity: 18
        }
      }
    }
  });

  const bread = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: "Family Bread Loaf",
      description: "Freshly baked every morning",
      price: 18.5,
      unit: "loaf",
      inventory: {
        create: {
          status: InventoryStatus.IN_STOCK,
          quantity: 40
        }
      }
    }
  });

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      title: "Water delivery for Section D",
      description: "Need 5 drums delivered before 5pm.",
      address: "Section D Community Hall",
      status: ServiceRequestStatus.SUBMITTED,
      residentId: resident.id,
      categoryId: categories.find((category) => category.name === "Water")?.id ?? categories[0]!.id,
      events: {
        create: {
          type: RequestEventType.SUBMITTED,
          message: "Seeded request submitted."
        }
      }
    }
  });

  await prisma.serviceRequest.create({
    data: {
      title: "Assisted gas refill",
      description: "Caller needs a 9kg gas refill delivered today.",
      address: "3rd Ave · Alexandra",
      status: ServiceRequestStatus.SUBMITTED,
      contactId: assistedContact.id,
      createdByStaffId: admin.id,
      verifiedByCall: true,
      categoryId: categories.find((category) => category.name === "Gas")?.id ?? categories[1]!.id,
      events: {
        create: {
          type: RequestEventType.SUBMITTED,
          message: "Assisted request submitted by call center.",
          actorId: admin.id
        }
      }
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
          },
          {
            productId: rice.id,
            quantity: 1,
            price: 149.0
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

  await prisma.driverProfile.create({
    data: {
      userId: driver.id,
      isAvailable: true,
      vehicleType: "Motorbike",
      ratingAvg: 4.9,
      completedJobs: 28,
      lastLat: -26.2041,
      lastLng: 28.0473
    }
  });

  await prisma.wallet.create({
    data: {
      userId: resident.id,
      balanceCents: 5000
    }
  });

  await prisma.voucher.create({
    data: {
      code: "WELCOME10",
      description: "10% off your next delivery",
      percentOff: 10,
      maxUses: 100,
      createdById: admin.id
    }
  });

  await prisma.serviceRequest.createMany({
    data: [
      {
        title: "Draft grocery pickup",
        description: "Need maize meal and beans.",
        address: "12 Pine Street · Soweto",
        status: ServiceRequestStatus.DRAFT,
        residentId: resident.id,
        categoryId: categories[2]!.id
      },
      {
        title: "Match gas delivery",
        description: "Swap gas cylinder",
        address: "88 Market Road · Johannesburg",
        status: ServiceRequestStatus.MATCHED,
        residentId: resident.id,
        assignedDriverId: driver.id,
        assignedAt: new Date(),
        categoryId: categories[1]!.id
      },
      {
        title: "En route water drums",
        description: "Deliver 2 drums to community hall",
        address: "Section D Community Hall",
        status: ServiceRequestStatus.EN_ROUTE,
        residentId: resident.id,
        assignedDriverId: driver.id,
        assignedAt: new Date(),
        categoryId: categories[0]!.id
      },
      {
        title: "Delivered handyman job",
        description: "Fix leaking tap",
        address: "12 Pine Street · Soweto",
        status: ServiceRequestStatus.DELIVERED,
        residentId: resident.id,
        assignedBusinessId: business.id,
        deliveredAt: new Date(),
        categoryId: categories[3]!.id
      }
    ]
  });

  await prisma.announcement.create({
    data: {
      authorId: admin.id,
      title: "Bulk Grocery Restock Day",
      body: "Sisonke Spaza restocks bulk staples every Saturday at 9am.",
      category: "DEALS",
      isPinned: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  await prisma.announcement.create({
    data: {
      authorId: admin.id,
      title: "Community Helper Meetup",
      body: "Join the monthly helper briefing at the community hall.",
      category: "COMMUNITY"
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
