import { Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

// GET /api/admin/cars
export async function getAdminCars(req: AuthRequest, res: Response) {
  try {
    const cars = await prisma.car.findMany({ orderBy: { createdAt: "desc" } });
    return sendSuccess(res, { cars });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch cars", 500);
  }
}

// POST /api/admin/cars
export async function createCar(req: AuthRequest, res: Response) {
  try {
    const { brand, model, type, pricePerDay, description, imageUrl, city, seats, transmission, fuelType, year } = req.body;

    if (!brand || !model || !type || pricePerDay == null || !description) {
      return sendError(res, "brand, model, type, pricePerDay, and description are required");
    }

    if (typeof pricePerDay !== "number" || pricePerDay <= 0) {
      return sendError(res, "pricePerDay must be a positive number");
    }

    const car = await prisma.car.create({
      data: {
        brand, model, type, pricePerDay, description,
        imageUrl: imageUrl || null, city: city || null,
        seats: seats || null, transmission: transmission || null,
        fuelType: fuelType || null, year: year || null,
      },
    });

    return sendSuccess(res, { car }, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to create car", 500);
  }
}

// PUT /api/admin/cars/:id
export async function updateCar(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { brand, model, type, pricePerDay, description, imageUrl, city, seats, transmission, fuelType, year } = req.body;

    if (!brand || !model || !type || pricePerDay == null || !description) {
      return sendError(res, "brand, model, type, pricePerDay, and description are required");
    }

    if (typeof pricePerDay !== "number" || pricePerDay <= 0) {
      return sendError(res, "pricePerDay must be a positive number");
    }

    const existing = await prisma.car.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "Car not found", 404);
    }

    const car = await prisma.car.update({
      where: { id },
      data: {
        brand, model, type, pricePerDay, description,
        imageUrl: imageUrl || null, city: city || null,
        seats: seats || null, transmission: transmission || null,
        fuelType: fuelType || null, year: year || null,
      },
    });

    return sendSuccess(res, { car });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to update car", 500);
  }
}

// DELETE /api/admin/cars/:id
export async function deleteCar(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const existing = await prisma.car.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "Car not found", 404);
    }

    // Delete related bookings first
    await prisma.booking.deleteMany({ where: { carId: id } });
    await prisma.car.delete({ where: { id } });

    return sendSuccess(res, { message: "Car deleted successfully" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to delete car", 500);
  }
}
