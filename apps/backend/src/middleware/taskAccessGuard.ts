import type { NextFunction, Request, Response } from "express";
import { prisma } from "db";
import { notFound, unauthorized } from "../lib/httpError.js";

/**
 * Manager task-scoped routes (`/managers/me/tasks/:taskId/...`): a manager
 * may only reach a task through an existing GIG_MANAGER_ASSIGNMENT row for
 * their own managerId — MANAGER has no other relation to TASKS at all.
 *
 * Returns 404, not 403, on a mismatch so a manager can't distinguish "not
 * yours" from "doesn't exist" and enumerate other clients' task ids.
 */
export async function taskAccessGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user || req.user.role !== "manager") {
    next(unauthorized());
    return;
  }

  const taskId = Number(req.params.taskId);
  if (!Number.isInteger(taskId)) {
    next(notFound("Task not found"));
    return;
  }

  const assignment = await prisma.gigManagerAssignment.findFirst({
    where: { taskId, managerId: req.user.managerId },
    select: { taskId: true },
  });

  if (!assignment) {
    next(notFound("Task not found"));
    return;
  }

  next();
}
