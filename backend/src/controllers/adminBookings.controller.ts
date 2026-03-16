import { Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

// GET /api/admin/bookings
export async function getAdminBookings(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query;

    const where: any = {};
    const validStatuses = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];
    if (status && validStatuses.includes(status as string)) {
      where.status = status as string;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, brand: true, model: true, type: true, pricePerDay: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, { bookings });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch bookings", 500);
  }
}

// PATCH /api/admin/bookings/:id/status
export async function updateBookingStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, "Status must be one of: PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED");
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "Booking not found", 404);
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, brand: true, model: true, type: true, pricePerDay: true } },
      },
    });

    return sendSuccess(res, { booking });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to update booking status", 500);
  }
}
