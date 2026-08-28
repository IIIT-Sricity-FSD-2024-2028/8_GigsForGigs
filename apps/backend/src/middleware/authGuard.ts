import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { unauthorized } from "../lib/httpError.js";

/** Parses `Authorization: Bearer <token>`, verifies it, attaches req.user. */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(unauthorized("Missing bearer token"));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
