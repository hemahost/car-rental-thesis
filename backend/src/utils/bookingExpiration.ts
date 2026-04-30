import prisma from "../db/prisma";

export const BOOKING_HOLD_MINUTES = 3;

export function getPendingBookingExpiryCutoff(): Date {
  return new Date(Date.now() - BOOKING_HOLD_MINUTES * 60 * 1000);
}

export function isPendingBookingExpired(booking: {
  status: string;
  paymentStatus?: string | null;
  createdAt: Date;
}): boolean {
  return (
    booking.status === "PENDING" &&
    booking.paymentStatus !== "PAID" &&
    booking.createdAt <= getPendingBookingExpiryCutoff()
  );
}

export async function expirePendingBookings(filters?: {
  carId?: string;
  bookingId?: string;
  userId?: string;
}): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING",
      paymentStatus: { not: "PAID" },
      createdAt: { lte: getPendingBookingExpiryCutoff() },
      ...(filters?.carId ? { carId: filters.carId } : {}),
      ...(filters?.bookingId ? { id: filters.bookingId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
    },
    data: {
      status: "CANCELLED",
    },
  });

  return result.count;
}
