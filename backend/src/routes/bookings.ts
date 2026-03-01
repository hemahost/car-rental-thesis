import { Router, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/bookings/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId },
      include: {
        car: {
          select: { id: true, brand: true, model: true, type: true, pricePerDay: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, { bookings });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch bookings", 500);
  }
});

// DELETE /api/bookings/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
    });

    if (!booking) {
      return sendError(res, "Booking not found", 404);
    }

    if (booking.userId !== req.userId) {
      return sendError(res, "Not authorized", 403);
    }

    await prisma.booking.delete({ where: { id: booking.id } });

    return sendSuccess(res, { message: "Booking cancelled" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to cancel booking", 500);
  }
});

export default router;
