/**
 * Business logic behind the Super Admin API. Every number returned comes from a
 * query: a missing value is returned as null and shown as a dash, never replaced
 * with a plausible-looking default.
 *
 * Authorization and audit logging are applied per route (see admin.route.ts and
 * middleware/adminGuard.ts), so functions here only check business rules.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "db";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { signInviteToken, signToken, verifyInviteToken } from "../../lib/jwt.js";
import { env } from "../../lib/env.js";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../lib/httpError.js";
import { decryptSecret, encryptSecret, newTotpSecret, verifyTotp } from "../../lib/totp.js";
import { writeAudit, type AdminPermission } from "../../middleware/adminGuard.js";
import { assertNoOpenDispute, refundPayment, releasePayment, settleDisputedEscrow } from "../payment/payment.service.js";
import type {
  AcceptAdminInvitationDto,
  CreateAdminInvitationDto,
  CreateApplicationDto,
  CreateAssignmentDto,
  CreateClientDto,
  CreateDeliverableDto,
  CreateGigProfileDto,
  CreateManagerDto,
  CreateReviewDto,
  CreateTaskDto,
  CreateUserDto,
  ModerateReviewDto,
  OverridePaymentDto,
  SettleDisputeDto,
  UpdateApplicationDto,
  UpdateClientDto,
  UpdateDeliverableDto,
  UpdateGigProfileDto,
  UpdateReviewDto,
  UpdateTaskDto,
  UpdateUserDto,
} from "./admin.dto.js";

const PAYMENT_STATUS_LABEL = {
  pending: "AWAITING_FUNDING",
  held: "HELD_IN_ESCROW",
  completed: "RELEASED",
  refunded: "REFUNDED",
  failed: "FAILED",
} as const;

/** The UI sends ids like "cli-12" and "PAY-3"; the database key is the number. Unparseable input becomes 0, which matches no row. */
const numericId = (raw: string | number): number => Number(String(raw).replace(/\D/g, "")) || 0;

const dateOnly = (d: Date) => d.toISOString().split("T")[0];

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---- Users --------------------------------------------------------------

/** List every user with a role-derived summary. Status comes from the account row. */
export const listUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      gigProfile: { include: { skills: true } },
      managerLink: { include: { client: true } },
    },
  });

  return users.map((u) => ({
    id: "usr-" + u.userId,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role.toUpperCase(),
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    profileSummary: u.client
      ? "Client Organization: " + u.client.clientName
      : u.gigProfile
        ? "Gig Professional (" + u.gigProfile.skills.map((sk) => sk.skill).join(", ") + ")"
        : u.managerLink
          ? "Manager (Client: " + u.managerLink.client.clientName + ")"
          : "Admin Staff",
  }));
};

// Fetch one user with their full role-specific relations (client's tasks, gig pro's deliverables, etc.).
export const getUser = async (userId: number) => {
  const u = await prisma.user.findUniqueOrThrow({
    where: { userId },
    include: {
      client: { include: { tasks: true, managers: true } },
      gigProfile: { include: { skills: true, deliverables: true, services: true, payments: true } },
      managerLink: { include: { client: true, assignments: true } },
    },
  });
  return {
    id: "usr-" + u.userId,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role.toUpperCase(),
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    client: u.client,
    gigProfile: u.gigProfile,
    managerLink: u.managerLink,
  };
};

/** Create a non-admin user directly. Admin seats only come from invitations, so the DTO excludes that role. */
export async function createUser(dto: CreateUserDto) {
  return prisma.user.create({
    data: { name: dto.name, email: dto.email.trim(), hashPassword: await hashPassword(dto.password), role: dto.role },
  });
}

/**
 * Update a non-admin user. Admin accounts are refused because this route needs
 * only users:ban, and resetting an admin's password or role through it would be
 * a privilege escalation. A password or role change also ends their sessions.
 */
export async function updateUser(userId: number, dto: UpdateUserDto) {
  const target = await prisma.user.findUniqueOrThrow({ where: { userId } });
  if (target.role === "admin") throw forbidden("Admin accounts are managed through Admin Staff, not this route");
  return prisma.user.update({
    where: { userId },
    data: {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim() } : {}),
      ...(dto.password !== undefined ? { hashPassword: await hashPassword(dto.password) } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.password !== undefined || dto.role !== undefined ? { tokenVersion: { increment: 1 } } : {}),
    },
  });
}

/**
 * Delete a user. Removing an admin also needs admins:invite, and the OWNER seat
 * and your own account can never be removed, so the platform can't be left without a root admin.
 */
export async function deleteUser(userId: number, actorUserId: number, actorCanManageAdmins: boolean): Promise<void> {
  if (userId === actorUserId) throw conflict("You cannot remove your own account");
  const target = await prisma.user.findUniqueOrThrow({ where: { userId } });
  if (target.role === "admin") {
    if (!actorCanManageAdmins) throw forbidden("Requires permission: admins:invite");
    if (target.adminTier === "OWNER") throw conflict("The platform owner account cannot be removed");
  }
  await prisma.user.delete({ where: { userId } });
}

// ---- Clients --------------------------------------------------------------

/**
 * List clients with spend derived from the ledger. Spend is what they actually
 * committed (gig amount + fee, held or released), so a posted-but-unfunded
 * budget doesn't count and a refund correctly drops out.
 */
export const listClients = async () => {
  const clients = await prisma.client.findMany({
    include: {
      user: true,
      managers: { include: { user: true } },
      tasks: { include: { payments: true } },
    },
    orderBy: { clientId: "asc" },
  });

  return clients.map((c) => {
    const totalSpent = c.tasks
      .flatMap((t) => t.payments)
      .filter((p) => p.status === "completed" || p.status === "held")
      .reduce((sum, p) => sum + Number(p.amount) + Number(p.platformFee), 0);

    return {
      id: "cli-" + c.clientId,
      clientId: c.clientId,
      userId: "usr-" + c.userId,
      name: c.user.name,
      companyName: c.clientName,
      email: c.user.email,
      domain: c.domain,
      totalSpent,
      activeGigsCount: c.tasks.filter((t) => t.status === "open" || t.status === "in_progress").length,
      completedGigsCount: c.tasks.filter((t) => t.status === "completed").length,
      assignedManagersCount: c.managers.length,
      managers: c.managers.map((m) => ({
        managerId: m.managerId,
        name: m.user.name,
        email: m.user.email,
        status: m.user.status,
      })),
      kycStatus: c.kycStatus,
      isVerified: c.kycStatus === "VERIFIED",
      status: c.user.status,
      joinedDate: dateOnly(c.user.createdAt),
    };
  });
};

// Fetch one client with its full task/payment/deliverable/application history.
export const getClient = (clientId: number) =>
  prisma.client.findUniqueOrThrow({
    where: { clientId },
    include: {
      user: true,
      managers: { include: { user: true } },
      tasks: { include: { payments: true, deliverables: true, applications: true } },
      serviceRequests: true
    }
  });

// Create a client record directly, linked to an existing user.
export const createClient = (dto: CreateClientDto) =>
  prisma.client.create({
    data: {
      userId: dto.userId,
      clientName: dto.clientName,
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

// Update a client's name/domain.
export const updateClient = (clientId: number, dto: UpdateClientDto) =>
  prisma.client.update({
    where: { clientId },
    data: {
      ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

// Delete a client.
export async function deleteClient(clientId: number): Promise<void> {
  await prisma.client.delete({ where: { clientId } });
}

// ---- Managers ---------------------------------------------------------

/**
 * List managers with their live workload. Suspending a manager only flips their
 * account status: assignments stay in place so no task is orphaned, the client
 * keeps full control, and they can reassign the work from their own portal.
 */
export const listManagers = async () => {
  const managers = await prisma.manager.findMany({
    include: {
      user: true,
      client: true,
      assignments: { include: { task: { include: { payments: { select: { gigProfileId: true, status: true } } } } } },
    },
    orderBy: { managerId: "asc" },
  });

  return managers.map((m) => ({
    id: "mgr-" + m.managerId,
    managerId: m.managerId,
    userId: "usr-" + m.userId,
    name: m.user.name,
    email: m.user.email,
    clientId: m.clientId,
    clientName: m.client.clientName,
    linkedClients: [m.client.clientName],
    activeSupervisedTasks: m.assignments.filter((a) => a.task.payments.some((p) => p.gigProfileId === a.gigProfileId && p.status === "held")).length,
    status: m.user.status,
    createdAt: dateOnly(m.createdAt),
  }));
};

// Create a manager record directly, linking an existing user to a client.
export const createManager = (dto: CreateManagerDto) =>
  prisma.manager.create({ data: { userId: dto.userId, clientId: dto.clientId } });

// Delete a manager.
export async function deleteManager(clientId: number, managerId: number): Promise<void> {
  await prisma.manager.delete({ where: { clientId_managerId: { clientId, managerId } } });
}

// ---- Gig profiles -------------------------------------------------------

/**
 * List gig professionals. Rating averages only reviews that aren't HIDDEN, so
 * moderating a review really changes the score, and is null until a pro has
 * one. Badge is whatever an admin awarded; it is never inferred.
 */
export const listGigProfiles = async () => {
  const pros = await prisma.gigProfessionalProfile.findMany({
    include: {
      user: { include: { reviewsReceived: { where: { status: { not: "HIDDEN" } }, select: { rating: true } } } },
      skills: true,
      tools: true,
      portfolio: true,
      payments: true,
      assignments: { include: { task: true } },
    },
    orderBy: { gigProfileId: "asc" },
  });

  return pros.map((g) => {
    const ratings = g.user.reviewsReceived.map((r) => r.rating);
    return {
      id: "gig-" + g.gigProfileId,
      gigProfileId: g.gigProfileId,
      userId: "usr-" + g.userId,
      name: g.user.name,
      email: g.user.email,
      headline: g.bio,
      skills: g.skills.map((sk) => sk.skill),
      tools: g.tools.map((t) => t.tool),
      portfolioUrls: g.portfolio.map((p) => p.url),
      portfolioCount: g.portfolio.length,
      totalEarnings: g.payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0),
      completedJobs: g.payments.filter((p) => p.status === "completed" || p.status === "refunded").length,
      rating: ratings.length > 0 ? round1(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null,
      reviewCount: ratings.length,
      badge: g.badge ?? "NONE",
      status: g.user.status,
    };
  });
};

// Fetch one gig professional profile with all relations.
export const getGigProfile = (gigProfileId: number) =>
  prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
    include: { user: true, skills: true, tools: true, portfolio: true, deliverables: true, services: true }
  });

// Create a gig profile directly, linked to an existing user.
export const createGigProfile = (dto: CreateGigProfileDto) =>
  prisma.gigProfessionalProfile.create({
    data: { userId: dto.userId, ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

// Update a gig profile's bio.
export const updateGigProfile = (gigProfileId: number, dto: UpdateGigProfileDto) =>
  prisma.gigProfessionalProfile.update({
    where: { gigProfileId },
    data: { ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

// Delete a gig profile.
export async function deleteGigProfile(gigProfileId: number): Promise<void> {
  await prisma.gigProfessionalProfile.delete({ where: { gigProfileId } });
}

// ---- Tasks & Projects ---------------------------------------------------

/**
 * List tasks with their escrow state and delivery progress. Fee and escrow
 * status come from the PAYMENT row; before anyone is hired there isn't one, so
 * they are null. A null managerName means the client supervises the task.
 */
export const listTasks = async () => {
  const tasks = await prisma.task.findMany({
    include: {
      client: true,
      deliverables: true,
      applications: true,
      payments: true,
      assignments: {
        include: {
          gigProfile: { include: { user: true } },
          manager: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((t) => {
    const assignment = t.assignments[0];
    const payment = t.payments[0];
    return {
      id: "tsk-" + t.taskId,
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      category: t.category,
      clientId: "cli-" + t.clientId,
      clientName: t.client.clientName,
      gigProId: assignment ? "gig-" + assignment.gigProfileId : null,
      gigProName: assignment?.gigProfile.user.name ?? null,
      managerName: assignment?.manager?.user.name ?? null,
      budget: Number(t.budget),
      platformFee: payment ? Number(payment.platformFee) : null,
      escrowStatus: payment ? PAYMENT_STATUS_LABEL[payment.status] : null,
      status: t.status.toUpperCase(),
      deliverablesCount: t.deliverables.length,
      deliverablesApproved: t.deliverables.filter((d) => d.status === "approved" || d.status === "closed").length,
      applicationsCount: t.applications.length,
      dueDate: t.dueDate ? dateOnly(t.dueDate) : null,
      createdAt: dateOnly(t.createdAt),
      updatedAt: dateOnly(t.updatedAt),
    };
  });
};

// Fetch one task with client/deliverables/payments/applications/assignments.
export const getTask = (taskId: number) =>
  prisma.task.findUniqueOrThrow({
    where: { taskId },
    include: {
      client: { include: { user: true } },
      deliverables: true,
      payments: true,
      applications: { include: { gigProfile: { include: { user: true } } } },
      assignments: { include: { gigProfile: { include: { user: true } }, manager: { include: { user: true } } } }
    },
  });

// Create a task directly on behalf of a client.
export const createTask = (dto: CreateTaskDto) =>
  prisma.task.create({
    data: {
      clientId: dto.clientId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      skills: dto.skills ?? [],
      budget: dto.budget,
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
    },
  });

/**
 * Update a task, including an admin status override. While money is in escrow,
 * only in_progress is allowed: completing or reopening the task here would strand
 * the funds, so that has to go through a release, refund or arbitration ruling.
 */
export async function updateTask(taskId: number, dto: UpdateTaskDto) {
  if (dto.status !== undefined && dto.status !== "in_progress") {
    const held = await prisma.payment.count({ where: { taskId, status: "held" } });
    if (held > 0) throw conflict("Funds are held in escrow for this task. Release or refund them instead of overriding its status.");
  }
  return prisma.task.update({
    where: { taskId },
    data: {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });
}

// Delete a task.
export async function deleteTask(taskId: number): Promise<void> {
  await prisma.task.delete({ where: { taskId } });
}

// ---- Applications -------------------------------------------------------

// List every application platform-wide, with task/client/gig-pro context.
export const listApplications = async () => {
  const applications = await prisma.application.findMany({
    include: {
      task: { include: { client: { include: { user: true } } } },
      gigProfile: { include: { user: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return applications.map((a) => ({
    id: "app-" + a.applicationId,
    applicationId: a.applicationId,
    taskId: a.taskId,
    taskTitle: a.task.title,
    clientName: a.task.client.clientName,
    gigProfileId: a.gigProfileId,
    gigProName: a.gigProfile.user.name,
    hourlyRate: a.hourlyRate ? Number(a.hourlyRate) : null,
    rating: a.rating,
    status: a.status.toUpperCase(),
    createdAt: dateOnly(a.createdAt),
  }));
};

// Create an application directly.
export const createApplication = (dto: CreateApplicationDto) =>
  prisma.application.create({
    data: {
      taskId: dto.taskId,
      gigProfileId: dto.gigProfileId,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Update an application's status.
export const updateApplication = (applicationId: number, dto: UpdateApplicationDto) =>
  prisma.application.update({
    where: { applicationId },
    data: {
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Delete an application.
export async function deleteApplication(applicationId: number): Promise<void> {
  await prisma.application.delete({ where: { applicationId } });
}

// ---- Assignments --------------------------------------------------------

// List every gig-professional-to-manager task assignment platform-wide.
export const listAssignments = () =>
  prisma.gigManagerAssignment.findMany({
    include: {
      gigProfile: { include: { user: true } },
      manager: { include: { user: true } },
      task: true
    }
  });

// Create an assignment directly (bypassing the normal accept-application flow).
export const createAssignment = (dto: CreateAssignmentDto) =>
  prisma.gigManagerAssignment.create({
    data: { gigProfileId: dto.gigProfileId, taskId: dto.taskId, managerId: dto.managerId },
  });

// Delete an assignment.
export async function deleteAssignment(gigProfileId: number, taskId: number): Promise<void> {
  await prisma.gigManagerAssignment.delete({
    where: { gigProfileId_taskId: { gigProfileId, taskId } },
  });
}

// ---- Deliverables -------------------------------------------------------

// List every deliverable platform-wide, with task/client/gig-pro context.
export const listDeliverables = async () => {
  const deliverables = await prisma.deliverable.findMany({
    include: {
      task: { include: { client: { include: { user: true } } } },
      gigProfile: { include: { user: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return deliverables.map((d) => ({
    id: "del-" + d.taskId + "-" + d.deliverableNo,
    taskId: d.taskId,
    deliverableNo: d.deliverableNo,
    taskTitle: d.task.title,
    clientName: d.task.client.clientName,
    gigProfileId: d.gigProfileId,
    gigProName: d.gigProfile.user.name,
    description: d.description,
    submissionPath: d.submissionPath,
    status: d.status.toUpperCase(),
    feedback: d.feedback,
    createdAt: dateOnly(d.createdAt),
  }));
};

// Create a deliverable directly, auto-incrementing its per-task sequence number.
export const createDeliverable = async (dto: CreateDeliverableDto) => {
  const last = await prisma.deliverable.findFirst({
    where: { taskId: dto.taskId },
    orderBy: { deliverableNo: "desc" }
  });
  const deliverableNo = (last?.deliverableNo ?? 0) + 1;

  return prisma.deliverable.create({
    data: {
      taskId: dto.taskId,
      deliverableNo,
      gigProfileId: dto.gigProfileId,
      description: dto.description,
      submissionPath: dto.submissionPath,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });
};

// Update a deliverable's fields directly.
export const updateDeliverable = (
  taskId: number,
  deliverableNo: number,
  dto: UpdateDeliverableDto,
) =>
  prisma.deliverable.update({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    data: {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.submissionPath !== undefined ? { submissionPath: dto.submissionPath } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    },
  });

// Delete a deliverable.
export async function deleteDeliverable(taskId: number, deliverableNo: number): Promise<void> {
  await prisma.deliverable.delete({ where: { taskId_deliverableNo: { taskId, deliverableNo } } });
}

// ---- Payments -----------------------------------------------------------

/**
 * The transaction ledger, read-only by design: there is deliberately no raw
 * create, update or delete route for payments. Rows only change through escrow
 * transitions, which are audited.
 */
export const listPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      task: { include: { client: true } },
      gigProfile: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((p) => {
    const amount = Number(p.amount);
    const platformFee = Number(p.platformFee);
    return {
      id: "pay-" + p.paymentId,
      paymentId: p.paymentId,
      taskId: "tsk-" + p.taskId,
      taskTitle: p.task.title,
      clientId: "cli-" + p.task.clientId,
      clientName: p.task.client.clientName,
      gigProId: "gig-" + p.gigProfileId,
      gigProName: p.gigProfile.user.name,
      amount,
      platformFee,
      totalAmount: amount + platformFee,
      status: PAYMENT_STATUS_LABEL[p.status],
      createdAt: dateOnly(p.createdAt),
      settledAt: p.settledAt ? dateOnly(p.settledAt) : null,
    };
  });
};

/**
 * Manually release or refund a held payment, with the reason captured in the
 * audit trail. Refused during an open dispute, where only the ruling may move the money.
 */
export async function overridePayment(paymentId: number, dto: OverridePaymentDto) {
  const payment = await prisma.payment.findUnique({ where: { paymentId } });
  if (!payment) throw notFound("Payment not found");
  await assertNoOpenDispute(payment.taskId);
  if (dto.action === "RELEASE") await releasePayment(payment.taskId, payment.gigProfileId);
  else await refundPayment(payment.taskId, payment.gigProfileId);
  return prisma.payment.findUniqueOrThrow({ where: { paymentId } });
}

// ---- Reviews ------------------------------------------------------------

/** The moderation queue. A review with no comment returns null rather than invented text. */
export const listReviews = async () => {
  const reviews = await prisma.review.findMany({
    include: { reviewer: true, reviewee: true, task: true },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((r) => ({
    id: "rev-" + r.reviewId,
    reviewId: r.reviewId,
    taskId: "tsk-" + r.taskId,
    taskTitle: r.task.title,
    reviewerName: r.reviewer.name,
    reviewerRole: r.reviewer.role.toUpperCase(),
    targetUserName: r.reviewee.name,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    moderatorNotes: r.moderatorNotes,
    createdAt: dateOnly(r.createdAt),
  }));
};

// Create a review directly.
export const createReview = (dto: CreateReviewDto) =>
  prisma.review.create({
    data: {
      reviewerId: dto.reviewerId,
      revieweeId: dto.revieweeId,
      taskId: dto.taskId,
      rating: dto.rating,
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });

// Update a review's rating/comment.
export const updateReview = (reviewId: number, dto: UpdateReviewDto) =>
  prisma.review.update({
    where: { reviewId },
    data: {
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });

// Delete a review.
export async function deleteReview(reviewId: number): Promise<void> {
  await prisma.review.delete({ where: { reviewId } });
}

// ---- Dashboard stats & Analytics ------------------------------------------

/**
 * Dashboard KPIs, aggregated in the database rather than loading every payment.
 * GMV counts money actually committed (held + released). Revenue counts only the
 * fee on released payments, since a fee in escrow can still be refunded.
 * Rates are null when there's nothing to divide by, not a flattering default.
 */
export async function getDashboardStats() {
  const [totalUsers, activeTasks, pendingDisputes, payments, kyc, ratings] = await Promise.all([
    prisma.user.count(),
    prisma.task.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.payment.groupBy({ by: ["status"], _sum: { amount: true, platformFee: true } }),
    prisma.client.groupBy({ by: ["kycStatus"], _count: { clientId: true } }),
    prisma.review.aggregate({ where: { status: { not: "HIDDEN" } }, _avg: { rating: true } }),
  ]);

  const totalFor = (status: "completed" | "held") => {
    const row = payments.find((p) => p.status === status);
    return Number(row?._sum.amount ?? 0) + Number(row?._sum.platformFee ?? 0);
  };
  const totalClients = kyc.reduce((sum, row) => sum + row._count.clientId, 0);
  const verifiedClients = kyc.find((row) => row.kycStatus === "VERIFIED")?._count.clientId ?? 0;

  return {
    grossMerchandiseVolume: totalFor("completed") + totalFor("held"),
    platformRevenue: Number(payments.find((p) => p.status === "completed")?._sum.platformFee ?? 0),
    escrowHeld: totalFor("held"),
    activeTasks,
    totalUsers,
    pendingDisputes,
    kycVerificationRate: totalClients > 0 ? round1((verifiedClients / totalClients) * 100) : null,
    avgPlatformRating: ratings._avg.rating === null ? null : round1(Number(ratings._avg.rating)),
  };
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "ytd";

export interface VelocityBucket {
  label: string;
  start: number;
  end: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Splits a range into fixed, non-overlapping intervals: 7D daily, 30D 5-day,
 * 90D 15-day, YTD calendar bi-monthly. Each payment lands in exactly one bucket
 * at its true amount, so a chart bar is a plain sum with no scaling or
 * multiplier applied. End is exclusive, and the last bucket reaches "now" so a
 * payment made this instant is counted. All dates are UTC so a bucket doesn't
 * depend on the server's timezone.
 */
export function buildVelocityBuckets(range: AnalyticsRange, now: Date): VelocityBucket[] {
  const nowMs = now.getTime();
  const shortDate = (ms: number, options: Intl.DateTimeFormatOptions) =>
    new Date(ms).toLocaleDateString("en-US", { timeZone: "UTC", ...options });

  if (range === "ytd") {
    const year = now.getUTCFullYear();
    const buckets: VelocityBucket[] = [];
    for (let month = 0; month <= now.getUTCMonth(); month += 2) {
      const start = Date.UTC(year, month, 1);
      const end = Math.min(Date.UTC(year, month + 2, 1), nowMs + 1);
      buckets.push({
        label: shortDate(start, { month: "short" }) + "–" + shortDate(Date.UTC(year, month + 1, 1), { month: "short" }),
        start,
        end,
      });
    }
    return buckets;
  }

  const { days, count } = { "7d": { days: 1, count: 7 }, "30d": { days: 5, count: 6 }, "90d": { days: 15, count: 6 } }[range];
  return Array.from({ length: count }, (_, i) => {
    const end = nowMs + 1 - (count - 1 - i) * days * DAY_MS;
    const start = end - days * DAY_MS;
    return {
      label: range === "7d"
        ? shortDate(start, { weekday: "short", day: "numeric" })
        : shortDate(start, { month: "short", day: "numeric" }),
      start,
      end,
    };
  });
}

/**
 * Financial velocity and category mix for a time range, from released payments
 * bucketed on settledAt, the moment money moved, rather than on when the job was
 * hired. Category volume uses the same payments, so the table reconciles exactly
 * to the chart: shares sum to 100% of the GMV shown for the same range.
 */
export async function getAnalytics(rawRange: string = "30d") {
  const range: AnalyticsRange = rawRange === "7d" || rawRange === "90d" || rawRange === "ytd" ? rawRange : "30d";
  const buckets = buildVelocityBuckets(range, new Date());

  const [payments, tasksPerClient] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "completed", settledAt: { gte: new Date(buckets[0]!.start) } },
      include: { task: { select: { category: true, clientId: true } } },
    }),
    prisma.task.groupBy({ by: ["clientId"], _count: { taskId: true } }),
  ]);

  const velocity = buckets.map((b) => ({ date: b.label, gmv: 0, rake: 0 }));
  const categoryTotals = new Map<string, { contracts: number; gmv: number }>();
  let grossVolume = 0;
  let platformRake = 0;

  for (const p of payments) {
    const settled = p.settledAt!.getTime();
    const index = buckets.findIndex((b) => settled >= b.start && settled < b.end);
    if (index < 0) continue;
    const rake = Number(p.platformFee);
    const gmv = Number(p.amount) + rake;
    velocity[index]!.gmv += gmv;
    velocity[index]!.rake += rake;
    grossVolume += gmv;
    platformRake += rake;

    const name = p.task.category ?? "Uncategorized";
    const totals = categoryTotals.get(name) ?? { contracts: 0, gmv: 0 };
    categoryTotals.set(name, { contracts: totals.contracts + 1, gmv: totals.gmv + gmv });
  }

  const contractCount = [...categoryTotals.values()].reduce((sum, c) => sum + c.contracts, 0);
  const peak = velocity.reduce<(typeof velocity)[number] | null>(
    (best, v) => (v.gmv > 0 && (!best || v.gmv > best.gmv) ? v : best),
    null,
  );
  const repeatClients = tasksPerClient.filter((c) => c._count.taskId > 1).length;

  return {
    timeRange: range,
    grossVolume,
    platformRake,
    avgContractValue: contractCount > 0 ? Math.round(grossVolume / contractCount) : null,
    repeatClientRate: tasksPerClient.length > 0 ? round1((repeatClients / tasksPerClient.length) * 100) : null,
    velocity,
    peak: peak && { date: peak.date, gmv: peak.gmv },
    categories: [...categoryTotals.entries()]
      .sort((a, b) => b[1].gmv - a[1].gmv)
      .map(([category, c]) => ({
        category,
        contracts: c.contracts,
        totalVolume: c.gmv,
        avgContractValue: Math.round(c.gmv / c.contracts),
        marketShare: round1((c.gmv / grossVolume) * 100),
      })),
  };
}

// ---- Admin Staff & Invitations -------------------------------------------

/**
 * Starting permission set for each tier. The invite form pre-fills from the same
 * table, then an inviter can narrow it, and the result is stored on the account.
 * OWNER isn't offered here: that seat is assigned once by the migration.
 */
export const TIER_DEFAULT_PERMISSIONS: Record<CreateAdminInvitationDto["role"], AdminPermission[]> = {
  SUPER_ADMIN: ["users:read", "users:ban", "payments:read", "payments:refund", "payments:release", "disputes:resolve", "reviews:moderate", "settings:manage", "admins:invite"],
  FINANCIAL_ADMIN: ["users:read", "payments:read", "payments:refund", "payments:release"],
  SUPPORT_ADMIN: ["users:read", "disputes:resolve", "reviews:moderate"],
  CONTENT_MODERATOR: ["users:read", "reviews:moderate"],
  AUDITOR: ["users:read", "payments:read"],
};

/** The staff roster, from the persisted tier and permission columns. */
export async function listAdminStaff() {
  const admins = await prisma.user.findMany({ where: { role: "admin" }, orderBy: { userId: "asc" } });
  return admins.map((a) => ({
    id: "adm-" + a.userId,
    name: a.name,
    email: a.email,
    role: a.adminTier,
    permissions: a.adminPermissions,
    isTwoFactorEnabled: a.twoFactorEnabled,
    createdAt: a.createdAt,
    status: a.status,
  }));
}

const ADMIN_INVITE_TTL = "48h";

/**
 * Provision an INVITED admin seat and return a signed 48h link plus a one-time
 * password. Sharing them over separate channels means neither one alone activates
 * the seat. INVITED accounts can't log in or pass authGuard until activated.
 * Nobody can grant a permission they don't hold themselves.
 */
export async function createAdminInvitation(dto: CreateAdminInvitationDto, actorPermissions: string[]) {
  const { email, role } = dto;
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (existing) throw conflict("An account with this email already exists");

  const permissions = dto.permissions?.length ? dto.permissions : TIER_DEFAULT_PERMISSIONS[role];
  if (!actorPermissions.includes("*")) {
    const excess = permissions.filter((p) => !actorPermissions.includes(p));
    if (excess.length > 0) throw forbidden("You cannot grant permissions you don't hold: " + excess.join(", "));
  }

  const assignedPassword = randomBytes(9).toString("base64url");
  const user = await prisma.user.create({
    data: {
      name: (email.split("@")[0] ?? "").replace(/[^a-zA-Z]/g, " ").trim() || "Admin",
      email,
      hashPassword: await hashPassword(assignedPassword),
      role: "admin",
      status: "INVITED",
      adminTier: role,
      adminPermissions: permissions,
    },
  });

  const token = signInviteToken("admin_invite", { ref: user.userId, email, role }, ADMIN_INVITE_TTL);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const inviteLink = `${env.appUrl}/?admin_invite=1&token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;

  return { email, role, assignedPassword, inviteLink, token, expiresAt };
}

/**
 * Activate an invited seat. Needs the signed token and the one-time password,
 * and always replaces that password, so whoever issued the invite never knows
 * the final credential. The status check is a conditional update, so a link
 * can't be used twice even by two simultaneous requests.
 */
export async function acceptAdminInvitation(dto: AcceptAdminInvitationDto, ip: string | null) {
  const claims = verifyInviteToken("admin_invite", dto.token);
  if (!claims || claims.email.toLowerCase() !== dto.email.trim().toLowerCase()) {
    throw unauthorized("This invitation link is invalid or has expired.");
  }

  const user = await prisma.user.findUnique({ where: { userId: claims.ref }, omit: { hashPassword: false } });
  if (!user || user.role !== "admin" || !(await comparePassword(dto.password, user.hashPassword))) {
    throw unauthorized("Invalid activation password.");
  }

  const activated = await prisma.user.updateMany({
    where: { userId: user.userId, status: "INVITED" },
    data: { status: "ACTIVE", hashPassword: await hashPassword(dto.newPassword) },
  });
  if (activated.count !== 1) throw conflict("This invitation has already been used.");

  await writeAudit({
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "ADMIN_INVITE_ACCEPTED",
    target: "/invitations/accept",
    details: null,
    ipAddress: ip,
  });

  return {
    success: true,
    token: signToken({ userId: user.userId, role: "admin", tv: user.tokenVersion }),
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: "admin",
      adminTier: user.adminTier,
      permissions: user.adminPermissions,
    },
  };
}

// ---- Disputes & Arbitration ----------------------------------------------

/**
 * The docket list. SLA time is derived from createdAt on every read, so the
 * countdown really counts down and goes negative once breached. It is null for
 * closed cases. evidenceUrls defaults to [] because the column is nullable in
 * older databases and the UI maps over it. escrowHeld tells the arbitrator
 * whether a ruling can execute at all.
 */
export async function listDisputes() {
  const disputes = await prisma.dispute.findMany({
    include: {
      task: { include: { payments: { where: { status: "held" } } } },
      filedByUser: true,
      againstUser: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const now = Date.now();

  return disputes.map((d) => {
    const isOpen = d.status === "OPEN" || d.status === "UNDER_REVIEW";
    const deadline = d.createdAt.getTime() + d.slaHoursLeft * 3600 * 1000;
    return {
      id: "disp-" + d.disputeId,
      disputeId: d.disputeId,
      taskId: "tsk-" + d.taskId,
      taskTitle: d.task.title,
      filedByName: d.filedByUser.name,
      filedByRole: d.filedByUser.role.toUpperCase(),
      againstName: d.againstUser.name,
      disputeAmount: Number(d.disputeAmount),
      escrowHeld: d.task.payments.reduce((sum, p) => sum + Number(p.amount) + Number(p.platformFee), 0),
      reason: d.reason,
      description: d.description,
      evidenceUrls: d.evidenceUrls ?? [],
      status: d.status,
      slaHoursLeft: isOpen ? Math.ceil((deadline - now) / (3600 * 1000)) : null,
      resolutionNotes: d.resolutionNotes,
      settlementType: d.settlementType,
      splitPercent: d.splitPercent,
      createdAt: dateOnly(d.createdAt),
    };
  });
}

/** Execute a binding ruling: moves the escrow and closes the docket atomically (see settleDisputedEscrow). */
export async function settleDispute(rawDisputeId: string, dto: SettleDisputeDto) {
  const disputeId = numericId(rawDisputeId);
  const dispute = await prisma.dispute.findUnique({ where: { disputeId } });
  if (!dispute) throw notFound("Dispute not found");
  const outcome = await settleDisputedEscrow(
    disputeId,
    dispute.taskId,
    dto.settlementType,
    dto.splitClientPercent ?? 0,
    dto.resolutionNotes,
  );
  return { success: true, disputeId: "disp-" + disputeId, status: "RESOLVED", settlementType: dto.settlementType, ...outcome };
}

// ---- Audit Logs ----------------------------------------------------------

/**
 * The most recent 500 audit rows, newest first. The table itself is append-only,
 * enforced by a database trigger.
 *
 * ponytail: fixed window, add cursor pagination when compliance needs full history in the UI.
 */
export async function listAuditLogs() {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return rows.map((r) => ({
    id: "aud-" + r.auditId,
    adminEmail: r.actorEmail,
    action: r.action,
    target: r.target,
    details: r.details,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ---- Account Governance ---------------------------------------------------

/**
 * Maps a prefixed UI id to its USERS row. A prefixed id that matches nothing is
 * a 404: it must never fall through and be treated as a bare user id, which
 * would suspend an unrelated person.
 */
export async function resolveToUserId(targetId: string | number): Promise<number> {
  const raw = String(targetId).trim().toLowerCase();
  const id = numericId(raw);
  const owner = raw.startsWith("cli-")
    ? await prisma.client.findUnique({ where: { clientId: id }, select: { userId: true } })
    : raw.startsWith("gig-")
      ? await prisma.gigProfessionalProfile.findUnique({ where: { gigProfileId: id }, select: { userId: true } })
      : raw.startsWith("mgr-")
        ? await prisma.manager.findUnique({ where: { managerId: id }, select: { userId: true } })
        : { userId: id };
  if (!owner) throw notFound("Account not found");
  return owner.userId;
}

/** KYC decision: PENDING -> VERIFIED or REJECTED. Re-deciding is allowed, since a later review can overturn one. */
export async function decideClientKyc(rawClientId: string, status: "VERIFIED" | "REJECTED") {
  const clientId = numericId(rawClientId);
  await prisma.client.update({ where: { clientId }, data: { kycStatus: status } });
  return { success: true, clientId, kycStatus: status, isVerified: status === "VERIFIED" };
}

/** Award or clear a gig professional's badge. The value is limited by the DTO enum. */
export async function updateGigProBadge(rawGigProfileId: string, badge: "NONE" | "VERIFIED_PRO" | "TOP_RATED") {
  const gigProfileId = numericId(rawGigProfileId);
  await prisma.gigProfessionalProfile.update({
    where: { gigProfileId },
    data: { badge: badge === "NONE" ? null : badge },
  });
  return { success: true, gigProfileId, badge };
}

/**
 * Suspend or reactivate an account. authGuard checks status on every request, so
 * this takes effect on the user's very next call. Your own account and the OWNER
 * are refused so a mistake can't lock everyone out, and suspending another admin
 * also needs admins:invite, matching deleteUser.
 */
export async function updateUserStatus(targetId: string, status: "ACTIVE" | "SUSPENDED", actorUserId: number, actorCanManageAdmins: boolean) {
  const userId = await resolveToUserId(targetId);
  if (userId === actorUserId) throw conflict("You cannot change your own account status");
  const target = await prisma.user.findUniqueOrThrow({ where: { userId } });
  if (target.role === "admin" && !actorCanManageAdmins) throw forbidden("Requires permission: admins:invite");
  if (target.adminTier === "OWNER") throw conflict("The platform owner account cannot be suspended");
  if (target.status === "INVITED") throw conflict("This seat has not been activated yet. Revoke the invitation instead.");
  await prisma.user.update({ where: { userId }, data: { status } });
  return { success: true, userId, status };
}

/**
 * End every session for an account by incrementing its tokenVersion. Doing this
 * to yourself returns a fresh token, so "sign out my other devices" keeps the
 * current one alive. Doing it to someone else needs admins:invite, and the OWNER
 * can only do it to themselves.
 */
export async function revokeSessions(rawStaffId: string, actorUserId: number, actorCanManageAdmins: boolean) {
  const userId = numericId(rawStaffId);
  const isSelf = userId === actorUserId;
  if (!isSelf && !actorCanManageAdmins) throw forbidden("Requires permission: admins:invite");
  const target = await prisma.user.findUnique({ where: { userId } });
  if (!target || target.role !== "admin") throw notFound("Admin not found");
  if (!isSelf && target.adminTier === "OWNER") throw conflict("Only the platform owner can end the owner's sessions");
  const updated = await prisma.user.update({ where: { userId }, data: { tokenVersion: { increment: 1 } } });
  return {
    success: true,
    ...(isSelf ? { token: signToken({ userId, role: "admin", tv: updated.tokenVersion }) } : {}),
  };
}

/**
 * Publish, flag or hide a review. Hidden reviews stay in the table as evidence
 * but drop out of every rating average on the next read.
 */
export async function moderateReview(rawReviewId: string, dto: ModerateReviewDto) {
  const reviewId = numericId(rawReviewId);
  await prisma.review.update({
    where: { reviewId },
    data: { status: dto.status, ...(dto.moderatorNotes !== undefined ? { moderatorNotes: dto.moderatorNotes } : {}) },
  });
  return { success: true, reviewId, status: dto.status };
}

/**
 * Change your own password after re-checking the current one. Other devices are
 * signed out (a stolen session shouldn't survive a password change) and a fresh
 * token keeps this one signed in.
 */
export async function updateProfilePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { userId }, omit: { hashPassword: false } });
  if (!user || !(await comparePassword(currentPassword, user.hashPassword))) {
    throw badRequest("Current password is incorrect");
  }
  const updated = await prisma.user.update({
    where: { userId },
    data: { hashPassword: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
  });
  return { success: true, token: signToken({ userId, role: "admin", tv: updated.tokenVersion }) };
}

/**
 * Step 1 of 2FA enrollment: store a new secret while 2FA is still off and hand it
 * to the admin once. Nothing changes at login until step 2 proves their app can
 * generate valid codes, so a mistyped key can't lock anyone out. Self-service
 * only: the target is always the signed-in admin, never a value from the request.
 */
export async function enrollTwoFactor(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { userId } });
  if (user.twoFactorEnabled) throw conflict("Two-factor authentication is already enabled");
  const secret = newTotpSecret();
  await prisma.user.update({ where: { userId }, data: { totpSecret: encryptSecret(secret) } });
  const label = encodeURIComponent(`GigsForGigs:${user.email}`);
  return { secret, otpauthUri: `otpauth://totp/${label}?secret=${secret}&issuer=GigsForGigs` };
}

/** Step 2 of enrollment, and also turning 2FA off. Both need a valid code, so a hijacked session can't disable it. */
export async function setTwoFactor(userId: number, code: string, enabled: boolean) {
  const user = await prisma.user.findUniqueOrThrow({ where: { userId }, omit: { totpSecret: false } });
  if (!user.totpSecret) throw conflict("Start enrollment first");
  if (!verifyTotp(decryptSecret(user.totpSecret), code)) throw badRequest("Invalid authentication code");
  await prisma.user.update({
    where: { userId },
    data: { twoFactorEnabled: enabled, ...(enabled ? {} : { totpSecret: null }) },
  });
  return { success: true, twoFactorEnabled: enabled };
}

/** The signed-in admin's own profile. Tier, permissions and 2FA state are read fresh from the DB. */
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw notFound("Admin profile not found");
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    adminTier: user.adminTier,
    permissions: user.adminPermissions,
    isTwoFactorEnabled: user.twoFactorEnabled,
    status: user.status,
    createdAt: user.createdAt,
  };
}
