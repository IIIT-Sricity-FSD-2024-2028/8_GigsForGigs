import { prisma } from "db";
import { hashPassword } from "../../lib/password.js";
import { notFound } from "../../lib/httpError.js";
import type {
  CreateDeliverableDto,
  ReviewDeliverableDto,
  UpdateManagerDto,
  UpdateManagerProfileDto,
} from "./manager.dto.js";

const taskInclude = {
  client: true,
  assignments: { include: { gigProfile: { include: { user: true, skills: true } } } },
  deliverables: true,
} as const;

// ---- Client-facing manager roster ------------------------------------
// GET/DELETE/PATCH here are reached with a CLIENT token (see manager.route.ts) —
// a client managing the managers under their own account, distinct from a
// manager's own /me self-service below.

export function listManagersForClient(clientId: number) {
  return prisma.manager.findMany({ where: { clientId }, include: { user: true, client: true } });
}

export async function deleteManager(managerId: number, clientId: number): Promise<void> {
  const manager = await prisma.manager.findUnique({ where: { managerId } });
  if (!manager || manager.clientId !== clientId) {
    throw notFound("Manager not found");
  }

  await prisma.$transaction([
    prisma.manager.delete({ where: { clientId_managerId: { clientId, managerId } } }),
    prisma.client.update({ where: { clientId }, data: { numberOfManager: { decrement: 1 } } }),
  ]);
}

export async function updateManager(managerId: number, clientId: number, dto: UpdateManagerDto) {
  const manager = await prisma.manager.findUnique({ where: { managerId } });
  if (!manager || manager.clientId !== clientId) {
    throw notFound("Manager not found");
  }

  return prisma.user.update({
    where: { userId: manager.userId },
    data: {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
    },
  });
}

// ---- Manager self-service --------------------------------------------

export function getOwnProfile(managerId: number) {
  return prisma.manager.findUniqueOrThrow({
    where: { managerId },
    include: { user: true, client: true },
  });
}

export async function updateOwnProfile(managerId: number, dto: UpdateManagerProfileDto) {
  const manager = await prisma.manager.findUniqueOrThrow({ where: { managerId } });
  await prisma.user.update({
    where: { userId: manager.userId },
    data: {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.password !== undefined ? { hashPassword: await hashPassword(dto.password) } : {}),
    },
  });
  return getOwnProfile(managerId);
}

export function listAssignedTasks(managerId: number) {
  return prisma.task.findMany({
    where: { assignments: { some: { managerId } } },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** taskId access already verified by taskAccessGuard. */
export function getAssignedTask(taskId: number) {
  return prisma.task.findUniqueOrThrow({ where: { taskId }, include: taskInclude });
}

export function listTaskDeliverables(taskId: number) {
  return prisma.deliverable.findMany({
    where: { taskId },
    include: { gigProfile: { include: { user: true } } },
    orderBy: { deliverableNo: "asc" },
  });
}

export async function createDeliverable(
  taskId: number,
  managerId: number,
  dto: CreateDeliverableDto,
) {
  const assignment = await prisma.gigManagerAssignment.findFirst({
    where: { taskId, gigProfileId: dto.gigProfileId, managerId },
  });
  if (!assignment) {
    throw notFound("No matching assignment for that gig professional on this task");
  }

  const last = await prisma.deliverable.findFirst({
    where: { taskId },
    orderBy: { deliverableNo: "desc" },
  });
  const deliverableNo = (last?.deliverableNo ?? 0) + 1;

  return prisma.deliverable.create({
    data: {
      taskId,
      deliverableNo,
      gigProfileId: dto.gigProfileId,
      description: dto.description,
      submissionPath: dto.submissionPath,
    },
    include: { gigProfile: { include: { user: true } } },
  });
}

export async function getDeliverable(taskId: number, deliverableNo: number) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    include: { gigProfile: { include: { user: true } } },
  });
  if (!deliverable) {
    throw notFound("Deliverable not found");
  }
  return deliverable;
}

/**
 * Unlike the frontend mock — which only recalculates progress on close —
 * the server recomputes on both /review and /close, so progress is never
 * stale between the two. Deliberate divergence from bug-compatibility.
 */
async function recomputeTaskProgress(taskId: number): Promise<void> {
  const deliverables = await prisma.deliverable.findMany({ where: { taskId } });
  if (deliverables.length === 0) return;

  const doneCount = deliverables.filter(
    (d: { status: string }) => d.status === "approved" || d.status === "closed",
  ).length;
  const progress = Math.round((doneCount / deliverables.length) * 100);

  if (progress === 100) {
    await prisma.task.update({ where: { taskId }, data: { status: "completed" } });
  }
}

export async function reviewDeliverable(
  taskId: number,
  deliverableNo: number,
  dto: ReviewDeliverableDto,
) {
  await getDeliverable(taskId, deliverableNo);

  const updated = await prisma.deliverable.update({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    data: {
      status: dto.status,
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    },
    include: { gigProfile: { include: { user: true } } },
  });

  await recomputeTaskProgress(taskId);
  return updated;
}

export async function closeDeliverable(taskId: number, deliverableNo: number) {
  await getDeliverable(taskId, deliverableNo);

  const updated = await prisma.deliverable.update({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    data: { status: "closed" },
    include: { gigProfile: { include: { user: true } } },
  });

  await recomputeTaskProgress(taskId);
  return updated;
}

export function searchGigProfessionals(query?: string) {
  return prisma.gigProfessionalProfile.findMany({
    ...(query
      ? {
          where: {
            OR: [
              { user: { name: { contains: query, mode: "insensitive" } } },
              { skills: { some: { skill: { contains: query, mode: "insensitive" } } } },
            ],
          },
        }
      : {}),
    include: { user: true, skills: true, tools: true, portfolio: true, services: { take: 1 } },
    take: 50,
  });
}
