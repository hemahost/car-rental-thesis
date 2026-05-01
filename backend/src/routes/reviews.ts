import { Router, Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/:carId", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { carId: req.params.carId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return sendSuccess(res, { reviews, avgRating, totalReviews: reviews.length });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch reviews", 500);
  }
});

router.post("/:carId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const carId = req.params.carId as string;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, "Rating must be between 1 and 5", 400);
    }

    if (!comment || comment.trim().length === 0) {
      return sendError(res, "Comment is required", 400);
    }

    if (comment.length > 500) {
      return sendError(res, "Comment must be 500 characters or less", 400);
    }

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return sendError(res, "Car not found", 404);
    }

    const review = await prisma.review.upsert({
      where: {
        userId_carId: { userId: req.userId!, carId },
      },
      update: {
        rating,
        comment: comment.trim(),
      },
      create: {
        userId: req.userId!,
        carId,
        rating,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return sendSuccess(res, { review }, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to submit review", 500);
  }
});

router.delete("/:reviewId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.reviewId as string },
    });

    if (!review) {
      return sendError(res, "Review not found", 404);
    }

    if (review.userId !== req.userId) {
      return sendError(res, "Not authorized", 403);
    }

    await prisma.review.delete({ where: { id: review.id } });

    return sendSuccess(res, { message: "Review deleted" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to delete review", 500);
  }
});

export default router;
