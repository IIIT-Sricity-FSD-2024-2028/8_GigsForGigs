import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { GigTokenPayload } from "../../lib/jwt.js";
import * as gigService from "./gig.service.js";
import type {
  CreateApplicationDto,
  CreateReviewDto,
  CreateServiceDto,
  RespondToRequestDto,
  SubmitDeliverableDto,
  UpdateGigProfileDto,
} from "./gig.dto.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma's
// generated relation types collapse to `any` here (see errorHandler.ts).
type Row = any;

// Response shapes below are Prisma's native field names/casing (camelCase,
// lowercase enums, numeric ids) — the only reshaping done is flattening
// join-table rows (skills/tools/tags/portfolio) to plain arrays and
// converting Decimal fields to numbers, both of which JSON.stringify can't
// do on its own (Decimal serializes to a string, not a number).

function toTaskResponse(task: Row) {
  return {
    taskId: task.taskId,
    clientId: task.clientId,
    title: task.title,
    description: task.description ?? "",
    budget: Number(task.budget),
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    ...(task.client
      ? {
          client: {
            clientId: task.client.clientId,
            clientName: task.client.clientName,
            domain: task.client.domain,
          },
        }
      : {}),
  };
}

function toApplicationResponse(application: Row) {
  return {
    applicationId: application.applicationId,
    taskId: application.taskId,
    gigProfileId: application.gigProfileId,
    status: application.status,
    createdAt: application.createdAt.toISOString(),
    ...(application.task ? { task: toTaskResponse(application.task) } : {}),
  };
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
  };
}

function toGigProfileResponse(profile: Row) {
  return {
    gigProfileId: profile.gigProfileId,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    bio: profile.bio ?? "",
    skills: (profile.skills ?? []).map((s: Row) => s.skill),
    tools: (profile.tools ?? []).map((t: Row) => t.tool),
    portfolio: (profile.portfolio ?? []).map((p: Row) => p.url),
  };
}

function toServiceResponse(service: Row) {
  return {
    serviceId: service.serviceId,
    gigProfileId: service.gigProfileId,
    title: service.title,
    description: service.description ?? "",
    price: Number(service.price),
    tags: (service.tags ?? []).map((t: Row) => t.tag),
    ...(service.thumbnail ? { thumbnail: service.thumbnail } : {}),
    createdAt: service.createdAt.toISOString(),
  };
}

function toPaymentResponse(payment: Row) {
  return {
    paymentId: payment.paymentId,
    taskId: payment.taskId,
    gigProfileId: payment.gigProfileId,
    amount: Number(payment.amount),
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    ...(payment.task
      ? {
          task: {
            taskId: payment.task.taskId,
            title: payment.task.title,
            ...(payment.task.client
              ? { client: { clientId: payment.task.client.clientId, clientName: payment.task.client.clientName } }
              : {}),
          },
        }
      : {}),
  };
}

function toReviewResponse(review: Row) {
  return {
    reviewId: review.reviewId,
    rating: review.rating,
    comment: review.comment ?? undefined,
    clientName: review.reviewer?.name,
    createdAt: review.createdAt.toISOString(),
  };
}

function toCompletedProjectResponse(task: Row) {
  return {
    ...toTaskResponse(task),
    completedAt: task.updatedAt.toISOString(),
    reviews: (task.reviews ?? []).map(toReviewResponse),
    ...(task.payments?.[0] ? { payment: toPaymentResponse(task.payments[0]) } : {}),
  };
}

function requireGigProfileId(req: Request): number {
  return (req.user as GigTokenPayload).gigProfileId;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await gigService.getProfile(requireGigProfileId(req));
  res.status(200).json(toGigProfileResponse(profile));
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<UpdateGigProfileDto>(res, "body");
  const profile = await gigService.updateProfile(gigProfileId, dto);
  res.status(200).json(toGigProfileResponse(profile));
}

export async function listMarketplaceTasks(req: Request, res: Response): Promise<void> {
  const tasks = await gigService.listMarketplaceTasks(requireGigProfileId(req));
  res.status(200).json(tasks.map(toTaskResponse));
}

export async function createApplication(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateApplicationDto>(res, "body");
  const application = await gigService.createApplication(gigProfileId, dto);
  res.status(201).json({ success: true, taskId: application.taskId });
}

export async function withdrawApplication(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const applicationId = Number(req.params.id);
  await gigService.withdrawApplication(applicationId, gigProfileId);
  res.status(204).send();
}

export async function listPendingRequests(req: Request, res: Response): Promise<void> {
  const requests = await gigService.listPendingRequests(requireGigProfileId(req));
  res.status(200).json(requests.map(toApplicationResponse));
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
  res.status(200).json(tasks.map(toTaskResponse));
}

export async function submitDeliverable(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<SubmitDeliverableDto>(res, "body");
  const deliverable = await gigService.submitDeliverable(gigProfileId, dto);
  res.status(201).json(toDeliverableResponse(deliverable));
}

export async function listMyServices(req: Request, res: Response): Promise<void> {
  const services = await gigService.listMyServices(requireGigProfileId(req));
  res.status(200).json(services.map(toServiceResponse));
}

export async function createService(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateServiceDto>(res, "body");
  const service = await gigService.createService(gigProfileId, dto);
  res.status(201).json(toServiceResponse(service));
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const gigProfileId = requireGigProfileId(req);
  const dto = getValidated<CreateReviewDto>(res, "body");
  await gigService.createReview(gigProfileId, dto);
  res.status(201).json({ success: true });
}

export async function listCompletedProjects(req: Request, res: Response): Promise<void> {
  const tasks = await gigService.listCompletedProjects(requireGigProfileId(req));
  res.status(200).json(tasks.map(toCompletedProjectResponse));
}

export async function getEarnings(req: Request, res: Response): Promise<void> {
  const { totalEarnings, completedTasks, payments } = await gigService.getEarnings(
    requireGigProfileId(req),
  );
  res.status(200).json({
    totalEarnings,
    completedTasks,
    payments: payments.map(toPaymentResponse),
  });
}
