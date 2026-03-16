import { Router, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";
import { sendBookingConfirmationEmail } from "../utils/email";

const router = Router();

// GET /api/bookings/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId },
      include: {
        car: {
          select: { id: true, brand: true, model: true, type: true, pricePerDay: true, imageUrl: true },
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

// GET /api/bookings/availability?carId=xxx&startDate=xxx&endDate=xxx
router.get("/availability", async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.query;

    if (!carId || !startDate || !endDate) {
      return sendError(res, "carId, startDate, and endDate are required", 400);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendError(res, "Invalid date format", 400);
    }

    if (start >= end) {
      return sendError(res, "Start date must be before end date", 400);
    }

    // Find overlapping pending/confirmed/active bookings
    const conflicting = await prisma.booking.findMany({
      where: {
        carId: carId as string,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });

    const available = conflicting.length === 0;

    return sendSuccess(res, { available, conflictingBookings: conflicting.length });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to check availability", 500);
  }
});

// POST /api/bookings
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { carId, startDate, endDate } = req.body;

    if (!carId || !startDate || !endDate) {
      return sendError(res, "carId, startDate, and endDate are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendError(res, "Invalid date format", 400);
    }

    if (start >= end) {
      return sendError(res, "Start date must be before end date", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return sendError(res, "Start date cannot be in the past", 400);
    }

    // Check car exists
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return sendError(res, "Car not found", 404);
    }

    // Check availability (no overlapping confirmed/active bookings)
    const conflicting = await prisma.booking.findMany({
      where: {
        carId,
        status: { in: ["CONFIRMED", "ACTIVE", "PENDING"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });

    if (conflicting.length > 0) {
      return sendError(res, "Car is not available for the selected dates", 409);
    }

    // Calculate total price
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * car.pricePerDay;

    const booking = await prisma.booking.create({
      data: {
        userId: req.userId!,
        carId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: "PENDING",
      },
      include: {
        car: {
          select: { id: true, brand: true, model: true, type: true, pricePerDay: true },
        },
      },
    });

    // Send confirmation email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true, name: true } });
    if (user) {
      sendBookingConfirmationEmail(
        user.email,
        user.name,
        `${car.brand} ${car.model}`,
        start.toLocaleDateString(),
        end.toLocaleDateString(),
        days,
        totalPrice
      ).catch((err) => console.error("Failed to send booking email:", err));
    }

    return sendSuccess(res, { booking }, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to create booking", 500);
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
