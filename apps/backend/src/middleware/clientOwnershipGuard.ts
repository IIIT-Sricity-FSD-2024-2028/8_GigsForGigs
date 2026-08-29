import type { NextFunction, Request, Response } from "express";
import { prisma } from "db";
import { notFound, unauthorized } from "../lib/httpError.js";

/**
 * Ensures a client-scoped resource actually belongs to the authenticated
 * client. Only checks a :taskId route param today — the one client-owned
 * resource id that appears directly in a URL. Application/deliverable
 * routes scope ownership via a join in their own service query instead,
 * since they're keyed by an id that doesn't itself carry a clientId.
 */
export async function clientOwnershipGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user || req.user.role !== "client") {
    next(unauthorized());
    return;
  }

  const taskIdParam = req.params.taskId;
  if (taskIdParam === undefined) {
    next();
    return;
  }

  const taskId = Number(taskIdParam);
  if (!Number.isInteger(taskId)) {
    next(notFound("Task not found"));
    return;
  }

  const task = await prisma.task.findFirst({
    where: { taskId, clientId: req.user.clientId },
    select: { taskId: true },
  });

  if (!task) {
    next(notFound("Task not found"));
    return;
  }

  next();
}
