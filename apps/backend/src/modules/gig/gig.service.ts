import { prisma } from "db";
import { badRequest, conflict, forbidden, notFound } from "../../lib/httpError.js";
import { SERVICE_HIRE_SKILL, isServiceHireTask } from "../../lib/taskRules.js";
import { findServiceRequestForTask, startContract } from "../client/client.service.js";
import type {
  CreateApplicationDto,
  CreateReviewDto,
  CreateServiceDto,
  RespondToRequestDto,
  SubmitDeliverableDto,
  UpdateGigProfileDto,
} from "./gig.dto.js";

const profileInclude = { user: true, skills: true, tools: true, portfolio: true } as const;

// Fetch a gig professional's profile with skills/tools/portfolio.
export function getProfile(gigProfileId: number) {
  return prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
    include: profileInclude,
  });
}

/** Update bio/skills/tools/portfolio. PUT semantics: skills/tools/portfolio are each fully replaced when present in the body, not merged. */
export async function updateProfile(gigProfileId: number, dto: UpdateGigProfileDto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see
  // errorHandler.ts: Prisma's generated types collapse to `any` here.
  await prisma.$transaction(async (tx: any) => {
    if (dto.bio !== undefined) {
      await tx.gigProfessionalProfile.update({ where: { gigProfileId }, data: { bio: dto.bio } });
    }
    if (dto.skills) {
      await tx.profileSkill.deleteMany({ where: { gigProfileId } });
      if (dto.skills.length > 0) {
        await tx.profileSkill.createMany({
          data: dto.skills.map((skill) => ({ gigProfileId, skill })),
          skipDuplicates: true,
        });
      }
    }
    if (dto.tools) {
      await tx.profileTool.deleteMany({ where: { gigProfileId } });
      if (dto.tools.length > 0) {
        await tx.profileTool.createMany({
          data: dto.tools.map((tool) => ({ gigProfileId, tool })),
          skipDuplicates: true,
        });
      }
    }
    if (dto.portfolio) {
      await tx.profilePortfolio.deleteMany({ where: { gigProfileId } });
      if (dto.portfolio.length > 0) {
        await tx.profilePortfolio.createMany({
          data: dto.portfolio.map((url) => ({ gigProfileId, url })),
          skipDuplicates: true,
        });
      }
    }
  });

  return getProfile(gigProfileId);
}

// List open marketplace tasks the gig professional hasn't already applied to.
// Service-hire tasks are private to the professional they were sent to.
export function listMarketplaceTasks(gigProfileId: number) {
  return prisma.task.findMany({
    where: {
      status: "open",
      applications: { none: { gigProfileId } },
      NOT: { skills: { has: SERVICE_HIRE_SKILL } },
    },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

// Apply for an open marketplace task, rejecting a duplicate application.
export async function createApplication(gigProfileId: number, dto: CreateApplicationDto) {
  const task = await prisma.task.findUnique({ where: { taskId: dto.taskId } });
  if (!task || isServiceHireTask(task)) {
    throw notFound("Task not found");
  }
  if (task.status !== "open") {
    throw conflict("This task is no longer accepting applications");
  }

  const existing = await prisma.application.findUnique({
    where: { gigProfileId_taskId: { gigProfileId, taskId: dto.taskId } },
  });
  if (existing) {
    throw conflict("Already applied to this task");
  }

  return prisma.application.create({ data: { gigProfileId, taskId: dto.taskId } });
}

// Withdraw (delete) the gig professional's own still-undecided marketplace application.
export async function withdrawApplication(
  applicationId: number,
  gigProfileId: number,
): Promise<void> {
  const application = await prisma.application.findUnique({ where: { applicationId }, include: { task: true } });
  if (!application || application.gigProfileId !== gigProfileId) {
    throw notFound("Application not found");
  }
  if (isServiceHireTask(application.task)) {
    throw conflict("Service requests are declined from Pending Requests, not withdrawn");
  }
  if (application.status !== "pending" && application.status !== "shortlisted") {
    throw conflict(`This application has already been ${application.status}`);
  }
  await prisma.application.delete({ where: { applicationId } });
}

/**
 * "Pending requests" are clients hiring this professional's service: the
 * pending application on a service-hire task. Marketplace applications are
 * never listed here — those are decided by the client, never by the applicant.
 */
export function listPendingRequests(gigProfileId: number) {
  return prisma.application.findMany({
    where: {
      gigProfileId,
      status: "pending",
      task: { status: "open", skills: { has: SERVICE_HIRE_SKILL } },
    },
    include: { task: { include: { client: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Accept/decline a client's service-hire request. Accepting starts the
 * contract exactly like a client accepting a marketplace application.
 */
export async function respondToRequest(
  applicationId: number,
  gigProfileId: number,
  dto: RespondToRequestDto,
) {
  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: { task: true },
  });
  if (!application || application.gigProfileId !== gigProfileId || !isServiceHireTask(application.task)) {
    throw notFound("Request not found");
  }
  if (application.status !== "pending" || application.task.status !== "open") {
    throw conflict("Request already resolved");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    if (dto.action === "accepted") {
      await startContract(tx, application);
    } else {
      await tx.application.update({ where: { applicationId }, data: { status: "declined" } });
    }

    const request = await findServiceRequestForTask(tx, application.task, gigProfileId);
    if (request?.status === "pending") {
      await tx.serviceRequest.update({ where: { requestId: request.requestId }, data: { status: dto.action } });
    }

    return tx.application.findUniqueOrThrow({ where: { applicationId } });
  });
}

// List tasks the gig professional is currently hired on.
export function listActiveTasks(gigProfileId: number) {
  return prisma.task.findMany({
    where: {
      assignments: { some: { gigProfileId } },
      status: "in_progress",
    },
    include: {
      client: true,
      deliverables: {
        where: { gigProfileId },
        include: { claimedDefinitions: { include: { definition: true } } },
        orderBy: { deliverableNo: "asc" },
      },
      deliverableDefinitions: {
        include: {
          submissions: {
            where: { submission: { gigProfileId } },
            include: { submission: { select: { deliverableNo: true, status: true } } },
            orderBy: { deliverableNo: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listTaskDeliverableDefinitions(gigProfileId: number, taskId: number) {
  const assignment = await prisma.gigManagerAssignment.findUnique({
    where: { gigProfileId_taskId: { gigProfileId, taskId } },
    select: { taskId: true },
  });
  if (!assignment) throw notFound("Task assignment not found");

  const definitions = await prisma.taskDeliverableDefinition.findMany({
    where: { taskId },
    include: {
      submissions: {
        where: { submission: { gigProfileId } },
        include: { submission: { select: { deliverableNo: true, description: true, submissionPath: true, status: true, createdAt: true, feedback: true } } },
        orderBy: { deliverableNo: "desc" },
      },
    },
    orderBy: { definitionId: "asc" },
  });

  return definitions.map(definition => ({
    definitionId: definition.definitionId,
    taskId: definition.taskId,
    title: definition.title,
    description: definition.description,
    createdAt: definition.createdAt.toISOString(),
    submissions: definition.submissions.map(({ submission }) => ({
      deliverableNo: submission.deliverableNo,
      description: submission.description,
      submissionPath: submission.submissionPath,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
      feedback: submission.feedback,
    })),
  }));
}

/**
 * Submit work only for a task assigned to this professional. Definition links
 * and the submission are committed together so no checkbox claim is synthetic.
 * content -> DELIVERABLE.description (the substantive text), notes ->
 * submission_path (falls back to content so the required column is never
 * empty). See toDeliverableResponse in gig.controller.ts for the read side.
 */
export async function submitDeliverable(gigProfileId: number, dto: SubmitDeliverableDto) {
  const assignment = await prisma.gigManagerAssignment.findUnique({
    where: { gigProfileId_taskId: { gigProfileId, taskId: dto.taskId } },
  });
  if (!assignment) {
    throw forbidden("You are not assigned to this task");
  }

  // Lengths are capped by submitDeliverableSchema, so nothing is silently truncated here.
  const contentText = (dto.content || "").trim();
  const notesText = dto.notes && dto.notes.trim() ? dto.notes.trim() : contentText;
  if (!contentText) throw badRequest("Submission details are required");

  const definitionIds = dto.definitionIds ?? [];
  if (new Set(definitionIds).size !== definitionIds.length) throw badRequest("A deliverable can only be selected once");

  return prisma.$transaction(async tx => {
    const task = await tx.task.findUnique({ where: { taskId: dto.taskId }, select: { status: true } });
    if (!task) throw notFound("Task not found");
    if (task.status !== "in_progress") throw forbidden("Work can only be submitted for an active task");

    const definitions = await tx.taskDeliverableDefinition.findMany({
      where: { taskId: dto.taskId },
      include: { submissions: { include: { submission: { select: { deliverableNo: true, status: true } } }, orderBy: { deliverableNo: "desc" } } },
    });
    if (definitions.length > 0 && definitionIds.length === 0) {
      throw badRequest("Select at least one task deliverable completed by this submission");
    }
    const selected = definitions.filter(definition => definitionIds.includes(definition.definitionId));
    if (selected.length !== definitionIds.length) throw badRequest("One or more selected deliverables do not belong to this task");

    for (const definition of selected) {
      const latestStatus = definition.submissions[0]?.submission.status;
      if (latestStatus && latestStatus !== "revision_requested") {
        throw conflict(`“${definition.title}” already has a submission under review or has been approved`);
      }
    }

    const last = await tx.deliverable.findFirst({ where: { taskId: dto.taskId }, orderBy: { deliverableNo: "desc" } });
    if (definitions.length === 0 && last) {
      if (last.status === "submitted") {
        throw conflict("A deliverable submission is already under review for this task");
      }
      if (last.status === "approved" || last.status === "closed") {
        throw conflict("The deliverable for this task has already been approved");
      }
    }
    const deliverableNo = (last?.deliverableNo ?? 0) + 1;
    const submission = await tx.deliverable.create({
      data: {
        taskId: dto.taskId,
        deliverableNo,
        gigProfileId,
        description: contentText,
        submissionPath: notesText || contentText,
      },
    });

    if (selected.length > 0) {
      await tx.deliverableSubmissionItem.createMany({
        data: selected.map(definition => ({ taskId: dto.taskId, deliverableNo, definitionId: definition.definitionId })),
      });
    }

    return tx.deliverable.findUniqueOrThrow({
      where: { taskId_deliverableNo: { taskId: dto.taskId, deliverableNo } },
      include: { claimedDefinitions: { include: { definition: true } } },
    });
  }, { isolationLevel: "Serializable" });
}

// List services the gig professional has posted.
export function listMyServices(gigProfileId: number) {
  return prisma.service.findMany({
    where: { gigProfileId },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });
}

// Post a new service listing.
export function createService(gigProfileId: number, dto: CreateServiceDto) {
  return prisma.service.create({
    data: {
      gigProfileId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      price: dto.price,
      ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      tags: { create: dto.tags.map((tag) => ({ tag })) },
    },
    include: { tags: true },
  });
}

// Leave a review from the gig professional (reviewer) for the task's client (reviewee).
export async function createReview(gigProfileId: number, dto: CreateReviewDto) {
  const gigProfile = await prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
  });
  // Only the professional who was hired can review the client, and only once the task is done.
  const task = await prisma.task.findFirst({
    where: { taskId: dto.taskId, assignments: { some: { gigProfileId } } },
    include: { client: true },
  });
  if (!task) {
    throw notFound("Task not found");
  }
  if (task.status !== "completed") {
    throw conflict("You can review the client once the task is completed");
  }

  const existingReview = await prisma.review.findFirst({
    where: { taskId: dto.taskId, reviewerId: gigProfile.userId, revieweeId: task.client.userId },
  });
  if (existingReview) {
    throw conflict("You have already reviewed this client for this task");
  }

  return prisma.review.create({
    data: {
      taskId: dto.taskId,
      reviewerId: gigProfile.userId,
      revieweeId: task.client.userId,
      rating: dto.rating,
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });
}

// List the gig professional's completed tasks with reviews and payment info.
export function listCompletedProjects(gigProfileId: number) {
  return prisma.task.findMany({
    where: { assignments: { some: { gigProfileId } }, status: "completed" },
    include: {
      client: true,
      reviews: { include: { reviewer: true, reviewee: true }, orderBy: { createdAt: "asc" } },
      payments: { where: { gigProfileId } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Sum completed payments and count completed tasks for the earnings summary.
export async function getEarnings(gigProfileId: number) {
  const payments = await prisma.payment.findMany({
    where: { gigProfileId },
    include: { task: { include: { client: true } } },
    orderBy: { createdAt: "desc" },
  });
  const totalEarnings = payments
    .filter((p: { status: string }) => p.status === "completed")
    .reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0);
  const completedTasks = await prisma.task.count({
    where: { assignments: { some: { gigProfileId } }, status: "completed" },
  });

  return { payments, totalEarnings, completedTasks };
}
