import type { NextFunction, Request, Response } from "express";
import { prisma } from "db";
import { verifyToken } from "../lib/jwt.js";
import type { TokenPayload } from "../lib/jwt.js";
import { unauthorized } from "../lib/httpError.js";

/**
 * Parses `Authorization: Bearer <token>`, verifies it, then re-checks the
 * account against the DB so a deleted user, a removed manager, or a changed
 * role loses access immediately instead of when the 7-day JWT expires.
 */
export async function authGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(unauthorized("Missing bearer token"));
    return;
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch {
    next(unauthorized("Invalid or expired token"));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { userId: payload.userId },
    select: {
      role: true,
      client: { select: { clientId: true } },
      managerLink: { select: { managerId: true, clientId: true } },
      gigProfile: { select: { gigProfileId: true } },
    },
  });

  const stillValid =
    !!user &&
    user.role === payload.role &&
    (payload.role === "client"
      ? user.client?.clientId === payload.clientId
      : payload.role === "manager"
        ? user.managerLink?.managerId === payload.managerId && user.managerLink?.clientId === payload.clientId
        : payload.role === "gig_professional"
          ? user.gigProfile?.gigProfileId === payload.gigProfileId
          : true);

  if (!stillValid) {
    next(unauthorized("Session is no longer valid. Please sign in again."));
    return;
  }

  req.user = payload;
  next();
}
