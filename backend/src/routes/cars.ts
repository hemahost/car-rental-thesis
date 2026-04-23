import { Router, Request, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/cars
router.get("/", async (req: Request, res: Response) => {
  try {
    const { brand, type, minPrice, maxPrice, transmission, fuelType, seats, minHorsepower, maxHorsepower, minMileageKm, maxMileageKm, color } = req.query;

    const where: any = {};

    if (brand) {
      where.brand = { equals: brand as string, mode: "insensitive" };
    }

    if (type) {
      where.type = { equals: type as string, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerDay.lte = parseFloat(maxPrice as string);
    }

    if (transmission) {
      where.transmission = { equals: transmission as string, mode: "insensitive" };
    }

    if (fuelType) {
      where.fuelType = { equals: fuelType as string, mode: "insensitive" };
    }

    if (color) {
      where.color = { contains: color as string, mode: "insensitive" };
    }

    if (seats) {
      where.seats = parseInt(seats as string);
    }

    if (minHorsepower || maxHorsepower) {
      where.horsepower = {};
      if (minHorsepower) where.horsepower.gte = parseInt(minHorsepower as string, 10);
      if (maxHorsepower) where.horsepower.lte = parseInt(maxHorsepower as string, 10);
    }

    if (minMileageKm || maxMileageKm) {
      where.mileageKm = {};
      if (minMileageKm) where.mileageKm.gte = parseInt(minMileageKm as string, 10);
      if (maxMileageKm) where.mileageKm.lte = parseInt(maxMileageKm as string, 10);
    }

    const carsRaw = await prisma.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { reviews: { select: { rating: true } } },
    });

    const cars = carsRaw.map(({ reviews, ...car }) => ({
      ...car,
      avgRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      reviewCount: reviews.length,
    }));

    return sendSuccess(res, { cars });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch cars", 500);
  }
});

// GET /api/cars/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const carRaw = await prisma.car.findUnique({
      where: { id: req.params.id as string },
      include: { reviews: { select: { rating: true } } },
    });

    if (!carRaw) {
      return sendError(res, "Car not found", 404);
    }

    const { reviews, ...carData } = carRaw;
    const car = {
      ...carData,
      avgRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      reviewCount: reviews.length,
    };

    return sendSuccess(res, { car });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch car", 500);
  }
});

export default router;
