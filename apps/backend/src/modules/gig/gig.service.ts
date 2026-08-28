import { prisma } from "db";
import { conflict, forbidden, notFound } from "../../lib/httpError.js";
import type {
  CreateApplicationDto,
  CreateReviewDto,
  CreateServiceDto,
  RespondToRequestDto,
  SubmitDeliverableDto,
  UpdateGigProfileDto,
} from "./gig.dto.js";

const profileInclude = { user: true, skills: true, tools: true, portfolio: true } as const;

export function getProfile(gigProfileId: number) {
  return prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
    include: profileInclude,
  });
}

/** PUT semantics: skills/tools/portfolio are each fully replaced when present in the body, not merged. */
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

export function listMarketplaceTasks(gigProfileId: number) {
  return prisma.task.findMany({
    where: { status: "open", applications: { none: { gigProfileId } } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApplication(gigProfileId: number, dto: CreateApplicationDto) {
  const task = await prisma.task.findUnique({ where: { taskId: dto.taskId } });
  if (!task) {
    throw notFound("Task not found");
  }

  const existing = await prisma.application.findUnique({
    where: { gigProfileId_taskId: { gigProfileId, taskId: dto.taskId } },
  });
  if (existing) {
    throw conflict("Already applied to this task");
  }

  return prisma.application.create({ data: { gigProfileId, taskId: dto.taskId } });
}

export async function withdrawApplication(
  applicationId: number,
  gigProfileId: number,
): Promise<void> {
  const application = await prisma.application.findUnique({ where: { applicationId } });
  if (!application || application.gigProfileId !== gigProfileId) {
    throw notFound("Application not found");
  }
  await prisma.application.delete({ where: { applicationId } });
}

/**
 * "Pending requests" has no dedicated invitation model in the schema — it
 * is this gig professional's own pending APPLICATION rows, and "respond"
 * updates that application's own status. There is no separate offer-from-
 * client object to accept/decline against; documented as an interpretation,
 * not a schema gap.
 */
export function listPendingRequests(gigProfileId: number) {
  return prisma.application.findMany({
    where: { gigProfileId, status: "pending" },
    include: { task: { include: { client: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function respondToRequest(
  applicationId: number,
  gigProfileId: number,
  dto: RespondToRequestDto,
) {
  const application = await prisma.application.findUnique({ where: { applicationId } });
  if (!application || application.gigProfileId !== gigProfileId) {
    throw notFound("Request not found");
  }
  if (application.status !== "pending") {
    throw forbidden("Request already resolved");
  }
  return prisma.application.update({ where: { applicationId }, data: { status: dto.action } });
}

export function listActiveTasks(gigProfileId: number) {
  return prisma.task.findMany({
    where: { assignments: { some: { gigProfileId } }, status: { in: ["open", "in_progress"] } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * content -> DELIVERABLE.description (the substantive text), notes ->
 * submission_path (falls back to content so the required column is never
 * empty). See gig.serializer.ts for the read-side of this mapping.
 */
export async function submitDeliverable(gigProfileId: number, dto: SubmitDeliverableDto) {
  const assignment = await prisma.gigManagerAssignment.findUnique({
    where: { gigProfileId_taskId: { gigProfileId, taskId: dto.taskId } },
  });
  if (!assignment) {
    throw notFound("No assignment for that task");
  }

  const last = await prisma.deliverable.findFirst({
    where: { taskId: dto.taskId },
    orderBy: { deliverableNo: "desc" },
  });
  const deliverableNo = (last?.deliverableNo ?? 0) + 1;

  return prisma.deliverable.create({
    data: {
      taskId: dto.taskId,
      deliverableNo,
      gigProfileId,
      description: dto.content,
      submissionPath: dto.notes ?? dto.content,
    },
  });
}

export function listMyServices(gigProfileId: number) {
  return prisma.service.findMany({
    where: { gigProfileId },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });
}

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

export async function createReview(gigProfileId: number, dto: CreateReviewDto) {
  const gigProfile = await prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
  });
  const task = await prisma.task.findUnique({
    where: { taskId: dto.taskId },
    include: { client: true },
  });
  if (!task) {
    throw notFound("Task not found");
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

export function listCompletedProjects(gigProfileId: number) {
  return prisma.task.findMany({
    where: { assignments: { some: { gigProfileId } }, status: "completed" },
    include: {
      client: true,
      reviews: { include: { reviewer: true } },
      payments: { where: { gigProfileId } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEarnings(gigProfileId: number) {
  const payments = await prisma.payment.findMany({
    where: { gigProfileId },
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
