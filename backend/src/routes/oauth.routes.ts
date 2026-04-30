import { Router, Request, Response } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { createGitHubOAuthStrategy, createGoogleOAuthStrategy } from "../factories/oauthStrategy.factory";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

// ── Helper: find or create a user from an OAuth profile ──────────────────────
async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatarUrl: string
) {
  // 1. Try to find by provider + providerId (returning user)
  let user = await prisma.user.findFirst({
    where: { provider, providerId },
  });
  if (user) return user;

  // 2. Email already exists with a different provider → link the account
  user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { provider, providerId, avatarUrl: user.avatarUrl || avatarUrl },
    });
    return user;
  }

  // 3. Brand-new user — create account (no passwordHash for OAuth users)
  user = await prisma.user.create({
    data: { name, email, provider, providerId, avatarUrl },
  });
  return user;
}

// ── Helper: build redirect URL with JWT ──────────────────────────────────────
function redirectWithToken(res: Response, user: { id: string; role: string }) {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  return res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}`);
}

// ── Google ────────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    createGoogleOAuthStrategy({
      backendUrl: BACKEND_URL,
      findOrCreateUser: findOrCreateOAuthUser,
    })
  );

  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth` }),
    (req: Request, res: Response) => {
      redirectWithToken(res, req.user as any);
    }
  );
}

// ── GitHub ────────────────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    createGitHubOAuthStrategy({
      backendUrl: BACKEND_URL,
      findOrCreateUser: findOrCreateOAuthUser,
    })
  );

  router.get(
    "/github",
    passport.authenticate("github", { session: false })
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth` }),
    (req: Request, res: Response) => {
      redirectWithToken(res, req.user as any);
    }
  );
}

// ── Status endpoint: tells the frontend which providers are configured ────────
router.get("/providers", (_req: Request, res: Response) => {
  res.json({
    success: true,
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  });
});

export default router;
