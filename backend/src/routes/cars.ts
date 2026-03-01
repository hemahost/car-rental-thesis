import { Router, Request, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/cars
router.get("/", async (req: Request, res: Response) => {
  try {
    const { brand, type, minPrice, maxPrice } = req.query;

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

    const cars = await prisma.car.findMany({ where, orderBy: { createdAt: "desc" } });

    return sendSuccess(res, { cars });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch cars", 500);
  }
});

// GET /api/cars/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const car = await prisma.car.findUnique({ where: { id: req.params.id as string } });

    if (!car) {
      return sendError(res, "Car not found", 404);
    }

    return sendSuccess(res, { car });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch car", 500);
  }
});

export default router;
