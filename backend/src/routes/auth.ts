import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "Name, email and password are required");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, "Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true },
    });

    return sendSuccess(res, { user }, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "Registration failed", 500);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return sendError(res, "Invalid email or password", 401);
    }

    const secret = process.env.JWT_SECRET || "fallback-secret";
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "1d" });

    return sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Login failed", 500);
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to fetch user", 500);
  }
});

export default router;
