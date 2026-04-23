import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import prisma from "./db/prisma";

const cars = [
  {
    brand: "Toyota",
    model: "RAV4",
    type: "SUV",
    pricePerDay: 65,
    horsepower: 203,
    mileageKm: 18500,
    color: "Midnight Blue",
    description: "A reliable and spacious SUV perfect for family trips.",
    imageUrl: "https://images.pexels.com/photos/9615358/pexels-photo-9615358.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "Toyota",
    model: "Corolla",
    type: "Sedan",
    pricePerDay: 45,
    horsepower: 139,
    mileageKm: 34200,
    color: "Silver",
    description: "Fuel-efficient sedan with a smooth and comfortable ride.",
    imageUrl: "https://images.pexels.com/photos/17075678/pexels-photo-17075678.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "BMW",
    model: "X5",
    type: "SUV",
    pricePerDay: 120,
    horsepower: 335,
    mileageKm: 16400,
    color: "Alpine White",
    description: "Premium luxury SUV with powerful performance.",
    imageUrl: "https://images.pexels.com/photos/7154531/pexels-photo-7154531.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "BMW",
    model: "3 Series",
    type: "Sedan",
    pricePerDay: 95,
    horsepower: 255,
    mileageKm: 19800,
    color: "Mineral Grey",
    description: "Sporty sedan with elegant design and cutting-edge tech.",
    imageUrl: "https://images.pexels.com/photos/19892485/pexels-photo-19892485.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "Audi",
    model: "A3",
    type: "Hatchback",
    pricePerDay: 70,
    horsepower: 201,
    mileageKm: 28600,
    color: "Navarra Blue",
    description: "Compact hatchback with premium interior and agile handling.",
    imageUrl: "https://images.pexels.com/photos/27810414/pexels-photo-27810414.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "Audi",
    model: "Q7",
    type: "SUV",
    pricePerDay: 130,
    horsepower: 335,
    mileageKm: 33700,
    color: "Mythos Black",
    description: "Full-size luxury SUV with three-row seating.",
    imageUrl: "https://images.pexels.com/photos/14487752/pexels-photo-14487752.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "Tesla",
    model: "Model 3",
    type: "Electric",
    pricePerDay: 90,
    horsepower: 271,
    mileageKm: 15200,
    color: "Pearl White",
    description: "All-electric sedan with autopilot and impressive range.",
    imageUrl: "https://images.pexels.com/photos/10029878/pexels-photo-10029878.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    brand: "Tesla",
    model: "Model Y",
    type: "Electric",
    pricePerDay: 110,
    horsepower: 425,
    mileageKm: 12800,
    color: "Deep Blue",
    description: "Electric crossover SUV with spacious cargo and fast charging.",
    imageUrl: "https://images.pexels.com/photos/15089585/pexels-photo-15089585.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  // Insert cars
  for (const car of cars) {
    await prisma.car.create({ data: car });
  }

  console.log(`Inserted ${cars.length} cars.`);

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@test.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  console.log("Created admin user: admin@test.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
