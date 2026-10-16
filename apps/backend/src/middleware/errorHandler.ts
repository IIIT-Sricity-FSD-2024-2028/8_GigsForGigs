import type { NextFunction, Request, Response } from "express";
import { Prisma } from "db";
import { HttpError } from "../lib/httpError.js";

/**
 * Terminal error handler. Must keep all four params (Express detects
 * error-handling middleware by arity) even though _req/_next are unused.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
    return;
  }

  // body-parser errors (malformed JSON, payload too large) carry their own 4xx status.
  const status = (err as { status?: unknown; type?: unknown } | null)?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    const type = (err as { type?: string }).type;
    res.status(status).json({
      success: false,
      message:
        type === "entity.parse.failed"
          ? "Malformed JSON body"
          : type === "entity.too.large"
            ? "Request body too large"
            : "Bad request",
    });
    return;
  }

  // Prisma's generated client ships with @ts-nocheck throughout, which
  // collapses Prisma.PrismaClientKnownRequestError to `any` under this
  // toolchain — instanceof still works correctly at runtime, but TS can't
  // narrow `err` from it, hence the explicit cast.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = (err as { code: string }).code;
    if (code === "P2002") {
      res.status(409).json({ success: false, message: "Resource already exists" });
      return;
    }
    if (code === "P2025") {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }
    if (code === "P2003" || code === "P2014") {
      res.status(409).json({ success: false, message: "This record is still referenced by other data and cannot be changed or removed" });
      return;
    }
    if (code === "P2034") {
      res.status(409).json({ success: false, message: "Conflicting concurrent update, please retry" });
      return;
    }
  }

  // Malformed input that reached a query (e.g. a non-numeric :id becoming NaN).
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: "Invalid request parameters" });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
}
