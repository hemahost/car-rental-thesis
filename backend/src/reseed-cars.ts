/**
 * reseed-cars.ts
 * Clears all cars (cascades favorites & reviews), deletes related bookings,
 * then inserts 35 fully-detailed cars. Does NOT touch User records.
 */
import dotenv from "dotenv";
dotenv.config();
import prisma from "./db/prisma";

const cars = [
  // === TOYOTA ===
  {
    brand: "Toyota", model: "RAV4", type: "SUV",
    pricePerDay: 65, year: 2023, horsepower: 203, mileageKm: 18500, color: "Midnight Blue", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "A reliable and spacious SUV perfect for family trips and light off-road adventures. Features Toyota Safety Sense as standard.",
    imageUrl: "https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=800&auto=format&fit=crop",
  },
  {
    brand: "Toyota", model: "Corolla", type: "Sedan",
    pricePerDay: 45, year: 2022, horsepower: 139, mileageKm: 34200, color: "Silver", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Fuel-efficient sedan with a smooth and comfortable ride. Ideal for city driving and longer highway journeys.",
    imageUrl: "https://images.unsplash.com/photo-1623005329892-3e5b1c9f7b4a?w=800&auto=format&fit=crop",
  },
  {
    brand: "Toyota", model: "Camry", type: "Sedan",
    pricePerDay: 55, year: 2023, horsepower: 203, mileageKm: 22100, color: "Pearl White", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Debrecen",
    description: "Mid-size sedan with a spacious cabin, refined ride quality, and Toyota legendary reliability.",
    imageUrl: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&auto=format&fit=crop",
  },
  {
    brand: "Toyota", model: "Land Cruiser", type: "SUV",
    pricePerDay: 140, year: 2022, horsepower: 305, mileageKm: 28900, color: "Black", seats: 7, transmission: "Automatic", fuelType: "Diesel",
    city: "Gyor",
    description: "Legendary full-size SUV with serious off-road capability, 7-seat comfort, and outstanding durability.",
    imageUrl: "https://images.unsplash.com/photo-1519641010743-9fd2d403e0e6?w=800&auto=format&fit=crop",
  },
  {
    brand: "Toyota", model: "Yaris", type: "Hatchback",
    pricePerDay: 35, year: 2022, horsepower: 125, mileageKm: 37100, color: "Red", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Pecs",
    description: "Compact and nimble city car. Easy to park and economical to run - the perfect urban companion.",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop",
  },

  // === BMW ===
  {
    brand: "BMW", model: "X5", type: "SUV",
    pricePerDay: 120, year: 2023, horsepower: 335, mileageKm: 16400, color: "Alpine White", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "Premium luxury SUV with powerful xDrive AWD, adaptive air suspension, and a commanding road presence.",
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop",
  },
  {
    brand: "BMW", model: "3 Series", type: "Sedan",
    pricePerDay: 95, year: 2023, horsepower: 255, mileageKm: 19800, color: "Mineral Grey", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Sporty sedan with elegant design, cutting-edge iDrive technology, and BMW signature driving dynamics.",
    imageUrl: "https://images.unsplash.com/photo-1617814076229-5b4669b14932?w=800&auto=format&fit=crop",
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
    pricePerDay: 100, year: 2023, horsepower: 248, mileageKm: 14300, color: "Phytonic Blue", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Debrecen",
    description: "A sporty and versatile SUV that excels on road and light off-road with xDrive AWD.",
    imageUrl: "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=800&auto=format&fit=crop",
  },
  {
    brand: "BMW", model: "M4", type: "Coupe",
    pricePerDay: 180, year: 2023, horsepower: 473, mileageKm: 9700, color: "Sao Paulo Yellow", seats: 4, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Race-bred high-performance coupe with M TwinPower Turbo engine and Competition chassis.",
    imageUrl: "https://images.unsplash.com/photo-1607853554408-a3b5ccfcb44c?w=800&auto=format&fit=crop",
  },

  // === AUDI ===
  {
    brand: "Audi", model: "A3", type: "Hatchback",
    pricePerDay: 70, year: 2022, horsepower: 201, mileageKm: 28600, color: "Navarra Blue", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Gyor",
    description: "Compact premium hatchback with quattro traction, a refined interior, and agile city handling.",
    imageUrl: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop",
  },
  {
    brand: "Audi", model: "Q7", type: "SUV",
    pricePerDay: 130, year: 2022, horsepower: 335, mileageKm: 33700, color: "Mythos Black", seats: 7, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "Full-size luxury SUV with three-row seating, air suspension, and a sophisticated virtual cockpit.",
    imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop",
  },
  {
    brand: "Audi", model: "A6", type: "Sedan",
    pricePerDay: 110, year: 2022, horsepower: 335, mileageKm: 29800, color: "Glacier White", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Executive sedan with sophisticated progressive design, MHEV technology, and a tech-rich MMI cockpit.",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
  },
  {
    brand: "Audi", model: "Q5", type: "SUV",
    pricePerDay: 105, year: 2023, horsepower: 261, mileageKm: 17600, color: "Daytona Grey", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Pecs",
    description: "Mid-size luxury SUV with quattro AWD, smooth ride quality, and opulent Valcona leather interior.",
    imageUrl: "https://images.unsplash.com/photo-1544829735-c042b5dc96b6?w=800&auto=format&fit=crop",
  },
  {
    brand: "Audi", model: "TT", type: "Coupe",
    pricePerDay: 130, year: 2021, horsepower: 228, mileageKm: 42800, color: "Tango Red", seats: 2, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Iconic sporty coupe with timeless Bauhaus design, sharp steering, and a driver-focused cockpit.",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop",
  },

  // === TESLA ===
  {
    brand: "Tesla", model: "Model 3", type: "Electric",
    pricePerDay: 90, year: 2023, horsepower: 271, mileageKm: 15200, color: "Pearl White", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "All-electric sedan with Autopilot, 500+ km range, and instant 0-100 acceleration in under 6 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
  },
  {
    brand: "Tesla", model: "Model Y", type: "Electric",
    pricePerDay: 110, year: 2023, horsepower: 425, mileageKm: 12800, color: "Deep Blue", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "Electric crossover with panoramic roof, spacious cargo area, and Supercharger network access.",
    imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop",
  },
  {
    brand: "Tesla", model: "Model S", type: "Electric",
    pricePerDay: 150, year: 2023, horsepower: 1020, mileageKm: 10600, color: "Solid Black", seats: 5, transmission: "Automatic", fuelType: "Electric",
    city: "Debrecen",
    description: "Flagship electric sedan with Plaid powertrain, 600+ km range, and ludicrous 0-100 in 2.1 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1571987502951-3b8b8e15d3af?w=800&auto=format&fit=crop",
  },
  {
    brand: "Tesla", model: "Model X", type: "Electric",
    pricePerDay: 170, year: 2022, horsepower: 670, mileageKm: 24100, color: "Midnight Silver", seats: 7, transmission: "Automatic", fuelType: "Electric",
    city: "Budapest",
    description: "All-electric full-size SUV with signature Falcon Wing doors, 7 seats, and exceptional performance.",
    imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&auto=format&fit=crop",
  },

  // === MERCEDES ===
  {
    brand: "Mercedes", model: "C-Class", type: "Sedan",
    pricePerDay: 105, year: 2023, horsepower: 255, mileageKm: 16900, color: "Obsidian Black", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Refined luxury sedan with an opulent Mercedes interior, MBUX infotainment, and silky smooth ride.",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop",
  },
  {
    brand: "Mercedes", model: "E-Class", type: "Sedan",
    pricePerDay: 130, year: 2022, horsepower: 255, mileageKm: 31700, color: "Iridium Silver", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Budapest",
    description: "The quintessential executive sedan - spacious, supremely comfortable, and packed with safety tech.",
    imageUrl: "https://images.unsplash.com/photo-1595880723089-357e49c3d951?w=800&auto=format&fit=crop",
  },
  {
    brand: "Mercedes", model: "GLE", type: "SUV",
    pricePerDay: 145, year: 2023, horsepower: 362, mileageKm: 13500, color: "Polar White", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Miskolc",
    description: "Flagship Mercedes SUV with air suspension, a plush two-row cabin, and advanced E-ACTIVE BODY CONTROL.",
    imageUrl: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop",
  },
  {
    brand: "Mercedes", model: "A-Class", type: "Hatchback",
    pricePerDay: 85, year: 2022, horsepower: 188, mileageKm: 26400, color: "Mountain Grey", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Pecs",
    description: "Entry-level premium hatchback with the iconic MBUX voice assistant and standout progressive design.",
    imageUrl: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop",
  },
  {
    brand: "Mercedes", model: "GLC", type: "SUV",
    pricePerDay: 120, year: 2023, horsepower: 255, mileageKm: 15700, color: "Selenite Grey", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Gyor",
    description: "Stylish mid-size SUV blending a sporty character with quintessential Mercedes luxury and refinement.",
    imageUrl: "https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800&auto=format&fit=crop",
  },

  // === VOLKSWAGEN ===
  {
    brand: "Volkswagen", model: "Golf", type: "Hatchback",
    pricePerDay: 50, year: 2022, horsepower: 147, mileageKm: 38900, color: "Atlantic Blue", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Budapest",
    description: "Europe best-selling hatchback - practical, fun to drive, well-built, and great value for money.",
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop",
  },
  {
    brand: "Volkswagen", model: "Passat", type: "Sedan",
    pricePerDay: 60, year: 2021, horsepower: 174, mileageKm: 52100, color: "Reflex Silver", seats: 5, transmission: "Automatic", fuelType: "Diesel",
    city: "Debrecen",
    description: "Spacious family sedan with a large 586L boot, refined TDI engine, and comfortable long-distance ride.",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop",
  },
  {
    brand: "Volkswagen", model: "Tiguan", type: "SUV",
    pricePerDay: 75, year: 2023, horsepower: 184, mileageKm: 21400, color: "Pure White", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Gyor",
    description: "VW best-selling SUV with great practicality, safety assistant features, and a premium feel.",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
  },
  {
    brand: "Volkswagen", model: "Polo", type: "Hatchback",
    pricePerDay: 38, year: 2022, horsepower: 95, mileageKm: 35300, color: "Flash Red", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Pecs",
    description: "Small yet premium city hatchback with punchy TSI engine, perfect for urban commutes on a budget.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop",
  },

  // === HONDA ===
  {
    brand: "Honda", model: "Civic", type: "Sedan",
    pricePerDay: 50, year: 2022, horsepower: 158, mileageKm: 33100, color: "Sonic Grey", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Miskolc",
    description: "Sporty and reliable compact sedan with Honda trusted build quality and fun-to-drive character.",
    imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop",
  },
  {
    brand: "Honda", model: "CR-V", type: "SUV",
    pricePerDay: 72, year: 2023, horsepower: 190, mileageKm: 18200, color: "Crystal Black", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "Practical and family-friendly SUV with Honda Sensing safety suite and spacious dual-zone interior.",
    imageUrl: "https://images.unsplash.com/photo-1519641010743-9fd2d403e0e6?w=800&auto=format&fit=crop",
  },
  {
    brand: "Honda", model: "HR-V", type: "SUV",
    pricePerDay: 60, year: 2022, horsepower: 131, mileageKm: 27600, color: "Platinum White", seats: 5, transmission: "Automatic", fuelType: "Hybrid",
    city: "Pecs",
    description: "Compact hybrid SUV with Honda e:HEV two-motor system for efficient and responsive city driving.",
    imageUrl: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop",
  },

  // === FORD ===
  {
    brand: "Ford", model: "Focus", type: "Hatchback",
    pricePerDay: 45, year: 2021, horsepower: 125, mileageKm: 48700, color: "Magnetic Grey", seats: 5, transmission: "Manual", fuelType: "Petrol",
    city: "Debrecen",
    description: "Award-winning compact hatchback with sharp driving dynamics and a practical boot. A driver choice.",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
  },
  {
    brand: "Ford", model: "Mustang", type: "Coupe",
    pricePerDay: 150, year: 2023, horsepower: 470, mileageKm: 11200, color: "Race Red", seats: 4, transmission: "Automatic", fuelType: "Petrol",
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

  // === PORSCHE ===
  {
    brand: "Porsche", model: "Cayenne", type: "SUV",
    pricePerDay: 200, year: 2023, horsepower: 453, mileageKm: 8900, color: "Carrara White", seats: 5, transmission: "Automatic", fuelType: "Petrol",
    city: "Budapest",
    description: "The ultimate performance SUV. Supercar soul with everyday practicality - 0-100 km/h in 4.1 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
  },
];

async function main() {
  console.log(`Reseeding cars... (${cars.length} cars total)`);

  await prisma.booking.deleteMany();
  console.log("  Cleared bookings");

  await prisma.car.deleteMany();
  console.log("  Cleared cars (favorites & reviews cascaded)");

  for (const car of cars) {
    await prisma.car.create({ data: car });
  }
  console.log(`  Inserted ${cars.length} cars`);
  console.log("Done! Users are preserved.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
