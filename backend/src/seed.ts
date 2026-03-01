import dotenv from "dotenv";
dotenv.config();

import prisma from "./db/prisma";

const cars = [
  {
    brand: "Toyota",
    model: "RAV4",
    type: "SUV",
    pricePerDay: 65,
    description: "A reliable and spacious SUV perfect for family trips.",
    imageUrl: null,
  },
  {
    brand: "Toyota",
    model: "Corolla",
    type: "Sedan",
    pricePerDay: 45,
    description: "Fuel-efficient sedan with a smooth and comfortable ride.",
    imageUrl: null,
  },
  {
    brand: "BMW",
    model: "X5",
    type: "SUV",
    pricePerDay: 120,
    description: "Premium luxury SUV with powerful performance.",
    imageUrl: null,
  },
  {
    brand: "BMW",
    model: "3 Series",
    type: "Sedan",
    pricePerDay: 95,
    description: "Sporty sedan with elegant design and cutting-edge tech.",
    imageUrl: null,
  },
  {
    brand: "Audi",
    model: "A3",
    type: "Hatchback",
    pricePerDay: 70,
    description: "Compact hatchback with premium interior and agile handling.",
    imageUrl: null,
  },
  {
    brand: "Audi",
    model: "Q7",
    type: "SUV",
    pricePerDay: 130,
    description: "Full-size luxury SUV with three-row seating.",
    imageUrl: null,
  },
  {
    brand: "Tesla",
    model: "Model 3",
    type: "Electric",
    pricePerDay: 90,
    description: "All-electric sedan with autopilot and impressive range.",
    imageUrl: null,
  },
  {
    brand: "Tesla",
    model: "Model Y",
    type: "Electric",
    pricePerDay: 110,
    description: "Electric crossover SUV with spacious cargo and fast charging.",
    imageUrl: null,
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.car.deleteMany();

  // Insert cars
  for (const car of cars) {
    await prisma.car.create({ data: car });
  }

  console.log(`Inserted ${cars.length} cars.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
