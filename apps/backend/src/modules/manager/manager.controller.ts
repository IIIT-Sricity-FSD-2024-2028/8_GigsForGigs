import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { ClientTokenPayload, ManagerTokenPayload } from "../../lib/jwt.js";
import * as managerService from "./manager.service.js";
import {
  serializeApplication,
  serializeDeliverable,
  serializeManagerProfile,
  serializeTalent,
  serializeTask,
} from "./manager.serializer.js";
import type {
  CreateDeliverableDto,
  ReviewDeliverableDto,
  ShortlistApplicationDto,
  UpdateManagerDto,
  UpdateManagerProfileDto,
} from "./manager.dto.js";

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
  res.status(200).json(serializeManagerProfile(manager));
}

export async function updateOwnProfile(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const dto = getValidated<UpdateManagerProfileDto>(res, "body");
  const manager = await managerService.updateOwnProfile(managerId, dto);
  res.status(200).json(serializeManagerProfile(manager));
}

export async function listAssignedTasks(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const tasks = await managerService.listAssignedTasks(managerId);
  res.status(200).json(tasks.map(serializeTask));
}

/** taskId access already verified by taskAccessGuard. */
export async function getAssignedTask(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const task = await managerService.getAssignedTask(taskId);
  res.status(200).json(serializeTask(task));
}

export async function listTaskApplications(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const applications = await managerService.listTaskApplications(taskId);
  res.status(200).json(applications.map(serializeApplication));
}

export async function shortlistApplication(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const applicationId = Number(req.params.applicationId);
  const dto = getValidated<ShortlistApplicationDto>(res, "body");
  const application = await managerService.shortlistApplication(taskId, applicationId, dto);
  res.status(200).json(serializeApplication(application));
}

export async function listTaskDeliverables(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverables = await managerService.listTaskDeliverables(taskId);
  res.status(200).json(deliverables.map(serializeDeliverable));
}

export async function createDeliverable(req: Request, res: Response): Promise<void> {
  const { managerId } = requireManager(req);
  const taskId = Number(req.params.taskId);
  const dto = getValidated<CreateDeliverableDto>(res, "body");
  const deliverable = await managerService.createDeliverable(taskId, managerId, dto);
  res.status(201).json(serializeDeliverable(deliverable));
}

export async function getDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const deliverable = await managerService.getDeliverable(taskId, deliverableNo);
  res.status(200).json(serializeDeliverable(deliverable));
}

export async function reviewDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const dto = getValidated<ReviewDeliverableDto>(res, "body");
  const deliverable = await managerService.reviewDeliverable(taskId, deliverableNo, dto);
  res.status(200).json(serializeDeliverable(deliverable));
}

export async function closeDeliverable(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverableNo = Number(req.params.deliverableNo);
  const deliverable = await managerService.closeDeliverable(taskId, deliverableNo);
  res.status(200).json(serializeDeliverable(deliverable));
}

export async function searchGigProfessionals(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q : undefined;
  const profiles = await managerService.searchGigProfessionals(query);
  res.status(200).json(profiles.map(serializeTalent));
}
