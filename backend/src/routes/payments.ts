import { Router, Request, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";
import { sendBookingConfirmationEmail } from "../utils/email";
import { BOOKING_HOLD_MINUTES, expirePendingBookings, isPendingBookingExpired } from "../utils/bookingExpiration";
import { paymentGateway } from "../adapters/stripePayment.adapter";

const router = Router();

router.post("/create-intent", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return sendError(res, "bookingId is required", 400);
    }

    await expirePendingBookings({ bookingId });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true, user: true },
    });

    if (!booking) {
      return sendError(res, "Booking not found", 404);
    }

    if (booking.userId !== req.userId) {
      return sendError(res, "Not authorized", 403);
    }

    if (isPendingBookingExpired(booking)) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
      return sendError(
        res,
        `This reservation expired after ${BOOKING_HOLD_MINUTES} minutes. Please book again.`,
        409
      );
    }

    if (booking.status !== "PENDING") {
      return sendError(res, "Booking is no longer awaiting payment", 400);
    }

    if (booking.paymentStatus === "PAID") {
      return sendError(res, "Booking is already paid", 400);
    }

    const paymentIntent = await paymentGateway.createPaymentIntent({
      amount: Math.round(booking.totalPrice * 100),
      currency: "usd",
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
      },
    });

    
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return sendSuccess(res, { clientSecret: paymentIntent.clientSecret });
  } catch (err) {
    console.error("create-intent error:", err);
    return sendError(res, "Failed to create payment intent", 500);
  }
});


router.post("/confirm", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return sendError(res, "bookingId is required", 400);
    }

    await expirePendingBookings({ bookingId });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true, user: true },
    });

    if (!booking) {
      return sendError(res, "Booking not found", 404);
    }

    if (booking.userId !== req.userId) {
      return sendError(res, "Not authorized", 403);
    }

    if (isPendingBookingExpired(booking)) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
      return sendError(
        res,
        `This reservation expired after ${BOOKING_HOLD_MINUTES} minutes. Please book again.`,
        409
      );
    }

    if (booking.paymentStatus === "PAID") {
      return sendSuccess(res, { message: "Already confirmed" });
    }

    if (!booking.paymentIntentId) {
      return sendError(res, "No payment found for this booking", 400);
    }

    const paymentStatus = await paymentGateway.getPaymentIntentStatus(booking.paymentIntentId);

    if (paymentStatus !== "succeeded") {
      return sendError(res, "Payment has not succeeded", 400);
    }

    // Confirm the booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
    });

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    sendBookingConfirmationEmail(
      booking.user.email,
      booking.user.name,
      `${booking.car.brand} ${booking.car.model}`,
      startDate.toLocaleDateString(),
      endDate.toLocaleDateString(),
      days,
      booking.totalPrice
    ).catch((err) => console.error("Failed to send booking email:", err));

    return sendSuccess(res, { booking: updated });
  } catch (err) {
    console.error("confirm error:", err);
    return sendError(res, "Failed to confirm booking", 500);
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  
  let event: any;

  try {
    event = paymentGateway.constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
        include: { car: true, user: true },
      });

      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      sendBookingConfirmationEmail(
        booking.user.email,
        booking.user.name,
        `${booking.car.brand} ${booking.car.model}`,
        startDate.toLocaleDateString(),
        endDate.toLocaleDateString(),
        days,
        booking.totalPrice
      ).catch((err) => console.error("Failed to send booking email:", err));
    } catch (err) {
      console.error("Failed to confirm booking after payment:", err);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "FAILED" },
      });
    } catch (err) {
      console.error("Failed to mark booking payment as failed:", err);
    }
  }

  res.json({ received: true });
});

export default router;
