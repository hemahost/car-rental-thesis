import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import prisma from "./db/prisma";

const cars = [
  {
    brand: "Toyota", model: "RAV4", type: "SUV",
    pricePerDay: 65, year: 2023, horsepower: 203, mileageKm: 18500, color: "Black", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "A reliable and spacious SUV perfect for family trips and light off-road adventures. Features Toyota Safety Sense as standard.",
    imageUrl: "https://i.pinimg.com/736x/77/43/f3/7743f3056b6b0d98556f2826826df9e0.jpg",
  },
  {
    brand: "Toyota", model: "Corolla", type: "Sedan",
    pricePerDay: 45, year: 2022, horsepower: 139, mileageKm: 34200, color: "White", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Fuel-efficient sedan with a smooth and comfortable ride. Ideal for city driving and longer highway journeys.",
    imageUrl: "https://i.pinimg.com/1200x/8c/6b/7b/8c6b7b1cb1dda7121cc3ddc1771047e9.jpg",
  },
  {
    brand: "Toyota", model: "Camry", type: "Sedan",
    pricePerDay: 55, year: 2023, horsepower: 203, mileageKm: 22100, color: "White and Black", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Debrecen",
    description: "Mid-size sedan with a spacious cabin, refined ride quality, and Toyota legendary reliability.",
    imageUrl: "https://i.pinimg.com/1200x/73/15/29/731529e3438114b42d5cf0b2675663b1.jpg",
  },
  {
    brand: "Toyota", model: "Land Cruiser", type: "SUV",
    pricePerDay: 140, year: 2022, horsepower: 305, mileageKm: 28900, color: "Black", seats: 7, transmission: "Automatic", fuelType: "Diesel",
    city: "Gyor",
    description: "Legendary full-size SUV with serious off-road capability, 7-seat comfort, and outstanding durability.",
    imageUrl: "https://i.pinimg.com/736x/09/a8/0a/09a80a88311b66b4a46aa1a5801e6313.jpg",
  },
  {
    brand: "Toyota", model: "Yaris", type: "Hatchback",
    pricePerDay: 35, year: 2022, horsepower: 125, mileageKm: 37100, color: "Silver", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Pecs",
    description: "Compact and nimble city car. Easy to park and economical to run - the perfect urban companion.",
    imageUrl: "https://i.pinimg.com/736x/04/bb/1e/04bb1e68c0a342c1a3249858d4f490e3.jpg",
  },

  {
    brand: "BMW", model: "X5", type: "SUV",
    pricePerDay: 120, year: 2023, horsepower: 335, mileageKm: 16400, color: "Blue", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "Premium luxury SUV with powerful xDrive AWD, adaptive air suspension, and a commanding road presence.",
    imageUrl: "https://i.pinimg.com/736x/55/72/f1/5572f10de71e32a60aaa9fa872178ac4.jpg",
  },
  {
    brand: "BMW", model: "3 Series", type: "Sedan",
    pricePerDay: 95, year: 2023, horsepower: 255, mileageKm: 19800, color: "Mineral Grey", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Sporty sedan with elegant design, cutting-edge iDrive technology, and BMW signature driving dynamics.",
    imageUrl: "https://i.pinimg.com/736x/6f/d8/63/6fd863bb16c2797148d5ca003ea31618.jpg",
  },
  {
    brand: "BMW", model: "5 Series", type: "Sedan",
    pricePerDay: 110, year: 2022, horsepower: 248, mileageKm: 31200, color: "Black Sapphire", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Miskolc",
    description: "Executive sedan combining effortless luxury, high performance, and innovative technology features.",
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop",
  },
  {
    brand: "BMW", model: "X3", type: "SUV",
    pricePerDay: 100, year: 2023, horsepower: 248, mileageKm: 14300, color: "Silver", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Debrecen",
    description: "A sporty and versatile SUV that excels on road and light off-road with xDrive AWD.",
    imageUrl: "https://i.pinimg.com/1200x/05/64/7a/05647a834b5709ec40ac970af2eb4605.jpg",
  },
  {
    brand: "BMW", model: "M4", type: "Coupe",
    pricePerDay: 180, year: 2023, horsepower: 473, mileageKm: 9700, color: "White", seats: 4, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Race-bred high-performance coupe with M TwinPower Turbo engine and Competition chassis.",
    imageUrl: "https://i.pinimg.com/1200x/2e/ce/7b/2ece7b46c38d2ce0df1fbd6993b8bb64.jpg",
  },

  {
    brand: "Audi", model: "A3", type: "Hatchback",
    pricePerDay: 70, year: 2022, horsepower: 201, mileageKm: 28600, color: "Navarra Blue", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Gyor",
    description: "Compact premium hatchback with quattro traction, a refined interior, and agile city handling.",
    imageUrl: "https://i.pinimg.com/736x/f0/89/a3/f089a3acc12386a08b9eb4acf593ab2d.jpg",
  },
  {
    brand: "Audi", model: "Q7", type: "SUV",
    pricePerDay: 130, year: 2022, horsepower: 335, mileageKm: 33700, color: "Silver", seats: 7, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "Full-size luxury SUV with three-row seating, air suspension, and a sophisticated virtual cockpit.",
    imageUrl: "https://i.pinimg.com/1200x/59/0b/45/590b4513444ec66b9d0dc43391fdd1c4.jpg",
  },
  {
    brand: "Audi", model: "A6", type: "Sedan",
    pricePerDay: 110, year: 2022, horsepower: 335, mileageKm: 29800, color: "Silver", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Executive sedan with sophisticated progressive design, MHEV technology, and a tech-rich MMI cockpit.",
    imageUrl: "https://i.pinimg.com/1200x/fa/c8/fe/fac8fe7685d794a2b09215a9252319e7.jpg",
  },
  {
    brand: "Audi", model: "Q5", type: "SUV",
    pricePerDay: 105, year: 2023, horsepower: 261, mileageKm: 17600, color: "Daytona Grey", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Pecs",
    description: "Mid-size luxury SUV with quattro AWD, smooth ride quality, and opulent Valcona leather interior.",
    imageUrl: "https://i.pinimg.com/1200x/1d/e2/59/1de2599c2befa57c77c924b54a5012e6.jpg",
  },
  {
    brand: "Audi", model: "TT", type: "Coupe",
    pricePerDay: 130, year: 2021, horsepower: 228, mileageKm: 42800, color: "Tango Red", seats: 2, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Iconic sporty coupe with timeless Bauhaus design, sharp steering, and a driver-focused cockpit.",
    imageUrl: "https://i.pinimg.com/736x/60/09/86/600986d445204cc4e27001d95125c514.jpg",
  },

  {
    brand: "Tesla", model: "Model 3", type: "Electric",
    pricePerDay: 90, year: 2023, horsepower: 271, mileageKm: 15200, color: "White", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "All-electric sedan with Autopilot, 500+ km range, and instant 0-100 acceleration in under 6 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
  },
  {
    brand: "Tesla", model: "Model Y", type: "Electric",
    pricePerDay: 110, year: 2023, horsepower: 425, mileageKm: 12800, color: "White", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "Electric crossover with panoramic roof, spacious cargo area, and Supercharger network access.",
    imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop",
  },
  {
    brand: "Tesla", model: "Model S", type: "Electric",
    pricePerDay: 150, year: 2023, horsepower: 1020, mileageKm: 10600, color: "Solid Black", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Debrecen",
    description: "Flagship electric sedan with Plaid powertrain, 600+ km range, and ludicrous 0-100 in 2.1 seconds.",
    imageUrl: "https://i.pinimg.com/1200x/50/a9/63/50a96367d6aabecdc7c49cbc14c17174.jpg",
  },
  {
    brand: "Tesla", model: "Model X", type: "Electric",
    pricePerDay: 170, year: 2022, horsepower: 670, mileageKm: 24100, color: "Midnight Silver", seats: 7, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "All-electric full-size SUV with signature Falcon Wing doors, 7 seats, and exceptional performance.",
    imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&auto=format&fit=crop",
  },

  {
    brand: "Mercedes", model: "C-Class", type: "Sedan",
    pricePerDay: 105, year: 2023, horsepower: 255, mileageKm: 16900, color: "Silver", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Refined luxury sedan with an opulent Mercedes interior, MBUX infotainment, and silky smooth ride.",
    imageUrl: "https://i.pinimg.com/736x/20/af/d0/20afd06eaddc7b5b68b8c0d711276ef5.jpg",
  },
  {
    brand: "Mercedes", model: "E-Class", type: "Sedan",
    pricePerDay: 130, year: 2022, horsepower: 255, mileageKm: 31700, color: "Iridium Silver", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "The quintessential executive sedan - spacious, supremely comfortable, and packed with safety tech.",
    imageUrl: "https://i.pinimg.com/1200x/a8/80/f1/a880f1c2985116167207770fa0c39a76.jpg",
  },
  {
    brand: "Mercedes", model: "GLE", type: "SUV",
    pricePerDay: 145, year: 2023, horsepower: 362, mileageKm: 13500, color: "Polar White", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Miskolc",
    description: "Flagship Mercedes SUV with air suspension, a plush two-row cabin, and advanced E-ACTIVE BODY CONTROL.",
    imageUrl: "https://i.pinimg.com/1200x/8e/2c/51/8e2c51db91166927627b24ce00ff0d17.jpg",
  },
  {
    brand: "Mercedes", model: "A-Class", type: "Hatchback",
    pricePerDay: 85, year: 2022, horsepower: 188, mileageKm: 26400, color: "Mountain Grey", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Pecs",
    description: "Entry-level premium hatchback with the iconic MBUX voice assistant and standout progressive design.",
    imageUrl: "https://i.pinimg.com/1200x/b6/ec/af/b6ecaf6843fbd47e68e056c3571a9048.jpg",
  },
  {
    brand: "Mercedes", model: "GLC", type: "SUV",
    pricePerDay: 120, year: 2023, horsepower: 255, mileageKm: 15700, color: "Selenite Grey", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Gyor",
    description: "Stylish mid-size SUV blending a sporty character with quintessential Mercedes luxury and refinement.",
    imageUrl: "https://i.pinimg.com/736x/79/ab/11/79ab1138834d0a45828871562366641c.jpg",
  },

  {
    brand: "Volkswagen", model: "Golf", type: "Hatchback",
    pricePerDay: 50, year: 2022, horsepower: 147, mileageKm: 38900, color: "Grey", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Budapest",
    description: "Europe best-selling hatchback - practical, fun to drive, well-built, and great value for money.",
    imageUrl: "https://i.pinimg.com/736x/27/14/83/2714838c0a95fffb71683439b95e0065.jpg",
  },
  {
    brand: "Volkswagen", model: "Passat", type: "Sedan",
    pricePerDay: 60, year: 2021, horsepower: 174, mileageKm: 52100, color: "Reflex Silver", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Debrecen",
    description: "Spacious family sedan with a large 586L boot, refined TDI engine, and comfortable long-distance ride.",
    imageUrl: "https://i.pinimg.com/1200x/a1/39/6d/a1396dd6707e8d453d660ade30701488.jpg",
  },
  {
    brand: "Volkswagen", model: "Tiguan", type: "SUV",
    pricePerDay: 75, year: 2023, horsepower: 184, mileageKm: 21400, color: "Silver", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Gyor",
    description: "VW best-selling SUV with great practicality, safety assistant features, and a premium feel.",
    imageUrl: "https://i.pinimg.com/1200x/e1/21/a6/e121a6d90594f18115e39a1ad1cc6fd7.jpg",
  },
  {
    brand: "Volkswagen", model: "Polo", type: "Hatchback",
    pricePerDay: 38, year: 2022, horsepower: 95, mileageKm: 35300, color: "Grey", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Pecs",
    description: "Small yet premium city hatchback with punchy TSI engine, perfect for urban commutes on a budget.",
    imageUrl: "https://i.pinimg.com/1200x/0f/8a/a3/0f8aa34302a19b423ee63cfc6020b89a.jpg",
  },

  {
    brand: "Honda", model: "Civic", type: "Sedan",
    pricePerDay: 50, year: 2022, horsepower: 158, mileageKm: 33100, color: "Light gray", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Miskolc",
    description: "Sporty and reliable compact sedan with Honda trusted build quality and fun-to-drive character.",
    imageUrl: "https://i.pinimg.com/736x/e6/25/b2/e625b2e0e78a5cd2c7a930d270e72659.jpg",
  },
  {
    brand: "Honda", model: "CR-V", type: "SUV",
    pricePerDay: 72, year: 2023, horsepower: 190, mileageKm: 18200, color: "Crystal Black", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Practical and family-friendly SUV with Honda Sensing safety suite and spacious dual-zone interior.",
    imageUrl: "https://i.pinimg.com/1200x/7c/8f/c2/7c8fc22ebc3a5bf3fd34734f52cc0069.jpg",
  },
  {
    brand: "Honda", model: "HR-V", type: "SUV",
    pricePerDay: 60, year: 2022, horsepower: 131, mileageKm: 27600, color: "red", seats: 5, transmission: "Automatic", fuelType: "Hybrid",
    city: "Pecs",
    description: "Compact hybrid SUV with Honda e:HEV two-motor system for efficient and responsive city driving.",
    imageUrl: "https://i.pinimg.com/736x/06/1f/40/061f4092d723efbee368f969a05eabc9.jpg",
  },

  {
    brand: "Ford", model: "Focus", type: "Hatchback",
    pricePerDay: 45, year: 2021, horsepower: 125, mileageKm: 48700, color: "Magnetic Grey", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Debrecen",
    description: "Award-winning compact hatchback with sharp driving dynamics and a practical boot. A driver choice.",
    imageUrl: "https://i.pinimg.com/736x/df/57/61/df5761f9c35779c6f9a782bf4f31b274.jpg",
  },
  {
    brand: "Ford", model: "Mustang", type: "Coupe",
    pricePerDay: 150, year: 2023, horsepower: 470, mileageKm: 11200, color: "Black", seats: 4, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "The iconic American muscle car with available V8 engine, signature roar, and head-turning style.",
    imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop",
  },
  {
    brand: "Ford", model: "Puma", type: "Hatchback",
    pricePerDay: 52, year: 2022, horsepower: 125, mileageKm: 30400, color: "Desert Island Blue", seats: 5, transmission: "Automatic", fuelType: "Hybrid",
    city: "Miskolc",
    description: "Modern crossover hatchback with mild-hybrid EcoBoost engine, sporty stance, and a mega MegaBox boot.",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop",
  },

  {
    brand: "Porsche", model: "Cayenne", type: "SUV",
    pricePerDay: 200, year: 2023, horsepower: 453, mileageKm: 8900, color: "Black edition", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "The ultimate performance SUV. Supercar soul with everyday practicality - 0-100 km/h in 4.1 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
  },
];

async function main() {
  console.log(`Seeding database... (${cars.length} cars total)`);

  await prisma.booking.deleteMany();
  console.log("  Cleared bookings");

  await prisma.car.deleteMany();
  console.log("  Cleared cars (favorites & reviews cascaded)");

  for (const car of cars) {
    await prisma.car.create({ data: car });
  }
  console.log(`  Inserted ${cars.length} cars`);

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
    create: {
      name: "Admin",
      email: "admin@test.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("  Ensured admin user: admin@test.com / admin123");
  console.log("Done! Users are preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
