import { Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

// GET /api/admin/users/:id
export async function getUserDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatarUrl: true,
        role: true,
        provider: true,
        twoFactorEnabled: true,
        createdAt: true,
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            status: true,
            pickupLocation: true,
            dropoffLocation: true,
            car: { select: { brand: true, model: true, imageUrl: true } },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch user details", 500);
  }
}

// GET /api/admin/users
export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, { users });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch users", 500);
  }
}

// PATCH /api/admin/users/:id/role
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return sendError(res, "role must be USER or ADMIN", 400);
    }

    // Prevent admin from demoting themselves
    if (id === req.userId && role === "USER") {
      return sendError(res, "You cannot demote your own account", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "User not found", 404);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to update user role", 500);
  }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    if (id === req.userId) {
      return sendError(res, "You cannot delete your own account", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "User not found", 404);
    }

    await prisma.user.delete({ where: { id } });

    return sendSuccess(res, { message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to delete user", 500);
  }
}
