import { sendBookingStatusEmail } from "../utils/email";

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface BookingStatusContext {
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  user?: {
    email: string;
    name: string;
  } | null;
  car: {
    brand: string;
    model: string;
  };
}

export interface BookingStatusStrategy {
  apply(booking: BookingStatusContext): void;
}

abstract class EmailBookingStatusStrategy implements BookingStatusStrategy {
  protected abstract readonly status: BookingStatus;

  apply(booking: BookingStatusContext): void {
    if (!booking.user) {
      return;
    }

    sendBookingStatusEmail(
      booking.user.email,
      booking.user.name,
      `${booking.car.brand} ${booking.car.model}`,
      this.status,
      booking.startDate.toLocaleDateString(),
      booking.endDate.toLocaleDateString(),
      booking.totalPrice
    ).catch((err) => console.error("Failed to send status email:", err));
  }
}

export class ConfirmBookingStatusStrategy extends EmailBookingStatusStrategy {
  protected readonly status = "CONFIRMED";
}

export class CancelBookingStatusStrategy extends EmailBookingStatusStrategy {
  protected readonly status = "CANCELLED";
}

export class DefaultBookingStatusStrategy implements BookingStatusStrategy {
  apply(_booking: BookingStatusContext): void {
  }
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && BOOKING_STATUSES.includes(value as BookingStatus);
}

export function getBookingStatusStrategy(status: BookingStatus): BookingStatusStrategy {
  switch (status) {
    case "CONFIRMED":
      return new ConfirmBookingStatusStrategy();
    case "CANCELLED":
      return new CancelBookingStatusStrategy();
    default:
      return new DefaultBookingStatusStrategy();
  }
}
