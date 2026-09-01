import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Global general API rate limiter.
 * Window: 15 minutes
 * Max: 100 requests per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  statusCode: 429,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
});

/**
 * Strict authentication rate limiter to protect against brute-force,
 * credential stuffing, and password guessing attacks.
 * Window: 15 minutes
 * Max: 10 attempts per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  statusCode: 429,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again after 15 minutes.",
    });
  },
});

/**
 * Dedicated rate limiter for sensitive financial and payment operations.
 * Window: 15 minutes
 * Max: 10 requests per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  statusCode: 429,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many payment transaction attempts. Please try again later.",
    });
  },
});
