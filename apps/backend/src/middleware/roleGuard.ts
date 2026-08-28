import type { NextFunction, Request, Response } from "express";
import type { Role } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/httpError.js";

/** Requires authGuard to have run first. 403s if req.user.role isn't in the allow-list. */
export function roleGuard(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden(`Requires role: ${roles.join(" | ")}`));
      return;
    }
    next();
  };
}
