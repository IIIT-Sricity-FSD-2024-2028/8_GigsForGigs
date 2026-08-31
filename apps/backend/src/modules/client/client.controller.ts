import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { forbidden } from "../../lib/httpError.js";
import type { ClientTokenPayload } from "../../lib/jwt.js";
import * as clientService from "./client.service.js";
import type {
  CreateManagerInviteDto,
  CreateTaskDto,
  ReviewDeliverableAsClientDto,
  UpdateApplicationDto,
  UpdateClientProfileDto,
  UpdateTaskDto,
} from "./client.dto.js";

/** Safe past roleGuard('client'), which every route in this module sits behind. */
function requireClientId(req: Request): number {
  return (req.user as ClientTokenPayload).clientId;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const client = await clientService.getProfile(clientId);
  res.status(200).json(client);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  if (req.params.clientId && Number(req.params.clientId) !== clientId) {
    throw forbidden("Cannot edit another client's profile");
  }
  const dto = getValidated<UpdateClientProfileDto>(res, "body");
  const client = await clientService.updateProfile(clientId, dto);
  res.status(200).json(client);
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const dto = getValidated<CreateTaskDto>(res, "body");
  const task = await clientService.createTask(clientId, dto);
  res.status(201).json(task);
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const tasks = await clientService.listTasks(requireClientId(req));
  res.status(200).json(tasks);
}

/** taskId ownership already verified by clientOwnershipGuard. */
export async function updateTask(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const dto = getValidated<UpdateTaskDto>(res, "body");
  const task = await clientService.updateTask(taskId, dto);
  res.status(200).json(task);
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  await clientService.deleteTask(taskId);
  res.status(204).send();
}

export async function listApplications(req: Request, res: Response): Promise<void> {
  const applications = await clientService.listApplications(requireClientId(req));
  res.status(200).json(applications);
}

export async function reviewApplication(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const applicationId = Number(req.params.applicationId);
  const dto = getValidated<UpdateApplicationDto>(res, "body");
  const application = await clientService.reviewApplication(applicationId, clientId, dto);
  res.status(200).json(application);
}

export async function listContracts(req: Request, res: Response): Promise<void> {
  const contracts = await clientService.listContracts(requireClientId(req));
  res.status(200).json(contracts);
}

/** taskId ownership already verified by clientOwnershipGuard. */
export async function listTaskDeliverables(req: Request, res: Response): Promise<void> {
  const taskId = Number(req.params.taskId);
  const deliverables = await clientService.listTaskDeliverables(taskId);
  res.status(200).json(deliverables);
}

export async function reviewDeliverable(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const dto = getValidated<ReviewDeliverableAsClientDto>(res, "body");
  const deliverable = await clientService.reviewDeliverable(
    String(req.params.deliverableId),
    clientId,
    dto,
  );
  res.status(200).json(deliverable);
}

export async function listServices(_req: Request, res: Response): Promise<void> {
  const services = await clientService.listServices();
  res.status(200).json(services);
}

export async function requestService(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const serviceId = Number(req.params.serviceId);
  const request = await clientService.requestService(serviceId, clientId);
  res.status(201).json(request);
}

export async function listServiceRequests(req: Request, res: Response): Promise<void> {
  const requests = await clientService.listServiceRequests(requireClientId(req));
  res.status(200).json(requests);
}

export async function createManagerInvite(req: Request, res: Response): Promise<void> {
  const clientId = requireClientId(req);
  const dto = getValidated<CreateManagerInviteDto>(res, "body");
  const invite = await clientService.createManagerInvite(clientId, dto);
  res.status(201).json(invite);
}

export async function listManagerInvites(req: Request, res: Response): Promise<void> {
  const invites = await clientService.listManagerInvites(requireClientId(req));
  res.status(200).json(invites);
}
