const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, brand: true, model: true, type: true, pricePerDay: true },
  });

  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true },
  });

  const bookings = await prisma.booking.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, carId: true, startDate: true, endDate: true, status: true },
  });

  const favorites = await prisma.favorite.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, carId: true },
  });

  const reviews = await prisma.review.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, carId: true, rating: true },
  });

  const conversations = await prisma.chatConversation.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, message: true, createdAt: true },
  });

  console.log(JSON.stringify({ cars, users, bookings, favorites, reviews, conversations }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
