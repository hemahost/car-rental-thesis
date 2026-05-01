import { Router, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            type: true,
            pricePerDay: true,
            imageUrl: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, { favorites });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch favorites", 500);
  }
});

router.post("/:carId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.carId as string;

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return sendError(res, "Car not found", 404);
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_carId: { userId: req.userId!, carId } },
    });

    if (existing) {
      return sendSuccess(res, { favorite: existing, message: "Already in favorites" });
    }

    const favorite = await prisma.favorite.create({
      data: { userId: req.userId!, carId },
    });

    return sendSuccess(res, { favorite }, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to add favorite", 500);
  }
});

router.delete("/:carId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.carId as string;

    const existing = await prisma.favorite.findUnique({
      where: { userId_carId: { userId: req.userId!, carId } },
    });

    if (!existing) {
      return sendError(res, "Favorite not found", 404);
    }

    await prisma.favorite.delete({
      where: { id: existing.id },
    });

    return sendSuccess(res, { message: "Removed from favorites" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to remove favorite", 500);
  }
});

export default router;
