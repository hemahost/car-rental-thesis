import { Router, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";
import { expirePendingBookings } from "../utils/bookingExpiration";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const stripe = new (require("stripe"))(process.env.STRIPE_SECRET_KEY as string);

const router = Router();
const MAX_BOOKING_ADVANCE_DAYS = 365;
const MAX_BOOKING_DURATION_DAYS = 30;

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function getBookingDateValidation(start: Date, end: Date): string | null {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid date format";
  }

  if (start >= end) {
    return "Start date must be before end date";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return "Start date cannot be in the past";
  }

  if (end < today) {
    return "End date cannot be in the past";
  }

  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (durationDays > MAX_BOOKING_DURATION_DAYS) {
    return `Bookings cannot be longer than ${MAX_BOOKING_DURATION_DAYS} days`;
  }

  const latestAllowedStart = new Date(today);
  latestAllowedStart.setDate(latestAllowedStart.getDate() + MAX_BOOKING_ADVANCE_DAYS);

  if (start > latestAllowedStart || end > latestAllowedStart) {
    return `Bookings can only be made up to ${MAX_BOOKING_ADVANCE_DAYS} days in advance`;
  }

  return null;
}

// GET /api/bookings/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await expirePendingBookings({ userId: req.userId! });

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

    const start = parseDateOnly(startDate as string);
    const end = parseDateOnly(endDate as string);
    const validationError = getBookingDateValidation(start, end);
    if (validationError) {
      return sendError(res, validationError, 400);
    }

    await expirePendingBookings({ carId: carId as string });

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

    return sendSuccess(res, {
      available,
      conflictingBookings: conflicting.length,
      conflictingRanges: conflicting.map((booking) => ({
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
      })),
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to check availability", 500);
  }
});

// GET /api/bookings/unavailable/:carId
router.get("/unavailable/:carId", async (req, res) => {
  try {
    const { carId } = req.params;

    await expirePendingBookings({ carId });

    const unavailableBookings = await prisma.booking.findMany({
      where: {
        carId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { startDate: "asc" },
    });

    return sendSuccess(res, { unavailableBookings });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch unavailable booking dates", 500);
  }
});

// POST /api/bookings
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { carId, startDate, endDate, pickupLocation, dropoffLocation } = req.body;

    if (!carId || !startDate || !endDate) {
      return sendError(res, "carId, startDate, and endDate are required", 400);
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    const validationError = getBookingDateValidation(start, end);
    if (validationError) {
      return sendError(res, validationError, 400);
    }

    await expirePendingBookings({ carId });

    const normalizedPickupLocation =
      typeof pickupLocation === "string" ? pickupLocation.trim().replace(/\s+/g, " ") : "";
    const normalizedDropoffLocation =
      typeof dropoffLocation === "string" ? dropoffLocation.trim().replace(/\s+/g, " ") : "";

    if (!normalizedPickupLocation || !normalizedDropoffLocation) {
      return sendError(res, "Pick-up and drop-off locations are required", 400);
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
        pickupLocation: normalizedPickupLocation,
        dropoffLocation: normalizedDropoffLocation,
      },
      include: {
        car: {
          select: { id: true, brand: true, model: true, type: true, pricePerDay: true },
        },
      },
    });

    // Email is sent by the payment webhook on successful payment
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

    // If already paid, issue a Stripe refund
    if (booking.paymentStatus === "PAID" && booking.paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
        });
        return sendSuccess(res, { message: "Booking cancelled and payment refunded" });
      } catch (refundErr) {
        console.error("Stripe refund failed:", refundErr);
        return sendError(res, "Failed to process refund", 500);
      }
    }

    // Not paid yet — just cancel
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    return sendSuccess(res, { message: "Booking cancelled" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to cancel booking", 500);
  }
});

export default router;
