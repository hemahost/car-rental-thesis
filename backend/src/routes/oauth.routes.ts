import { Router, Request, Response } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { createGitHubOAuthStrategy, createGoogleOAuthStrategy } from "../factories/oauthStrategy.factory";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatarUrl: string
) {
  let user = await prisma.user.findFirst({
    where: { provider, providerId },
  });
  if (user) return user;

  user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { provider, providerId, avatarUrl: user.avatarUrl || avatarUrl },
    });
    return user;
  }

  user = await prisma.user.create({
    data: { name, email, provider, providerId, avatarUrl },
  });
  return user;
}

function redirectWithToken(res: Response, user: { id: string; role: string }) {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  return res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}`);
}

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

router.get("/providers", (_req: Request, res: Response) => {
  res.json({
    success: true,
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  });
});

export default router;
