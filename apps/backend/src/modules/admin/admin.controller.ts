import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { hasPermission } from "../../middleware/adminGuard.js";
import * as platformSettings from "./platformSettings.js";
import * as adminService from "./admin.service.js";
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
  UpdateApplicationDto,
  UpdateClientDto,
  UpdateDeliverableDto,
  UpdateGigProfileDto,
  KycDecisionDto,
  ModerateReviewDto,
  OverridePaymentDto,
  SettleDisputeDto,
  TwoFactorCodeDto,
  UpdateBadgeDto,
  UpdatePasswordDto,
  UpdatePlatformSettingsDto,
  UpdateUserStatusDto,
  UpdateReviewDto,
  UpdateTaskDto,
  UpdateUserDto,
} from "./admin.dto.js";

// ---- Users ----------------------------------------------------------------

export async function listUsers(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listUsers());
}
export async function getUser(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getUser(Number(req.params.userId)));
}
export async function createUser(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateUserDto>(res, "body");
  res.status(201).json(await adminService.createUser(dto));
}
export async function updateUser(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateUserDto>(res, "body");
  res.status(200).json(await adminService.updateUser(Number(req.params.userId), dto));
}
export async function deleteUser(req: Request, res: Response): Promise<void> {
  await adminService.deleteUser(Number(req.params.userId), req.user!.userId, hasPermission(req, "admins:invite"));
  res.status(204).send();
}

// ---- Clients --------------------------------------------------------------

export async function listClients(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listClients());
}
export async function getClient(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getClient(Number(req.params.clientId)));
}
export async function createClient(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateClientDto>(res, "body");
  res.status(201).json(await adminService.createClient(dto));
}
export async function updateClient(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateClientDto>(res, "body");
  res.status(200).json(await adminService.updateClient(Number(req.params.clientId), dto));
}
export async function deleteClient(req: Request, res: Response): Promise<void> {
  await adminService.deleteClient(Number(req.params.clientId));
  res.status(204).send();
}

// ---- Managers ---------------------------------------------------------

export async function listManagers(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listManagers());
}
export async function createManager(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateManagerDto>(res, "body");
  res.status(201).json(await adminService.createManager(dto));
}
export async function deleteManager(req: Request, res: Response): Promise<void> {
  await adminService.deleteManager(Number(req.params.clientId), Number(req.params.managerId));
  res.status(204).send();
}

// ---- Gig profiles -------------------------------------------------------

export async function listGigProfiles(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listGigProfiles());
}
export async function getGigProfile(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getGigProfile(Number(req.params.gigProfileId)));
}
export async function createGigProfile(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateGigProfileDto>(res, "body");
  res.status(201).json(await adminService.createGigProfile(dto));
}
export async function updateGigProfile(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateGigProfileDto>(res, "body");
  res
    .status(200)
    .json(await adminService.updateGigProfile(Number(req.params.gigProfileId), dto));
}
export async function deleteGigProfile(req: Request, res: Response): Promise<void> {
  await adminService.deleteGigProfile(Number(req.params.gigProfileId));
  res.status(204).send();
}

// ---- Tasks --------------------------------------------------------------

export async function listTasks(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listTasks());
}
export async function getTask(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getTask(Number(req.params.taskId)));
}
export async function createTask(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateTaskDto>(res, "body");
  res.status(201).json(await adminService.createTask(dto));
}
export async function updateTask(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateTaskDto>(res, "body");
  // Ids may arrive as "TSK-18" / "tsk-18"; the DB key is the numeric ID
  const taskId = Number(String(req.params.taskId).replace(/\D/g, ""));
  res.status(200).json(await adminService.updateTask(taskId, dto));
}
export async function deleteTask(req: Request, res: Response): Promise<void> {
  await adminService.deleteTask(Number(req.params.taskId));
  res.status(204).send();
}

// ---- Applications ---------------------------------------------------------

export async function listApplications(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listApplications());
}
export async function createApplication(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateApplicationDto>(res, "body");
  res.status(201).json(await adminService.createApplication(dto));
}
export async function updateApplication(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateApplicationDto>(res, "body");
  res
    .status(200)
    .json(await adminService.updateApplication(Number(req.params.applicationId), dto));
}
export async function deleteApplication(req: Request, res: Response): Promise<void> {
  await adminService.deleteApplication(Number(req.params.applicationId));
  res.status(204).send();
}

// ---- Assignments --------------------------------------------------------

export async function listAssignments(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listAssignments());
}
export async function createAssignment(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateAssignmentDto>(res, "body");
  res.status(201).json(await adminService.createAssignment(dto));
}
export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  await adminService.deleteAssignment(Number(req.params.gigProfileId), Number(req.params.taskId));
  res.status(204).send();
}

// ---- Deliverables -------------------------------------------------------

export async function listDeliverables(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listDeliverables());
}
export async function createDeliverable(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateDeliverableDto>(res, "body");
  res.status(201).json(await adminService.createDeliverable(dto));
}
export async function updateDeliverable(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateDeliverableDto>(res, "body");
  res
    .status(200)
    .json(
      await adminService.updateDeliverable(
        Number(req.params.taskId),
        Number(req.params.deliverableNo),
        dto,
      ),
    );
}
export async function deleteDeliverable(req: Request, res: Response): Promise<void> {
  await adminService.deleteDeliverable(Number(req.params.taskId), Number(req.params.deliverableNo));
  res.status(204).send();
}

// ---- Payments -----------------------------------------------------------

export async function listPayments(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listPayments());
}
export async function overridePayment(req: Request, res: Response): Promise<void> {
  const dto = getValidated<OverridePaymentDto>(res, "body");
  // Ids may arrive as "PAY-12" / "pay-12"; the DB key is the number.
  res.status(200).json(await adminService.overridePayment(Number(String(req.params.paymentId).replace(/\D/g, "")), dto));
}
// ---- Reviews ------------------------------------------------------------

export async function listReviews(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listReviews());
}
export async function createReview(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateReviewDto>(res, "body");
  res.status(201).json(await adminService.createReview(dto));
}
export async function updateReview(req: Request, res: Response): Promise<void> {
  const dto = getValidated<UpdateReviewDto>(res, "body");
  res.status(200).json(await adminService.updateReview(Number(req.params.reviewId), dto));
}
export async function deleteReview(req: Request, res: Response): Promise<void> {
  await adminService.deleteReview(Number(req.params.reviewId));
  res.status(204).send();
}

// ---- Dashboard ------------------------------------------------------------

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getDashboardStats());
}

// ---- Admin Staff & Invitations --------------------------------------------

export async function listAdminStaff(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listAdminStaff());
}

// ---- Disputes -------------------------------------------------------------

export async function listDisputes(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listDisputes());
}

export async function settleDispute(req: Request, res: Response): Promise<void> {
  const dto = getValidated<SettleDisputeDto>(res, "body");
  res.status(200).json(await adminService.settleDispute(String(req.params.disputeId), dto));
}

// ---- Audit Logs -----------------------------------------------------------

export async function listAuditLogs(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listAuditLogs());
}

// ---- Settings -------------------------------------------------------------

export async function getPlatformSettings(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await platformSettings.getPlatformSettings());
}

export async function updatePlatformSettings(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await platformSettings.updatePlatformSettings(getValidated<UpdatePlatformSettingsDto>(res, "body")));
}

// ---- Analytics ------------------------------------------------------------

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const timeRange = typeof req.query.timeRange === "string" ? req.query.timeRange.slice(0, 10) : "30d";
  res.status(200).json(await adminService.getAnalytics(timeRange));
}

// ---- Admin Invitations ---------------------------------------------------

export async function createAdminInvitation(req: Request, res: Response): Promise<void> {
  const dto = getValidated<CreateAdminInvitationDto>(res, "body");
  res.status(201).json(await adminService.createAdminInvitation(dto, req.account?.adminPermissions ?? []));
}

export async function acceptAdminInvitation(req: Request, res: Response): Promise<void> {
  const dto = getValidated<AcceptAdminInvitationDto>(res, "body");
  res.status(200).json(await adminService.acceptAdminInvitation(dto, req.ip ?? null));
}

// ---- Account Governance ----------------------------------------------------

export async function decideClientKyc(req: Request, res: Response): Promise<void> {
  const { status } = getValidated<KycDecisionDto>(res, "body");
  res.status(200).json(await adminService.decideClientKyc(String(req.params.clientId), status));
}

export async function updateGigProBadge(req: Request, res: Response): Promise<void> {
  const { badge } = getValidated<UpdateBadgeDto>(res, "body");
  res.status(200).json(await adminService.updateGigProBadge(String(req.params.gigProId), badge));
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const { status } = getValidated<UpdateUserStatusDto>(res, "body");
  res.status(200).json(await adminService.updateUserStatus(String(req.params.userId), status, req.user!.userId, hasPermission(req, "admins:invite")));
}

export async function revokeSessions(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.revokeSessions(String(req.params.staffId), req.user!.userId, hasPermission(req, "admins:invite")));
}

export async function moderateReview(req: Request, res: Response): Promise<void> {
  const dto = getValidated<ModerateReviewDto>(res, "body");
  res.status(200).json(await adminService.moderateReview(String(req.params.reviewId), dto));
}

// ---- Own Profile -----------------------------------------------------------

export async function getProfile(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.getProfile(req.user!.userId));
}

export async function updateProfilePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = getValidated<UpdatePasswordDto>(res, "body");
  res.status(200).json(await adminService.updateProfilePassword(req.user!.userId, currentPassword, newPassword));
}

export async function enrollTwoFactor(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.enrollTwoFactor(req.user!.userId));
}

export async function confirmTwoFactor(req: Request, res: Response): Promise<void> {
  const { code } = getValidated<TwoFactorCodeDto>(res, "body");
  res.status(200).json(await adminService.setTwoFactor(req.user!.userId, code, true));
}

export async function disableTwoFactor(req: Request, res: Response): Promise<void> {
  const { code } = getValidated<TwoFactorCodeDto>(res, "body");
  res.status(200).json(await adminService.setTwoFactor(req.user!.userId, code, false));
}
