import { prisma } from "db";
import { hashPassword } from "../../lib/password.js";
import { conflict, notFound } from "../../lib/httpError.js";
import { ACTIVE_PAYMENT_STATUSES, isServiceHireTask } from "../../lib/taskRules.js";
import type {
  ReviewDeliverableDto,
  ShortlistApplicationDto,
  UpdateManagerDto,
  UpdateManagerProfileDto,
} from "./manager.dto.js";

// A task can have several hires with different supervisors; a manager sees only the ones assigned to them.
function taskIncludeFor(managerId: number) {
  return {
    client: true,
    assignments: { where: { managerId }, include: { gigProfile: { include: { user: true, skills: true } } } },
    deliverables: { where: { assignment: { managerId } } },
    deliverableDefinitions: {
      include: {
        submissions: {
          where: { submission: { assignment: { managerId } } },
          include: { submission: { select: { deliverableNo: true, status: true } } },
          orderBy: { deliverableNo: "desc" },
        },
      },
    },
    payments: { select: { gigProfileId: true, status: true } },
  } as const;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withManagedStatus(task: any) {
  // The posting stays open while hires run, so the manager's view is driven by their own hires' escrow.
  const mine = new Set(task.assignments.map((a: { gigProfileId: number }) => a.gigProfileId));
  const active = task.payments.some(
    (p: { gigProfileId: number; status: string }) => mine.has(p.gigProfileId) && ACTIVE_PAYMENT_STATUSES.some((s) => s === p.status),
  );
  return { ...task, status: active ? "in_progress" : "completed" };
}

// ---- Client-facing manager roster ------------------------------------
// GET/DELETE/PATCH here are reached with a CLIENT token (see manager.route.ts) —
// a client managing the managers under their own account, distinct from a
// manager's own /me self-service below.

// List the managers on a client's roster.
export function listManagersForClient(clientId: number) {
  return prisma.manager.findMany({ where: { clientId }, include: { user: true, client: true } });
}

/**
 * Remove a manager from a client's roster. Tasks they supervise are handed to
 * another of the client's managers (the client can reassign them afterwards);
 * the last manager can't be removed while they supervise work.
 * Their User row stays (reviews/history reference it) but authGuard rejects
 * them from then on because the MANAGER link is gone.
 */
export async function deleteManager(managerId: number, clientId: number): Promise<void> {
  const manager = await prisma.manager.findUnique({ where: { managerId } });
  if (!manager || manager.clientId !== clientId) {
    throw notFound("Manager not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    const supervised = await tx.gigManagerAssignment.count({ where: { managerId } });
    if (supervised > 0) {
      const replacement = await tx.manager.findFirst({
        where: { clientId, managerId: { not: managerId } },
        orderBy: { managerId: "asc" },
      });
      if (!replacement) {
        throw conflict("This manager supervises active work. Add another manager before removing them.");
      }
      await tx.gigManagerAssignment.updateMany({ where: { managerId }, data: { managerId: replacement.managerId } });
    }
    await tx.manager.delete({ where: { clientId_managerId: { clientId, managerId } } });
    await tx.client.update({ where: { clientId }, data: { numberOfManager: { decrement: 1 } } });
  });
}

// Update a manager's underlying User record (name/email) on behalf of the owning client.
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

// Fetch a manager's own profile, including their linked user account and client.
export function getOwnProfile(managerId: number) {
  return prisma.manager.findUniqueOrThrow({
    where: { managerId },
    include: { user: true, client: true },
  });
}

// Update a manager's own name/email/password, then return the refreshed profile.
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

// List only the tasks the client has assigned to this manager.
export async function listAssignedTasks(managerId: number, clientId: number) {
  const tasks = await prisma.task.findMany({
    // Match the same tenant boundary enforced by taskAccessGuard. Legacy data
    // may contain manager assignments whose manager belongs to another client.
    where: { clientId, assignments: { some: { managerId } } },
    include: taskIncludeFor(managerId),
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(withManagedStatus);
}

/** Fetch a single task with its client/assignments/deliverables. taskId access already verified by taskAccessGuard. */
export async function getAssignedTask(taskId: number, managerId: number) {
  return withManagedStatus(await prisma.task.findUniqueOrThrow({ where: { taskId }, include: taskIncludeFor(managerId) }));
}

// List applications submitted for a task.
export function listTaskApplications(taskId: number) {
  return prisma.application.findMany({
    where: { taskId },
    include: { gigProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mark a pending marketplace application "shortlisted" for the client to
 * decide on, optionally recording a rating/hourly rate. Managers never hire —
 * accepting is client-only. taskId access already verified by taskAccessGuard.
 */
export async function shortlistApplication(
  taskId: number,
  applicationId: number,
  dto: ShortlistApplicationDto,
) {
  const application = await prisma.application.findUnique({ where: { applicationId }, include: { task: true } });
  if (!application || application.taskId !== taskId || isServiceHireTask(application.task)) {
    throw notFound("Application not found");
  }
  if (application.task.status !== "open") {
    throw conflict("This task is no longer open");
  }
  if (application.status !== "pending" && application.status !== "shortlisted") {
    throw conflict(`This application has already been ${application.status}`);
  }

  return prisma.application.update({
    where: { applicationId },
    data: {
      status: "shortlisted",
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.hourlyRate !== undefined ? { hourlyRate: dto.hourlyRate } : {}),
    },
  });
}

// List deliverables submitted for a task by the professionals this manager supervises, in submission order.
export function listTaskDeliverables(taskId: number, managerId: number) {
  return prisma.deliverable.findMany({
    where: { taskId, assignment: { managerId } },
    include: { gigProfile: { include: { user: true } }, claimedDefinitions: { include: { definition: true } } },
    orderBy: { deliverableNo: "asc" },
  });
}

// Fetch one deliverable by its (taskId, deliverableNo) composite key, if it's from a professional this manager supervises.
export async function getDeliverable(taskId: number, deliverableNo: number, managerId: number) {
  const deliverable = await prisma.deliverable.findFirst({
    where: { taskId, deliverableNo, assignment: { managerId } },
    include: { gigProfile: { include: { user: true } }, claimedDefinitions: { include: { definition: true } } },
  });
  if (!deliverable) {
    throw notFound("Deliverable not found");
  }
  return deliverable;
}

const deliverableInclude = { gigProfile: { include: { user: true } }, claimedDefinitions: { include: { definition: true } } } as const;

/**
 * Conditionally moves one submission from `from` to the new status while the
 * task is active. Approval never completes the task: completion happens only
 * when the client's payment release succeeds (see payment.route.ts).
 */
async function transitionDeliverable(
  taskId: number,
  deliverableNo: number,
  managerId: number,
  from: "submitted" | "approved",
  data: { status: "approved" | "revision_requested" | "closed"; feedback?: string },
) {
  const deliverable = await getDeliverable(taskId, deliverableNo, managerId);
  const payment = await prisma.payment.findUnique({
    where: { taskId_gigProfileId: { taskId, gigProfileId: deliverable.gigProfileId } },
    select: { status: true },
  });
  if (payment?.status !== "held") {
    throw conflict("Deliverables can only be reviewed while the task is active");
  }
  const updated = await prisma.deliverable.updateMany({
    where: { taskId, deliverableNo, status: from },
    data,
  });
  if (updated.count !== 1) {
    throw conflict(
      from === "submitted"
        ? `This submission has already been ${deliverable.status.replace("_", " ")}`
        : "Only approved deliverables can be closed",
    );
  }
  return prisma.deliverable.findUniqueOrThrow({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    include: deliverableInclude,
  });
}

// Approve/request-revision on a submission that is awaiting review.
export function reviewDeliverable(taskId: number, deliverableNo: number, managerId: number, dto: ReviewDeliverableDto) {
  return transitionDeliverable(taskId, deliverableNo, managerId, "submitted", {
    status: dto.status,
    ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
  });
}

// Mark an approved deliverable closed (finalised).
export function closeDeliverable(taskId: number, deliverableNo: number, managerId: number) {
  return transitionDeliverable(taskId, deliverableNo, managerId, "approved", { status: "closed" });
}
