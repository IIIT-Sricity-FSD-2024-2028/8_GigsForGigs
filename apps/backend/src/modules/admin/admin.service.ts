import { prisma } from "db";
import { hashPassword } from "../../lib/password.js";
import type {
  CreateApplicationDto,
  CreateAssignmentDto,
  CreateClientDto,
  CreateDeliverableDto,
  CreateGigProfileDto,
  CreateManagerDto,
  CreatePaymentDto,
  CreateReviewDto,
  CreateTaskDto,
  CreateUserDto,
  UpdateApplicationDto,
  UpdateClientDto,
  UpdateDeliverableDto,
  UpdateGigProfileDto,
  UpdatePaymentDto,
  UpdateReviewDto,
  UpdateTaskDto,
  UpdateUserDto,
} from "./admin.dto.js";

// Every function here is reached only via roleGuard('admin'); no ownership
// scoping is applied anywhere in this file by design — that's what "bypass
// ownership checks" means for the admin surface.

// ---- Users --------------------------------------------------------------

export const listUsers = () => prisma.user.findMany({ orderBy: { createdAt: "desc" } });
export const getUser = (userId: number) => prisma.user.findUniqueOrThrow({ where: { userId } });

export async function createUser(dto: CreateUserDto) {
  const hashedPassword = await hashPassword(dto.password);
  return prisma.user.create({
    data: { name: dto.name, email: dto.email, hashPassword: hashedPassword, role: dto.role },
  });
}

export async function updateUser(userId: number, dto: UpdateUserDto) {
  return prisma.user.update({
    where: { userId },
    data: {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.password !== undefined ? { hashPassword: await hashPassword(dto.password) } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
    },
  });
}

export async function deleteUser(userId: number): Promise<void> {
  await prisma.user.delete({ where: { userId } });
}

// ---- Clients --------------------------------------------------------------

export const listClients = () => prisma.client.findMany({ include: { user: true } });
export const getClient = (clientId: number) =>
  prisma.client.findUniqueOrThrow({ where: { clientId }, include: { user: true } });

export const createClient = (dto: CreateClientDto) =>
  prisma.client.create({
    data: {
      userId: dto.userId,
      clientName: dto.clientName,
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

export const updateClient = (clientId: number, dto: UpdateClientDto) =>
  prisma.client.update({
    where: { clientId },
    data: {
      ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

export async function deleteClient(clientId: number): Promise<void> {
  await prisma.client.delete({ where: { clientId } });
}

// ---- Managers ---------------------------------------------------------

export const listManagers = () => prisma.manager.findMany({ include: { user: true, client: true } });

export const createManager = (dto: CreateManagerDto) =>
  prisma.manager.create({ data: { userId: dto.userId, clientId: dto.clientId } });

export async function deleteManager(clientId: number, managerId: number): Promise<void> {
  await prisma.manager.delete({ where: { clientId_managerId: { clientId, managerId } } });
}

// ---- Gig profiles -------------------------------------------------------

export const listGigProfiles = () => prisma.gigProfessionalProfile.findMany({ include: { user: true } });
export const getGigProfile = (gigProfileId: number) =>
  prisma.gigProfessionalProfile.findUniqueOrThrow({ where: { gigProfileId }, include: { user: true } });

export const createGigProfile = (dto: CreateGigProfileDto) =>
  prisma.gigProfessionalProfile.create({
    data: { userId: dto.userId, ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

export const updateGigProfile = (gigProfileId: number, dto: UpdateGigProfileDto) =>
  prisma.gigProfessionalProfile.update({
    where: { gigProfileId },
    data: { ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

export async function deleteGigProfile(gigProfileId: number): Promise<void> {
  await prisma.gigProfessionalProfile.delete({ where: { gigProfileId } });
}

// ---- Tasks --------------------------------------------------------------

export const listTasks = () => prisma.task.findMany({ include: { client: true } });
export const getTask = (taskId: number) =>
  prisma.task.findUniqueOrThrow({ where: { taskId }, include: { client: true } });

export const createTask = (dto: CreateTaskDto) =>
  prisma.task.create({
    data: {
      clientId: dto.clientId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      budget: dto.budget,
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

export const updateTask = (taskId: number, dto: UpdateTaskDto) =>
  prisma.task.update({
    where: { taskId },
    data: {
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

export async function deleteTask(taskId: number): Promise<void> {
  await prisma.task.delete({ where: { taskId } });
}

// ---- Applications ---------------------------------------------------------

export const listApplications = () =>
  prisma.application.findMany({ include: { task: true, gigProfile: true } });

export const createApplication = (dto: CreateApplicationDto) =>
  prisma.application.create({
    data: {
      gigProfileId: dto.gigProfileId,
      taskId: dto.taskId,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

export const updateApplication = (applicationId: number, dto: UpdateApplicationDto) =>
  prisma.application.update({
    where: { applicationId },
    data: { ...(dto.status !== undefined ? { status: dto.status } : {}) },
  });

export async function deleteApplication(applicationId: number): Promise<void> {
  await prisma.application.delete({ where: { applicationId } });
}

// ---- Assignments --------------------------------------------------------

export const listAssignments = () =>
  prisma.gigManagerAssignment.findMany({ include: { task: true, gigProfile: true, manager: true } });

export const createAssignment = (dto: CreateAssignmentDto) =>
  prisma.gigManagerAssignment.create({
    data: { gigProfileId: dto.gigProfileId, taskId: dto.taskId, managerId: dto.managerId },
  });

export async function deleteAssignment(gigProfileId: number, taskId: number): Promise<void> {
  await prisma.gigManagerAssignment.delete({ where: { gigProfileId_taskId: { gigProfileId, taskId } } });
}

// ---- Deliverables -------------------------------------------------------

export const listDeliverables = () =>
  prisma.deliverable.findMany({ include: { task: true, gigProfile: true } });

export async function createDeliverable(dto: CreateDeliverableDto) {
  const last = await prisma.deliverable.findFirst({
    where: { taskId: dto.taskId },
    orderBy: { deliverableNo: "desc" },
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
}

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

export async function deleteDeliverable(taskId: number, deliverableNo: number): Promise<void> {
  await prisma.deliverable.delete({ where: { taskId_deliverableNo: { taskId, deliverableNo } } });
}

// ---- Payments -----------------------------------------------------------

export const listPayments = () => prisma.payment.findMany({ include: { task: true, gigProfile: true } });

export const createPayment = (dto: CreatePaymentDto) =>
  prisma.payment.create({
    data: {
      taskId: dto.taskId,
      gigProfileId: dto.gigProfileId,
      amount: dto.amount,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

export const updatePayment = (paymentId: number, dto: UpdatePaymentDto) =>
  prisma.payment.update({
    where: { paymentId },
    data: {
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

export async function deletePayment(paymentId: number): Promise<void> {
  await prisma.payment.delete({ where: { paymentId } });
}

// ---- Reviews ------------------------------------------------------------

export const listReviews = () =>
  prisma.review.findMany({ include: { reviewer: true, reviewee: true, task: true } });

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

export const updateReview = (reviewId: number, dto: UpdateReviewDto) =>
  prisma.review.update({
    where: { reviewId },
    data: {
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });

export async function deleteReview(reviewId: number): Promise<void> {
  await prisma.review.delete({ where: { reviewId } });
}

// ---- Dashboard stats ------------------------------------------------------
// Only figures the real schema supports. Escrow/disputes/moderation/audit-log
// from mock/adminMockData.ts have no backing tables — omitted rather than
// fabricated.

export async function getDashboardStats() {
  const [
    totalUsers,
    totalClients,
    totalGigPros,
    totalManagers,
    activeTasks,
    totalApplications,
    paymentAgg,
    ratingAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.gigProfessionalProfile.count(),
    prisma.manager.count(),
    prisma.task.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.application.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  return {
    totalUsers,
    totalClients,
    totalGigPros,
    totalManagers,
    activeTasks,
    totalApplications,
    grossMerchandiseVolume: Number(paymentAgg._sum.amount ?? 0),
    avgPlatformRating: ratingAgg._avg.rating ?? 0,
  };
}
