import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import prisma from "../db/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { sendResetCodeEmail } from "../utils/email";
import { authenticate, AuthRequest } from "../middleware/auth";

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/avatars"));
  },
  filename: (req: AuthRequest, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

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
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, avatarUrl: true },
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
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: "1d" });

    return sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, avatarUrl: user.avatarUrl },
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
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, avatarUrl: true, createdAt: true },
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

// PUT /api/auth/profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return sendError(res, "Name and email are required");
    }

    // Check if email is taken by another user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.userId) {
      return sendError(res, "Email already in use", 409);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, email, phone: phone ?? "", address: address ?? "" },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, avatarUrl: true },
    });

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to update profile", 500);
  }
});

// POST /api/auth/avatar
router.post("/avatar", authenticate, upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded");
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, avatarUrl: true },
    });

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to upload avatar", 500);
  }
});

// DELETE /api/auth/avatar
router.delete("/avatar", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl: "" },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, avatarUrl: true },
    });

    return sendSuccess(res, { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to remove avatar", 500);
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, "Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if email doesn't exist to prevent user enumeration
      return sendSuccess(res, { message: "If an account with that email exists, a reset code has been generated." });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a 6-digit reset code
    const token = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Send the reset code via email
    try {
      await sendResetCodeEmail(email, token);
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      return sendError(res, "Failed to send reset email. Please try again later.", 500);
    }

    return sendSuccess(res, {
      message: "A password reset code has been sent to your email.",
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to process request", 500);
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return sendError(res, "Email, reset code, and new password are required");
    }

    if (newPassword.length < 6) {
      return sendError(res, "Password must be at least 6 characters");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, "Invalid reset code", 401);
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      return sendError(res, "Invalid or expired reset code", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    return sendSuccess(res, { message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to reset password", 500);
  }
});

// PUT /api/auth/change-password
router.put("/change-password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, "Current password and new password are required");
    }

    if (newPassword.length < 6) {
      return sendError(res, "New password must be at least 6 characters");
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return sendError(res, "Current password is incorrect", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return sendSuccess(res, { message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return sendError(res, "Failed to change password", 500);
  }
});

export default router;
