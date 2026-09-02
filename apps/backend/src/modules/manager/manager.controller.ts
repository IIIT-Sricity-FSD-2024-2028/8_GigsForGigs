import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { ClientTokenPayload, ManagerTokenPayload } from "../../lib/jwt.js";
import * as managerService from "./manager.service.js";
import type {
  CreateDeliverableDto,
  ReviewDeliverableDto,
  ShortlistApplicationDto,
  UpdateManagerDto,
  UpdateManagerProfileDto,
} from "./manager.dto.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma's
// generated relation types collapse to `any` here (see errorHandler.ts).
type Row = any;

/** Rounds completed/closed deliverables against the total, for the task progress bar. */
function computeProgress(deliverables: { status: string }[]): number {
  if (deliverables.length === 0) return 0;
  const doneCount = deliverables.filter(
    (d) => d.status === "approved" || d.status === "closed",
  ).length;
  return Math.round((doneCount / deliverables.length) * 100);
}

function toDeliverableResponse(deliverable: Row) {
  return {
    taskId: deliverable.taskId,
    deliverableNo: deliverable.deliverableNo,
    gigProfileId: deliverable.gigProfileId,
    description: deliverable.description,
    submissionPath: deliverable.submissionPath,
    status: deliverable.status,
    createdAt: deliverable.createdAt.toISOString(),
    ...(deliverable.gigProfile
      ? { gigProfile: { user: { name: deliverable.gigProfile.user.name } } }
      : {}),
  };
}

function toApplicationResponse(application: Row) {
  return {
    applicationId: application.applicationId,
    gigProfileId: application.gigProfileId,
    taskId: application.taskId,
    status: application.status,
    rating: application.rating,
    hourlyRate: application.hourlyRate !== null ? Number(application.hourlyRate) : null,
    createdAt: application.createdAt.toISOString(),
    ...(application.gigProfile
      ? { gigProfile: { user: { name: application.gigProfile.user.name } } }
      : {}),
  };
}

function toTaskResponse(task: Row) {
  const deliverables = task.deliverables ?? [];
  return {
    taskId: task.taskId,
    clientId: task.clientId,
    title: task.title,
    description: task.description,
    budget: Number(task.budget),
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    status: task.status,
    progress: computeProgress(deliverables),
    ...(task.client
      ? {
          client: {
            clientId: task.client.clientId,
            clientName: task.client.clientName,
            domain: task.client.domain,
          },
        }
      : {}),
    assignments: (task.assignments ?? []).map((assignment: Row) => ({
      gigProfileId: assignment.gigProfileId,
      taskId: assignment.taskId,
      managerId: assignment.managerId,
      assignedAt: assignment.assignedAt.toISOString(),
      ...(assignment.gigProfile
        ? {
            gigProfile: {
              gigProfileId: assignment.gigProfile.gigProfileId,
              userId: assignment.gigProfile.userId,
              bio: assignment.gigProfile.bio,
              user: {
                userId: assignment.gigProfile.user.userId,
                name: assignment.gigProfile.user.name,
                email: assignment.gigProfile.user.email,
              },
              skills: (assignment.gigProfile.skills ?? []).map((s: Row) => s.skill),
            },
          }
        : {}),
    })),
    deliverables: deliverables.map(toDeliverableResponse),
  };
}

function toManagerProfileResponse(manager: Row) {
  return {
    managerId: manager.managerId,
    userId: manager.userId,
    clientId: manager.clientId,
    user: {
      userId: manager.user.userId,
      name: manager.user.name,
      email: manager.user.email,
      role: manager.user.role,
    },
    ...(manager.client
      ? {
          client: {
            clientId: manager.client.clientId,
            clientName: manager.client.clientName,
            domain: manager.client.domain,
          },
        }
      : {}),
  };
}

/**
 * TalentProfile.status ('active'|'busy'|'offline') has no backing column —
 * there is no availability concept in the schema. Hardcoded 'active' until
 * that's modeled; documented as a known gap, not silently invented data.
 */
export function toTalentResponse(profile: Row) {
  const firstServicePrice = profile.services?.[0]?.price;
  return {
    gigProfileId: profile.gigProfileId,
    userId: profile.userId,
    name: profile.user.name,
    bio: profile.bio,
    ...(firstServicePrice !== undefined ? { price: Number(firstServicePrice) } : {}),
    skills: (profile.skills ?? []).map((s: Row) => s.skill),
    tools: (profile.tools ?? []).map((t: Row) => t.tool),
    portfolio: (profile.portfolio ?? []).map((p: Row) => p.url),
    status: "active" as const,
  };
}

function requireManager(req: Request): ManagerTokenPayload {
  return req.user as ManagerTokenPayload;
}

// ---- Client-facing manager roster (client token) --------------------

export async function listManagers(req: Request, res: Response): Promise<void> {
  const { clientId } = req.user as ClientTokenPayload;
  const managers = await managerService.listManagersForClient(clientId);
  res.status(200).json(managers);
}

export async function deleteManager(req: Request, res: Response): Promise<void> {
  const { clientId } = req.user as ClientTokenPayload;
  const managerId = Number(req.params.managerId);
  await managerService.deleteManager(managerId, clientId);
  res.status(204).send();
}

export async function updateManager(req: Request, res: Response): Promise<void> {
  const { clientId } = req.user as ClientTokenPayload;
  const managerId = Number(req.params.managerId);
  const dto = getValidated<UpdateManagerDto>(res, "body");
  const user = await managerService.updateManager(managerId, clientId, dto);
  res.status(200).json(user);
}

// ---- Manager self-service (manager token) ----------------------------

export async function getOwnProfile(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const manager = await managerService.getOwnProfile(managerId);
  res.status(200).json(toManagerProfileResponse(manager));
}

export async function updateOwnProfile(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const dto = getValidated<UpdateManagerProfileDto>(res, "body");
  const manager = await managerService.updateOwnProfile(managerId, dto);
  res.status(200).json(toManagerProfileResponse(manager));
}

export async function listAssignedTasks(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const tasks = await managerService.listAssignedTasks(managerId);
  res.status(200).json(tasks.map(toTaskResponse));
}

/** taskId access already verified by taskAccessGuard. */
export async function getAssignedTask(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const task = await managerService.getAssignedTask(taskId);
  res.status(200).json(toTaskResponse(task));
}

export async function listTaskApplications(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const applications = await managerService.listTaskApplications(taskId);
  res.status(200).json(applications.map(toApplicationResponse));
}

export async function shortlistApplication(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const applicationId = Number(req.params.applicationId);
  const dto = getValidated<ShortlistApplicationDto>(res, "body");
  const application = await managerService.shortlistApplication(taskId, applicationId, dto);
  res.status(200).json(toApplicationResponse(application));
}

export async function listTaskDeliverables(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverables = await managerService.listTaskDeliverables(taskId);
  res.status(200).json(deliverables.map(toDeliverableResponse));
}

export async function createDeliverable(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const taskId = Number(req.params.taskId);
  const dto = getValidated<CreateDeliverableDto>(res, "body");
  const deliverable = await managerService.createDeliverable(taskId, managerId, dto);
  res.status(201).json(toDeliverableResponse(deliverable));
}

export async function getDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const deliverable = await managerService.getDeliverable(taskId, deliverableNo);
  res.status(200).json(toDeliverableResponse(deliverable));
}

export async function reviewDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const dto = getValidated<ReviewDeliverableDto>(res, "body");
  const deliverable = await managerService.reviewDeliverable(taskId, deliverableNo, dto);
  res.status(200).json(toDeliverableResponse(deliverable));
}

export async function closeDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const deliverable = await managerService.closeDeliverable(taskId, deliverableNo);
  res.status(200).json(toDeliverableResponse(deliverable));
}

export async function searchGigProfessionals(req: Request, res: Response): Promise<void> {
  const { clientId } = requireManager(req);
  const query = typeof req.query.q === "string" ? req.query.q : undefined;
  const profiles = await managerService.searchGigProfessionals(query, clientId);
  res.status(200).json(profiles.map(toTalentResponse));
}
