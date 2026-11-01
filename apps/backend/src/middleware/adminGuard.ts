import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "db";
import { forbidden, unauthorized } from "../lib/httpError.js";
import { getPlatformSettings } from "../modules/admin/platformSettings.js";

export const ADMIN_PERMISSIONS = [
  "users:read",
  "users:ban",
  "payments:read",
  "payments:refund",
  "payments:release",
  "disputes:resolve",
  "reviews:moderate",
  "settings:manage",
  "admins:invite",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** '*' is the OWNER grant. Reads the set authGuard just loaded, so a revocation applies on the next request. */
export const hasPermission = (req: Request, permission: AdminPermission): boolean => {
  const granted = req.account?.adminPermissions ?? [];
  return granted.includes("*") || granted.includes(permission);
};

/**
 * Server-side RBAC check. The frontend hides buttons too, but that is only UX:
 * this is the control. Pass a function when the required permission depends on
 * the request (escrow release and refund are separate grants on one route).
 */
export function can(permission: AdminPermission | ((req: Request) => AdminPermission)): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    const required = typeof permission === "function" ? permission(req) : permission;
    if (!hasPermission(req, required)) return next(forbidden(`Requires permission: ${required}`));
    next();
  };
}

// Request-body keys never copied into the audit trail.
const SENSITIVE_KEY = /password|token|secret|code/i;

const auditDetails = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;
  const safe = Object.entries(body).filter(([key]) => !SENSITIVE_KEY.test(key));
  return safe.length > 0 ? JSON.stringify(Object.fromEntries(safe)).slice(0, 1000) : null;
};

/** Append one row to AUDIT_LOG. Exported for the invite activation route, which has no session yet. */
export const writeAudit = (entry: {
  actorUserId: number | null;
  actorEmail: string;
  action: string;
  target: string;
  details: string | null;
  ipAddress: string | null;
}) => prisma.auditLog.create({ data: entry });

/**
 * Records every successful admin mutation in one place, so a new route can't
 * forget to. Failed requests changed nothing, so they aren't recorded.
 *
 * ponytail: runs after the response, outside the mutation's transaction, so a
 * crash in that gap loses the row (it is logged to stderr on a DB error). Write
 * audit rows inside each money transaction if a regulator needs atomicity.
 */
export function audited(action: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      if (res.statusCode >= 400 || !req.user) return;
      writeAudit({
        actorUserId: req.user.userId,
        actorEmail: req.account?.email ?? `user-${req.user.userId}`,
        action,
        target: req.originalUrl.replace(/^\/api\/admin/, "").slice(0, 255),
        details: auditDetails(req.body),
        ipAddress: req.ip ?? null,
      }).catch((err: unknown) => console.error("[audit] failed to record", action, err));
    });
    next();
  };
}

/** A permission check plus an audit entry: the standard guard for an admin mutation. */
export const act = (
  permission: AdminPermission | ((req: Request) => AdminPermission),
  action: string,
): RequestHandler[] => [can(permission), audited(action)];

/**
 * While maintenance mode is on, reject non-admin writes with 503. Reads stay up
 * so users can still see their data, and login stays up so admins can get in to
 * turn it back off.
 */
export async function maintenanceGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const exempt = req.method === "GET" || req.path.startsWith("/admin") || req.path.startsWith("/auth/login");
  if (!exempt && (await getPlatformSettings()).maintenanceMode) {
    const err = Object.assign(new Error("The platform is in maintenance mode. Please try again shortly."), { status: 503 });
    return next(err);
  }
  next();
}
