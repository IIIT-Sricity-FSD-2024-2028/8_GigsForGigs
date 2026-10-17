import { prisma } from "db";
import { badRequest, conflict, forbidden, notFound } from "../../lib/httpError.js";
import { env } from "../../lib/env.js";
import {
  SERVICE_HIRE_SKILL,
  computeProgress,
  isServiceHireTask,
  latestSubmissionInclude,
  stripReservedSkills,
} from "../../lib/taskRules.js";
import { managerInviteToken } from "../auth/auth.service.js";
import { platformFeeFor } from "../payment/payment.service.js";
import { parseDeliverableKey } from "./client.dto.js";
import type {
  CreateClientReviewDto,
  CreateManagerInviteDto,
  CreateTaskDto,
  CreateTaskDeliverableDefinitionDto,
  ReviewDeliverableAsClientDto,
  UpdateApplicationDto,
  UpdateClientProfileDto,
  UpdateTaskDto,
  UpdateTaskDeliverableDefinitionDto,
} from "./client.dto.js";

// ---- Profile ----------------------------------------------------------

// Fetch a client's profile, including their user account and manager roster.
export function getProfile(clientId: number) {
  return prisma.client.findUniqueOrThrow({
    where: { clientId },
    include: { user: true, managers: { include: { user: true } } },
  });
}

// Update a client's own display name/domain.
export function updateProfile(clientId: number, dto: UpdateClientProfileDto) {
  return prisma.client.update({
    where: { clientId },
    data: {
      ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });
}

// ---- Tasks --------------------------------------------------------------
// Only root clients ever reach these — enforced by roleGuard('client') at
// the route level, not repeated here. Managers and gig professionals have
// no route into task create/update/delete at all.

// Post a new task owned by the client.
export function createTask(clientId: number, dto: CreateTaskDto) {
  const skills = stripReservedSkills(dto.skills);
  return prisma.task.create({
    data: {
      clientId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(skills !== undefined ? { skills } : {}),
      budget: dto.budget,
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
    },
  });
}

// List a client's own tasks with their applications and deliverables.
export function listTasks(clientId: number) {
  return prisma.task.findMany({
    where: { clientId },
    include: { applications: true, deliverables: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Patch a task's fields. Only allowed while the task is still open: once
 * someone is hired, title/budget/scope are the agreed contract. Status is
 * never client-editable — it moves only through hire and payment release.
 * taskId ownership is pre-verified by clientOwnershipGuard.
 */
export async function updateTask(taskId: number, dto: UpdateTaskDto) {
  const task = await prisma.task.findUniqueOrThrow({ where: { taskId } });
  if (task.status !== "open") {
    throw conflict("A task can only be edited while it is open for applications");
  }
  const skills = dto.skills !== undefined
    ? [...(stripReservedSkills(dto.skills) ?? []), ...(isServiceHireTask(task) ? [SERVICE_HIRE_SKILL] : [])]
    : undefined;
  return prisma.task.update({
    where: { taskId },
    data: {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(skills !== undefined ? { skills } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
    },
  });
}

/** The ServiceRequest a service-hire task was created from (no FK exists, so matched by client + owner + title). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findServiceRequestForTask(tx: any, task: { clientId: number; title: string }, gigProfileId: number) {
  return tx.serviceRequest.findFirst({
    where: { clientId: task.clientId, service: { gigProfileId, title: task.title } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete (withdraw) a task. Only open tasks can be removed — anything already
 * hired has a contract, assignment and payment attached. Pending applications
 * go with it; a service-hire request is marked declined.
 */
export async function deleteTask(taskId: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    const task = await tx.task.findUniqueOrThrow({ where: { taskId }, include: { applications: true } });
    if (task.status !== "open" || task.applications.some((a: { status: string }) => a.status === "accepted")) {
      throw conflict("Only open tasks that nobody has been hired for can be deleted");
    }
    if (isServiceHireTask(task) && task.applications[0]) {
      const request = await findServiceRequestForTask(tx, task, task.applications[0].gigProfileId);
      if (request?.status === "pending") {
        await tx.serviceRequest.update({ where: { requestId: request.requestId }, data: { status: "declined" } });
      }
    }
    await tx.application.deleteMany({ where: { taskId } });
    await tx.task.delete({ where: { taskId } });
  });
}

// ---- Applications ---------------------------------------------------------

// List applications received across all of the client's tasks.
export function listApplications(clientId: number) {
  return prisma.application.findMany({
    where: { task: { clientId } },
    include: { task: true, gigProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Starts a contract for an application: task -> in_progress, every other open
 * application on the task declined, the professional's assignment row created
 * with no manager (the client supervises until they pick one after funding —
 * see setTaskManager), and the pending payment row created. Shared by the
 * client accepting a marketplace application and the gig professional
 * accepting a service-hire request.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function startContract(tx: any, application: { applicationId: number; taskId: number; gigProfileId: number }) {
  const task = await tx.task.findUniqueOrThrow({ where: { taskId: application.taskId } });

  // Conditional update: only one hire can ever win the open -> in_progress transition.
  const moved = await tx.task.updateMany({
    where: { taskId: application.taskId, status: "open" },
    data: { status: "in_progress" },
  });
  if (moved.count !== 1) throw conflict("This task is no longer open");

  await tx.application.update({ where: { applicationId: application.applicationId }, data: { status: "accepted" } });
  await tx.application.updateMany({
    where: { taskId: application.taskId, applicationId: { not: application.applicationId }, status: { in: ["pending", "shortlisted"] } },
    data: { status: "declined" },
  });

  await tx.gigManagerAssignment.upsert({
    where: { gigProfileId_taskId: { gigProfileId: application.gigProfileId, taskId: application.taskId } },
    update: {},
    create: { gigProfileId: application.gigProfileId, taskId: application.taskId },
  });

  // Payment row is created when the contract starts (pending until the client funds it); see payment.service.
  await tx.payment.upsert({
    where: { taskId_gigProfileId: { taskId: application.taskId, gigProfileId: application.gigProfileId } },
    update: {},
    create: {
      taskId: application.taskId,
      gigProfileId: application.gigProfileId,
      amount: task.budget,
      platformFee: platformFeeFor(Number(task.budget)),
      status: "pending",
    },
  });
}

/**
 * Client accepts/declines a marketplace application (pending or shortlisted
 * by a manager). Service-hire requests are answered by the gig professional
 * instead — the client withdraws one by deleting the task.
 */
export async function reviewApplication(
  applicationId: number,
  clientId: number,
  dto: UpdateApplicationDto,
) {
  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: { task: true },
  });

  if (!application || application.task.clientId !== clientId) {
    throw notFound("Application not found");
  }
  if (isServiceHireTask(application.task)) {
    throw conflict("This is a service request awaiting the professional's response");
  }
  if (application.status !== "pending" && application.status !== "shortlisted") {
    throw conflict(`This application has already been ${application.status}`);
  }
  if (application.task.status !== "open") {
    throw conflict("This task is no longer open");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    if (dto.status === "accepted") {
      await startContract(tx, application);
    } else {
      await tx.application.update({ where: { applicationId }, data: { status: "declined" } });
    }
    return tx.application.findUniqueOrThrow({ where: { applicationId } });
  });
}

// ---- Contracts (derived — no CONTRACT table) -------------------------------

export function toContractReviewResponse(review: any) {
  return {
    reviewId: review.reviewId,
    taskId: review.taskId,
    reviewerId: review.reviewerId,
    revieweeId: review.revieweeId,
    reviewerName: review.reviewer?.name,
    revieweeName: review.reviewee?.name,
    rating: review.rating,
    comment: review.comment ?? undefined,
    createdAt: typeof review.createdAt?.toISOString === "function" ? review.createdAt.toISOString() : String(review.createdAt),
  };
}

// Derive "contracts" (accepted applications) with computed deliverable progress and task reviews — no dedicated CONTRACT table.
export async function listContracts(clientId: number) {
  const applications = await prisma.application.findMany({
    where: { status: "accepted", task: { clientId } },
    include: {
      task: {
        include: {
          deliverableDefinitions: { include: latestSubmissionInclude },
          deliverables: { select: { gigProfileId: true, status: true } },
          assignments: { select: { gigProfileId: true, managerId: true } },
          payments: true,
          reviews: {
            include: { reviewer: true, reviewee: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      gigProfile: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return applications.map((application: any) => {
    const payment = application.task.payments.find((p: { gigProfileId: number }) => p.gigProfileId === application.gigProfileId);
    const platformFee = Number(payment?.platformFee ?? 0);
    return {
      paymentId: payment?.paymentId ?? null,
      paymentStatus: payment?.status ?? null,
      platformFee,
      totalAmount: Number(application.task.budget) + platformFee,
      taskId: application.taskId,
      taskTitle: application.task.title,
      gigProfileId: application.gigProfileId,
      gigProfessionalName: application.gigProfile.user.name,
      // null = supervised by the client themselves.
      managerId: application.task.assignments.find((a: { gigProfileId: number }) => a.gigProfileId === application.gigProfileId)?.managerId ?? null,
      status: application.task.status,
      progress: computeProgress(
        application.task.deliverableDefinitions,
        application.task.deliverables.filter((d: { gigProfileId: number }) => d.gigProfileId === application.gigProfileId),
      ),
      budget: application.task.budget,
      createdAt: application.createdAt,
      reviews: (application.task.reviews ?? []).map(toContractReviewResponse),
    };
  });
}

/**
 * Choose who supervises a hired task: one of the client's managers, or null
 * to keep it with the client. Allowed once the task is funded (payment held)
 * and while it is still in progress; can be changed any time in that window.
 * taskId ownership is pre-verified by clientOwnershipGuard.
 */
export async function setTaskManager(taskId: number, clientId: number, managerId: number | null) {
  if (managerId !== null && !(await prisma.manager.findFirst({ where: { managerId, clientId } }))) {
    throw notFound("Manager not found");
  }
  const task = await prisma.task.findUniqueOrThrow({ where: { taskId }, include: { payments: true } });
  if (task.status !== "in_progress") {
    throw conflict("A manager can only be chosen while the task is in progress");
  }
  if (!task.payments.some((p: { status: string }) => p.status === "held")) {
    throw conflict("Fund the task before choosing who manages it");
  }
  // Same conditions in the write, so a concurrent release can't slip between check and update.
  const updated = await prisma.gigManagerAssignment.updateMany({
    where: { taskId, task: { status: "in_progress", payments: { some: { status: "held" } } } },
    data: { managerId },
  });
  if (updated.count === 0) throw conflict("This task can no longer be reassigned");
  return { taskId, managerId };
}

// ---- Deliverables (client-side review) -------------------------------------

async function requireOwnedTask(taskId: number, clientId: number) {
  const task = await prisma.task.findFirst({ where: { taskId, clientId } });
  if (!task) throw notFound("Task not found");
  return task;
}

async function requireOwnedActiveTask(taskId: number, clientId: number) {
  const task = await requireOwnedTask(taskId, clientId);
  if (task.status !== "in_progress") throw forbidden("Deliverables can only be managed for active tasks");
  return task;
}

function flattenTaskDeliverableDefinition(definition: Awaited<ReturnType<typeof prisma.taskDeliverableDefinition.findMany>>[number] & {
  submissions: Array<{ submission: { deliverableNo: number; status: string; createdAt: Date; feedback: string | null } }>;
}) {
  return {
    definitionId: definition.definitionId,
    taskId: definition.taskId,
    title: definition.title,
    description: definition.description,
    createdAt: definition.createdAt.toISOString(),
    submissions: definition.submissions.map(({ submission }) => ({
      deliverableNo: submission.deliverableNo,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
      feedback: submission.feedback,
    })),
  };
}

export async function listTaskDeliverableDefinitions(taskId: number, clientId: number) {
  await requireOwnedTask(taskId, clientId);
  const definitions = await prisma.taskDeliverableDefinition.findMany({
    where: { taskId },
    include: { submissions: { include: { submission: true }, orderBy: { deliverableNo: "desc" } } },
    orderBy: { definitionId: "asc" },
  });
  return definitions.map(flattenTaskDeliverableDefinition);
}

export async function createTaskDeliverableDefinition(
  taskId: number,
  clientId: number,
  dto: CreateTaskDeliverableDefinitionDto,
) {
  await requireOwnedActiveTask(taskId, clientId);
  const definition = await prisma.taskDeliverableDefinition.create({
    data: { taskId, title: dto.title, ...(dto.description !== undefined ? { description: dto.description } : {}) },
  });
  return { ...definition, createdAt: definition.createdAt.toISOString(), submissions: [] };
}

export async function updateTaskDeliverableDefinition(
  taskId: number,
  definitionId: number,
  clientId: number,
  dto: UpdateTaskDeliverableDefinitionDto,
) {
  await requireOwnedActiveTask(taskId, clientId);
  return prisma.$transaction(async tx => {
    const definition = await tx.taskDeliverableDefinition.findFirst({
      where: { taskId, definitionId, task: { clientId } },
      include: { _count: { select: { submissions: true } } },
    });
    if (!definition) throw notFound("Task deliverable not found");
    if (definition._count.submissions > 0) throw conflict("A submitted deliverable cannot be edited; its submission history is preserved");
    const updated = await tx.taskDeliverableDefinition.update({
      where: { definitionId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      },
    });
    return { ...updated, createdAt: updated.createdAt.toISOString(), submissions: [] };
  }, { isolationLevel: "Serializable" });
}

export async function deleteTaskDeliverableDefinition(taskId: number, definitionId: number, clientId: number): Promise<void> {
  await requireOwnedActiveTask(taskId, clientId);
  await prisma.$transaction(async tx => {
    const definition = await tx.taskDeliverableDefinition.findFirst({
      where: { taskId, definitionId, task: { clientId } },
      include: { _count: { select: { submissions: true } } },
    });
    if (!definition) throw notFound("Task deliverable not found");
    if (definition._count.submissions > 0) throw conflict("A submitted deliverable cannot be deleted; its submission history is preserved");
    await tx.taskDeliverableDefinition.delete({ where: { definitionId } });
  }, { isolationLevel: "Serializable" });
}

// List deliverables submitted for one of the client's tasks.
export function listTaskDeliverables(taskId: number) {
  return prisma.deliverable.findMany({
    where: { taskId },
    include: {
      gigProfile: { include: { user: true } },
      claimedDefinitions: { include: { definition: true } },
    },
    orderBy: { deliverableNo: "asc" },
  });
}

// Approve a deliverable or request revisions, as the owning client. rawDeliverableId is "<taskId>-<deliverableNo>".
// Approval never completes the task — that only happens on payment release.
export async function reviewDeliverable(
  rawDeliverableId: string,
  clientId: number,
  dto: ReviewDeliverableAsClientDto,
) {
  let key: { taskId: number; deliverableNo: number };
  try {
    key = parseDeliverableKey(rawDeliverableId);
  } catch (err) {
    throw badRequest((err as Error).message);
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { taskId_deliverableNo: key },
    include: {
      task: {
        include: {
          assignments: true,
        },
      },
    },
  });

  if (!deliverable || deliverable.task.clientId !== clientId) {
    throw notFound("Deliverable not found");
  }
  if (deliverable.task.status !== "in_progress") {
    throw forbidden("Deliverables can only be reviewed while the task is active");
  }

  const isAssigned = deliverable.task.assignments.some(
    (a: { gigProfileId: number }) => a.gigProfileId === deliverable.gigProfileId,
  );
  if (!isAssigned) {
    throw forbidden("Submission belongs to a professional not assigned to this task");
  }

  // Conditional update: only a submission still awaiting review can be decided.
  const updated = await prisma.deliverable.updateMany({
    where: { ...key, status: "submitted" },
    data: {
      status: dto.status,
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    },
  });
  if (updated.count !== 1) throw conflict("This submission has already been reviewed");
  return prisma.deliverable.findUniqueOrThrow({
    where: { taskId_deliverableNo: key },
    include: {
      gigProfile: { include: { user: true } },
      claimedDefinitions: { include: { definition: true } },
    },
  });
}

// ---- Services (browse + request) -------------------------------------------

// Browse every active service listing offered by gig professionals.
export function listServices() {
  return prisma.service.findMany({
    where: { status: "active" },
    include: { tags: true, profile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Hire a service: creates a Task mirroring the service (tagged as a service
 * hire), a pending Application for the gig professional who owns it, and a
 * pending ServiceRequest. The professional then accepts or declines it.
 */
export async function requestService(serviceId: number, clientId: number) {
  if (!Number.isInteger(serviceId) || serviceId <= 0) throw notFound("Service not found");
  const service = await prisma.service.findUnique({ where: { serviceId } });
  if (!service || service.status !== "active") {
    throw notFound("Service not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.serviceRequest.findUnique({
      where: { serviceId_clientId: { serviceId, clientId } },
    });
    if (existing?.status === "pending") {
      throw conflict("You already have a pending request for this service");
    }

    const task = await tx.task.create({
      data: {
        clientId,
        title: service.title,
        description: service.description || `Service hire request for ${service.title}`,
        budget: service.price,
        status: "open",
        category: "Service Hire",
        skills: [SERVICE_HIRE_SKILL],
      },
    });

    const application = await tx.application.create({
      data: { gigProfileId: service.gigProfileId, taskId: task.taskId, status: "pending" },
    });

    // One row per (service, client) by schema; a re-request after a decline/accept reopens it.
    if (existing) {
      await tx.serviceRequest.update({
        where: { requestId: existing.requestId },
        data: { status: "pending", createdAt: new Date() },
      });
    } else {
      await tx.serviceRequest.create({ data: { serviceId, clientId, status: "pending" } });
    }

    return { task, application };
  }, { isolationLevel: "Serializable" });
}

// List the client's own service hire requests.
export function listServiceRequests(clientId: number) {
  return prisma.serviceRequest.findMany({
    where: { clientId },
    include: { service: { include: { profile: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---- Manager invites ---------------------------------------------------

function withInviteLink<T extends { inviteId: number; email: string; status: string }>(invite: T) {
  return invite.status === "pending"
    ? { ...invite, inviteLink: `${env.appUrl}/?manager_invite=${encodeURIComponent(managerInviteToken(invite))}` }
    : invite;
}

/**
 * Create a pending invite for a new manager. Nothing is emailed (no external
 * services) — the response carries a signed one-time link the client shares.
 */
export async function createManagerInvite(clientId: number, dto: CreateManagerInviteDto) {
  const email = dto.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { userId: true },
  });
  if (existingUser) {
    throw conflict("An account with this email already exists and cannot be invited as a manager");
  }

  const existingInvite = await prisma.managerInvite.findFirst({
    where: { clientId, email: { equals: email, mode: "insensitive" } },
  });
  if (existingInvite?.status === "pending") {
    return withInviteLink(existingInvite);
  }
  const invite = existingInvite
    ? await prisma.managerInvite.update({
        where: { inviteId: existingInvite.inviteId },
        data: { name: dto.name, status: "pending", acceptedUserId: null, createdAt: new Date() },
      })
    : await prisma.managerInvite.create({ data: { clientId, name: dto.name, email } });
  return withInviteLink(invite);
}

// List manager invites sent by the client (pending ones include their shareable link).
export async function listManagerInvites(clientId: number) {
  const invites = await prisma.managerInvite.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
  return invites.map(withInviteLink);
}

// Revoke a still-pending invite; its link stops working immediately.
export async function revokeManagerInvite(clientId: number, inviteId: number) {
  const revoked = await prisma.managerInvite.updateMany({
    where: { inviteId, clientId, status: "pending" },
    data: { status: "revoked" },
  });
  if (revoked.count !== 1) throw notFound("Pending invite not found");
}

// ---- Reviews -------------------------------------------------------------

/** Client rates the professional who delivered a completed task (one review per task). */
export async function createReview(clientId: number, userId: number, dto: CreateClientReviewDto) {
  const task = await prisma.task.findFirst({
    where: { taskId: dto.taskId, clientId },
    include: {
      applications: { where: { status: "accepted" }, include: { gigProfile: { select: { userId: true } } } },
    },
  });
  if (!task) throw notFound("Task not found");
  if (task.status !== "completed") throw conflict("You can review the professional once the task is completed");
  const hired = task.applications[0];
  if (!hired) throw conflict("Nobody was hired for this task");

  const existingReview = await prisma.review.findFirst({
    where: { taskId: dto.taskId, reviewerId: userId, revieweeId: hired.gigProfile.userId },
  });
  if (existingReview) {
    throw conflict("You have already reviewed this gig professional for this task");
  }

  return prisma.review.create({
    data: {
      taskId: dto.taskId,
      reviewerId: userId,
      revieweeId: hired.gigProfile.userId,
      rating: dto.rating,
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });
}
