import { PrismaClient, Role, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.rSVP.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const [resident, youth, business, admin] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Rina Resident",
        email: "resident@kasilink.local",
        role: Role.RESIDENT
      }
    }),
    prisma.user.create({
      data: {
        name: "Yusuf Youth",
        email: "youth@kasilink.local",
        role: Role.YOUTH
      }
    }),
    prisma.user.create({
      data: {
        name: "Bella Business",
        email: "business@kasilink.local",
        role: Role.BUSINESS
      }
    }),
    prisma.user.create({
      data: {
        name: "Amina Admin",
        email: "admin@kasilink.local",
        role: Role.ADMIN
      }
    })
  ]);

  await prisma.serviceRequest.createMany({
    data: [
      {
        type: "Graffiti removal",
        description: "Spray paint on wall near park.",
        address: "12 Pine Street",
        residentId: resident.id,
        status: RequestStatus.NEW
      },
      {
        type: "Broken streetlight",
        description: "Lamp post flickering at night.",
        address: "45 Market Road",
        residentId: resident.id,
        status: RequestStatus.CLAIMED,
        claimedById: youth.id
      }
    ]
  });

  const cleanupEvent = await prisma.event.create({
    data: {
      title: "Riverfront Cleanup",
      description: "Join us to clean the riverfront trail.",
      location: "Riverfront Park",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      organizerId: admin.id
    }
  });

  await prisma.rSVP.create({
    data: {
      eventId: cleanupEvent.id,
      userId: business.id
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
