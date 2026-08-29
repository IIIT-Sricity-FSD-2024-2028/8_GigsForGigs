import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({ success: false, message: "Not found" });
}
