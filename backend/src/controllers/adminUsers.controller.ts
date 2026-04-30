import { Response } from "express";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

const PROTECTED_ADMIN_EMAIL = "admin@test.com";
const USER_SELECT = {
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
} as const;

export async function getUserDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
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

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { name, email, phone, address, role } = req.body;

    if (!name || !email) {
      return sendError(res, "Name and email are required", 400);
    }

    if (role && !["USER", "ADMIN"].includes(role)) {
      return sendError(res, "role must be USER or ADMIN", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "User not found", 404);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (existing.email === PROTECTED_ADMIN_EMAIL && normalizedEmail !== PROTECTED_ADMIN_EMAIL) {
      return sendError(res, "The original admin email cannot be changed", 400);
    }

    if (existing.email === PROTECTED_ADMIN_EMAIL && role === "USER") {
      return sendError(res, "The original admin account cannot be demoted", 400);
    }

    if (id === req.userId && role === "USER") {
      return sendError(res, "You cannot demote your own account", 400);
    }

    const emailOwner = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (emailOwner && emailOwner.id !== id) {
      return sendError(res, "Email already in use", 409);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone ?? "",
        address: address ?? "",
        role: role || existing.role,
      },
      select: USER_SELECT,
    });

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to update user", 500);
  }
}

export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
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

export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return sendError(res, "role must be USER or ADMIN", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, "User not found", 404);
    }

    if (existing.email === PROTECTED_ADMIN_EMAIL && role === "USER") {
      return sendError(res, "The original admin account cannot be demoted", 400);
    }

  
    if (id === req.userId && role === "USER") {
      return sendError(res, "You cannot demote your own account", 400);
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

    if (existing.email === PROTECTED_ADMIN_EMAIL) {
      return sendError(res, "The original admin account cannot be deleted", 400);
    }

    await prisma.user.delete({ where: { id } });

    return sendSuccess(res, { message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to delete user", 500);
  }
}
