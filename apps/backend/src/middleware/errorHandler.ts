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
  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
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
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
}
