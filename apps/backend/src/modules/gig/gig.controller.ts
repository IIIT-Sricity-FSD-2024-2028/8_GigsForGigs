import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { GigTokenPayload } from "../../lib/jwt.js";
import * as gigService from "./gig.service.js";
import {
  serializeCompletedProject,
  serializeDeliverable,
  serializeGigProfile,
  serializePayment,
  serializePendingRequest,
  serializeService,
  serializeTask,
} from "./gig.serializer.js";
import type {
  CreateApplicationDto,
  CreateReviewDto,
  CreateServiceDto,
  RespondToRequestDto,
  SubmitDeliverableDto,
  UpdateGigProfileDto,
} from "./gig.dto.js";

function requireGigProfileId(req: Request): number {
  return (req.user as GigTokenPayload).gigProfileId;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await gigService.getProfile(requireGigProfileId(req));
  res.status(200).json(serializeGigProfile(profile));
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<UpdateGigProfileDto>(res, "body");
  const profile = await gigService.updateProfile(gigProfileId, dto);
  res.status(200).json(serializeGigProfile(profile));
}

export async function listMarketplaceTasks(req: Request, res: Response): Promise<void> {
  const tasks = await gigService.listMarketplaceTasks(requireGigProfileId(req));
  res.status(200).json(tasks.map(serializeTask));
}

export async function createApplication(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateApplicationDto>(res, "body");
  const application = await gigService.createApplication(gigProfileId, dto);
  res.status(201).json({ success: true, taskId: String(application.taskId) });
}

export async function withdrawApplication(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const applicationId = Number(req.params.id);
  await gigService.withdrawApplication(applicationId, gigProfileId);
  res.status(204).send();
}

export async function listPendingRequests(req: Request, res: Response): Promise<void> {
  const requests = await gigService.listPendingRequests(requireGigProfileId(req));
  res.status(200).json(requests.map(serializePendingRequest));
}

export async function respondToRequest(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const applicationId = Number(req.params.id);
  const dto = getValidated<RespondToRequestDto>(res, "body");
  await gigService.respondToRequest(applicationId, gigProfileId, dto);
  res.status(200).json({ success: true });
}

export async function listActiveTasks(req: Request, res: Response): Promise<void> {
  const tasks = await gigService.listActiveTasks(requireGigProfileId(req));
  res.status(200).json(tasks.map(serializeTask));
}

export async function submitDeliverable(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<SubmitDeliverableDto>(res, "body");
  const deliverable = await gigService.submitDeliverable(gigProfileId, dto);
  res.status(201).json(serializeDeliverable(deliverable));
}

export async function listMyServices(req: Request, res: Response): Promise<void> {
  const services = await gigService.listMyServices(requireGigProfileId(req));
  res.status(200).json(services.map(serializeService));
}

export async function createService(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateServiceDto>(res, "body");
  const service = await gigService.createService(gigProfileId, dto);
  res.status(201).json(serializeService(service));
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateReviewDto>(res, "body");
  await gigService.createReview(gigProfileId, dto);
  res.status(201).json({ success: true });
}

export async function listCompletedProjects(req: Request, res: Response): Promise<void> {
  const tasks = await gigService.listCompletedProjects(requireGigProfileId(req));
  res.status(200).json(tasks.map(serializeCompletedProject));
}

export async function getEarnings(req: Request, res: Response): Promise<void> {
  const { totalEarnings, completedTasks, payments } = await gigService.getEarnings(
    requireGigProfileId(req),
  );
  res.status(200).json({
    totalEarnings,
    completedTasks,
    payments: payments.map(serializePayment),
  });
}
