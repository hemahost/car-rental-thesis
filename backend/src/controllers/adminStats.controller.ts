import { Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

// GET /api/admin/stats
export async function getAdminStats(req: AuthRequest, res: Response) {
  try {
    const [totalUsers, totalCars, totalBookings, bookingsByStatus, revenueResult] =
      await Promise.all([
        prisma.user.count(),
        prisma.car.count(),
        prisma.booking.count(),
        prisma.booking.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.booking.aggregate({
          _sum: { totalPrice: true },
          where: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } },
        }),
      ]);

    // Build status map
    const statusMap: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of bookingsByStatus) {
      statusMap[row.status] = row._count.status;
    }

    // Bookings created in the last 7 days (one entry per day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by day label
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[label] = 0;
    }
    for (const b of recentBookings) {
      const label = new Date(b.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (label in dailyMap) dailyMap[label]++;
    }
    const dailyBookings = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    return sendSuccess(res, {
      totalUsers,
      totalCars,
      totalBookings,
      totalRevenue: revenueResult._sum.totalPrice ?? 0,
      bookingsByStatus: statusMap,
      dailyBookings,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch stats", 500);
  }
}
