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

// List a client's own tasks with their applications and deliverables.
export function listTasks(clientId: number) {
  return prisma.task.findMany({
    where: { clientId },
    include: { applications: true, deliverables: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Patch a task's fields. taskId ownership is pre-verified by clientOwnershipGuard. */
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

// Delete a task. taskId ownership is pre-verified by clientOwnershipGuard.
export async function deleteTask(taskId: number): Promise<void> {
  await prisma.task.delete({ where: { taskId } });
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
 * Accept/decline an application. Accepting flips the task to "in_progress"
 * and, if no GigManagerAssignment exists yet, assigns it to one of the
 * client's managers (falling back to any manager if the client has none)
 * so the task shows up in a manager's queue.
 */
export async function reviewApplication(
  applicationId: number,
  clientId: number,
  dto: UpdateApplicationDto,
) {
  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: { task: { include: { client: { include: { managers: true } } } } },
  });

  if (!application || application.task.clientId !== clientId) {
    throw notFound("Application not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    const updated = await tx.application.update({
      where: { applicationId },
      data: { status: dto.status },
    });

    if (dto.status === "accepted") {
      await tx.task.update({
        where: { taskId: application.taskId },
        data: { status: "in_progress" },
      });

      const clientManagers = application.task.client.managers;
      const anyManager = clientManagers.length > 0 ? clientManagers[0] : await tx.manager.findFirst();
      if (anyManager) {
        const existingAssignment = await tx.gigManagerAssignment.findUnique({
          where: {
            gigProfileId_taskId: {
              gigProfileId: application.gigProfileId,
              taskId: application.taskId,
            },
          },
        });
        if (!existingAssignment) {
          await tx.gigManagerAssignment.create({
            data: {
              gigProfileId: application.gigProfileId,
              taskId: application.taskId,
              managerId: anyManager.managerId,
            },
          });
        }
      }
    }

    return updated;
  });
}

// ---- Contracts (derived — no CONTRACT table) -------------------------------

// Derive "contracts" (accepted applications) with computed deliverable progress — no dedicated CONTRACT table.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return applications.map((application: any) => {
    const assignment = application.gigProfile.assignments?.find(
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
      gigProfileId: application.gigProfileId,
      gigProfessionalName: application.gigProfile.user.name,
      status: application.task.status,
      progress,
      budget: application.task.budget,
      createdAt: application.createdAt,
    };
  });
}

// ---- Deliverables (client-side review) -------------------------------------

// List deliverables submitted for one of the client's tasks.
export function listTaskDeliverables(taskId: number) {
  return prisma.deliverable.findMany({
    where: { taskId },
    include: { gigProfile: { include: { user: true } } },
    orderBy: { deliverableNo: "asc" },
  });
}

// Approve a deliverable or request revisions, as the owning client. rawDeliverableId is "<taskId>-<deliverableNo>".
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

// Browse every active service listing offered by gig professionals.
export function listServices() {
  return prisma.service.findMany({
    where: { status: "active" },
    include: { tags: true, profile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Hire a service: creates a Task mirroring the service, a pending
 * Application for the gig professional who owns it, and a ServiceRequest
 * record (upserted so re-requesting the same service is a no-op there).
 */
export async function requestService(serviceId: number, clientId: number) {
  const service = await prisma.service.findUnique({
    where: { serviceId },
    include: { profile: { include: { user: true } } },
  });
  if (!service) {
    throw notFound("Service not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    // 1. Create a Task for this requested service
    const task = await tx.task.create({
      data: {
        clientId,
        title: service.title,
        description: service.description || `Service hire request for ${service.title}`,
        budget: service.price,
        status: "open",
        category: "Software Development",
        skills: ["Service Hire"],
      },
    });

    // 2. Create Application with status 'pending'
    const application = await tx.application.create({
      data: {
        gigProfileId: service.gigProfileId,
        taskId: task.taskId,
        status: "pending",
      },
    });

    // 3. Upsert ServiceRequest
    const existing = await tx.serviceRequest.findUnique({
      where: { serviceId_clientId: { serviceId, clientId } },
    });
    if (!existing) {
      await tx.serviceRequest.create({
        data: { serviceId, clientId, status: "pending" },
      });
    }

    return { task, application };
  });
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

// Create a pending invite for a new manager to join the client's account.
export function createManagerInvite(clientId: number, dto: CreateManagerInviteDto) {
  return prisma.managerInvite.create({
    data: { clientId, name: dto.name, email: dto.email },
  });
}

// List manager invites sent by the client.
export function listManagerInvites(clientId: number) {
  return prisma.managerInvite.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}
