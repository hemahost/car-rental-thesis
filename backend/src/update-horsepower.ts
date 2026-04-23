import dotenv from "dotenv";
dotenv.config();

import prisma from "./db/prisma";

const horsepowerByCar = [
  { brand: "Toyota", model: "RAV4", horsepower: 203, mileageKm: 18500, color: "Midnight Blue" },
  { brand: "Toyota", model: "Corolla", horsepower: 139, mileageKm: 34200, color: "Silver" },
  { brand: "Toyota", model: "Camry", horsepower: 203, mileageKm: 22100, color: "Pearl White" },
  { brand: "Toyota", model: "Land Cruiser", horsepower: 305, mileageKm: 28900, color: "Black" },
  { brand: "Toyota", model: "Yaris", horsepower: 125, mileageKm: 37100, color: "Red" },
  { brand: "BMW", model: "X5", horsepower: 335, mileageKm: 16400, color: "Alpine White" },
  { brand: "BMW", model: "3 Series", horsepower: 255, mileageKm: 19800, color: "Mineral Grey" },
  { brand: "BMW", model: "5 Series", horsepower: 248, mileageKm: 31200, color: "Black Sapphire" },
  { brand: "BMW", model: "X3", horsepower: 248, mileageKm: 14300, color: "Phytonic Blue" },
  { brand: "BMW", model: "M4", horsepower: 473, mileageKm: 9700, color: "Sao Paulo Yellow" },
  { brand: "Audi", model: "A3", horsepower: 201, mileageKm: 28600, color: "Navarra Blue" },
  { brand: "Audi", model: "Q7", horsepower: 335, mileageKm: 33700, color: "Mythos Black" },
  { brand: "Audi", model: "A6", horsepower: 335, mileageKm: 29800, color: "Glacier White" },
  { brand: "Audi", model: "Q5", horsepower: 261, mileageKm: 17600, color: "Daytona Grey" },
  { brand: "Audi", model: "TT", horsepower: 228, mileageKm: 42800, color: "Tango Red" },
  { brand: "Tesla", model: "Model 3", horsepower: 271, mileageKm: 15200, color: "Pearl White" },
  { brand: "Tesla", model: "Model Y", horsepower: 425, mileageKm: 12800, color: "Deep Blue" },
  { brand: "Tesla", model: "Model S", horsepower: 1020, mileageKm: 10600, color: "Solid Black" },
  { brand: "Tesla", model: "Model X", horsepower: 670, mileageKm: 24100, color: "Midnight Silver" },
  { brand: "Mercedes", model: "C-Class", horsepower: 255, mileageKm: 16900, color: "Obsidian Black" },
  { brand: "Mercedes", model: "E-Class", horsepower: 255, mileageKm: 31700, color: "Iridium Silver" },
  { brand: "Mercedes", model: "GLE", horsepower: 362, mileageKm: 13500, color: "Polar White" },
  { brand: "Mercedes", model: "A-Class", horsepower: 188, mileageKm: 26400, color: "Mountain Grey" },
  { brand: "Mercedes", model: "GLC", horsepower: 255, mileageKm: 15700, color: "Selenite Grey" },
  { brand: "Volkswagen", model: "Golf", horsepower: 147, mileageKm: 38900, color: "Atlantic Blue" },
  { brand: "Volkswagen", model: "Passat", horsepower: 174, mileageKm: 52100, color: "Reflex Silver" },
  { brand: "Volkswagen", model: "Tiguan", horsepower: 184, mileageKm: 21400, color: "Pure White" },
  { brand: "Volkswagen", model: "Polo", horsepower: 95, mileageKm: 35300, color: "Flash Red" },
  { brand: "Honda", model: "Civic", horsepower: 158, mileageKm: 33100, color: "Sonic Grey" },
  { brand: "Honda", model: "CR-V", horsepower: 190, mileageKm: 18200, color: "Crystal Black" },
  { brand: "Honda", model: "HR-V", horsepower: 131, mileageKm: 27600, color: "Platinum White" },
  { brand: "Ford", model: "Focus", horsepower: 125, mileageKm: 48700, color: "Magnetic Grey" },
  { brand: "Ford", model: "Mustang", horsepower: 470, mileageKm: 11200, color: "Race Red" },
  { brand: "Ford", model: "Puma", horsepower: 125, mileageKm: 30400, color: "Desert Island Blue" },
  { brand: "Porsche", model: "Cayenne", horsepower: 453, mileageKm: 8900, color: "Carrara White" },
];

async function main() {
  for (const car of horsepowerByCar) {
    await prisma.car.updateMany({
      where: {
        brand: { equals: car.brand, mode: "insensitive" },
        model: { equals: car.model, mode: "insensitive" },
      },
      data: { horsepower: car.horsepower, mileageKm: car.mileageKm, color: car.color },
    });
  }

  console.log(`Updated horsepower, mileage, and color for ${horsepowerByCar.length} car models.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
