import { prisma } from "db";
import { badRequest, conflict, notFound } from "../../lib/httpError.js";
import { parseDeliverableKey } from "./client.dto.js";
import type {
  CreateManagerInviteDto,
  CreateTaskDto,
  ReviewDeliverableAsClientDto,
  UpdateApplicationDto,
  UpdateClientProfileDto,
  UpdateTaskDto,
} from "./client.dto.js";

// ---- Profile ----------------------------------------------------------

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

export function createTask(clientId: number, dto: CreateTaskDto) {
  return prisma.task.create({
    data: {
      clientId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      budget: dto.budget,
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
    },
  });
}

export function listTasks(clientId: number) {
  return prisma.task.findMany({
    where: { clientId },
    include: { applications: true, deliverables: true },
    orderBy: { createdAt: "desc" },
  });
}

/** taskId ownership is pre-verified by clientOwnershipGuard. */
export function updateTask(taskId: number, dto: UpdateTaskDto) {
  return prisma.task.update({
    where: { taskId },
    data: {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });
}

export async function deleteTask(taskId: number): Promise<void> {
  await prisma.task.delete({ where: { taskId } });
}

// ---- Applications ---------------------------------------------------------

export function listApplications(clientId: number) {
  return prisma.application.findMany({
    where: { task: { clientId } },
    include: { task: true, gigProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

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

  return prisma.application.update({
    where: { applicationId },
    data: { status: dto.status },
  });
}

// ---- Contracts (derived — no CONTRACT table) -------------------------------

export async function listContracts(clientId: number) {
  const applications = await prisma.application.findMany({
    where: { status: "accepted", task: { clientId } },
    include: {
      task: true,
      gigProfile: {
        include: {
          user: true,
          assignments: { include: { deliverables: true } },
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma's
  // generated client types collapse to `any` under this toolchain (see
  // errorHandler.ts); the shape below matches the `include` above exactly.
  return applications.map((application: any) => {
    const assignment = application.gigProfile.assignments.find(
      (a: any) => a.taskId === application.taskId,
    );
    const deliverables = assignment?.deliverables ?? [];
    const doneCount = deliverables.filter(
      (d: any) => d.status === "approved" || d.status === "closed",
    ).length;
    const progress =
      deliverables.length > 0 ? Math.round((doneCount / deliverables.length) * 100) : 0;

    return {
      taskId: application.taskId,
      taskTitle: application.task.title,
      gigProfessionalName: application.gigProfile.user.name,
      status: application.task.status,
      progress,
      budget: application.task.budget,
      createdAt: application.createdAt,
    };
  });
}

// ---- Deliverables (client-side review) -------------------------------------

export function listTaskDeliverables(taskId: number) {
  return prisma.deliverable.findMany({
    where: { taskId },
    include: { gigProfile: { include: { user: true } } },
    orderBy: { deliverableNo: "asc" },
  });
}

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
    include: { task: true },
  });

  if (!deliverable || deliverable.task.clientId !== clientId) {
    throw notFound("Deliverable not found");
  }

  return prisma.deliverable.update({
    where: { taskId_deliverableNo: key },
    data: {
      status: dto.status,
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    },
  });
}

// ---- Services (browse + request) -------------------------------------------

export function listServices() {
  return prisma.service.findMany({
    where: { status: "active" },
    include: { tags: true, profile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestService(serviceId: number, clientId: number) {
  const service = await prisma.service.findUnique({ where: { serviceId } });
  if (!service) {
    throw notFound("Service not found");
  }

  const existing = await prisma.serviceRequest.findUnique({
    where: { serviceId_clientId: { serviceId, clientId } },
  });
  if (existing) {
    throw conflict("Service already requested");
  }

  return prisma.serviceRequest.create({ data: { serviceId, clientId } });
}

export function listServiceRequests(clientId: number) {
  return prisma.serviceRequest.findMany({
    where: { clientId },
    include: { service: { include: { profile: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---- Manager invites ---------------------------------------------------

export function createManagerInvite(clientId: number, dto: CreateManagerInviteDto) {
  return prisma.managerInvite.create({
    data: { clientId, name: dto.name, email: dto.email },
  });
}

export function listManagerInvites(clientId: number) {
  return prisma.managerInvite.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}
