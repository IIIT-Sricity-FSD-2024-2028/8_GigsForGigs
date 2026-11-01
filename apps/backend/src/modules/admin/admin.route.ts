import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import { act, audited, can } from "../../middleware/adminGuard.js";
import {
  acceptAdminInvitationSchema,
  createAdminInvitationSchema,
  createApplicationSchema,
  createAssignmentSchema,
  createClientSchema,
  createDeliverableSchema,
  createGigProfileSchema,
  createManagerSchema,
  createReviewSchema,
  createTaskSchema,
  createUserSchema,
  kycDecisionSchema,
  moderateReviewSchema,
  overridePaymentSchema,
  settleDisputeSchema,
  twoFactorCodeSchema,
  updateApplicationSchema,
  updateBadgeSchema,
  updateClientSchema,
  updateDeliverableSchema,
  updateGigProfileSchema,
  updatePasswordSchema,
  updatePlatformSettingsSchema,
  updateReviewSchema,
  updateTaskSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./admin.dto.js";
import * as adminController from "./admin.controller.js";

/**
 * Super Admin API. Three layers apply in order:
 *   1. authGuard + roleGuard("admin"): a live, non-suspended admin session.
 *   2. can(permission): the RBAC check, read fresh from the DB on every request.
 *   3. audited(action): one append-only AUDIT_LOG row per successful mutation.
 * act(permission, action) is (2) + (3) and guards every write below.
 * Reads with no can() (dashboard, disputes, reviews, audit log, settings) are
 * open to every admin tier, because even a read-only auditor needs them.
 */
export const adminRouter = Router();

// Public: an invitee has no session yet. Proof is the signed token plus the one-time password.
adminRouter.post("/invitations/accept", validate(acceptAdminInvitationSchema), adminController.acceptAdminInvitation);

adminRouter.use(authGuard, roleGuard("admin"));

// Dashboard & analytics.
adminRouter.get("/kpis", adminController.getDashboardStats);
adminRouter.get("/analytics", adminController.getAnalytics);

// Users. Admin accounts are refused by updateUser, and removing one needs admins:invite too.
adminRouter.get("/users", can("users:read"), adminController.listUsers);
adminRouter.get("/users/:userId", can("users:read"), adminController.getUser);
adminRouter.post("/users", act("users:ban", "USER_CREATE"), validate(createUserSchema), adminController.createUser);
adminRouter.patch("/users/:userId", act("users:ban", "USER_UPDATE"), validate(updateUserSchema), adminController.updateUser);
adminRouter.delete("/users/:userId", act("users:ban", "USER_DELETE"), adminController.deleteUser);
adminRouter.patch("/users/:userId/status", act("users:ban", "USER_STATUS_CHANGE"), validate(updateUserStatusSchema), adminController.updateUserStatus);

// Clients.
adminRouter.get("/clients", can("users:read"), adminController.listClients);
adminRouter.get("/clients/:clientId", can("users:read"), adminController.getClient);
adminRouter.post("/clients", act("users:ban", "CLIENT_CREATE"), validate(createClientSchema), adminController.createClient);
adminRouter.patch("/clients/:clientId", act("users:ban", "CLIENT_UPDATE"), validate(updateClientSchema), adminController.updateClient);
adminRouter.delete("/clients/:clientId", act("users:ban", "CLIENT_DELETE"), adminController.deleteClient);
adminRouter.patch("/clients/:clientId/kyc", act("users:ban", "KYC_DECISION"), validate(kycDecisionSchema), adminController.decideClientKyc);

// Managers.
adminRouter.get("/managers", can("users:read"), adminController.listManagers);
adminRouter.post("/managers", act("users:ban", "MANAGER_CREATE"), validate(createManagerSchema), adminController.createManager);
adminRouter.delete("/managers/:clientId/:managerId", act("users:ban", "MANAGER_DELETE"), adminController.deleteManager);

// Gig professionals.
adminRouter.get("/gig-pros", can("users:read"), adminController.listGigProfiles);
adminRouter.get("/gig-profiles/:gigProfileId", can("users:read"), adminController.getGigProfile);
adminRouter.post("/gig-profiles", act("users:ban", "GIG_PROFILE_CREATE"), validate(createGigProfileSchema), adminController.createGigProfile);
adminRouter.patch("/gig-profiles/:gigProfileId", act("users:ban", "GIG_PROFILE_UPDATE"), validate(updateGigProfileSchema), adminController.updateGigProfile);
adminRouter.delete("/gig-profiles/:gigProfileId", act("users:ban", "GIG_PROFILE_DELETE"), adminController.deleteGigProfile);
adminRouter.patch("/gig-pros/:gigProId/badge", act("users:ban", "BADGE_UPDATE"), validate(updateBadgeSchema), adminController.updateGigProBadge);

// Tasks. Delivery pipeline changes sit with whoever arbitrates delivery.
adminRouter.get("/projects", adminController.listTasks);
adminRouter.get("/tasks/:taskId", adminController.getTask);
adminRouter.post("/tasks", act("disputes:resolve", "TASK_CREATE"), validate(createTaskSchema), adminController.createTask);
adminRouter.patch("/tasks/:taskId", act("disputes:resolve", "TASK_UPDATE"), validate(updateTaskSchema), adminController.updateTask);
adminRouter.delete("/tasks/:taskId", act("disputes:resolve", "TASK_DELETE"), adminController.deleteTask);

// Applications.
adminRouter.get("/applications", adminController.listApplications);
adminRouter.post("/applications", act("disputes:resolve", "APPLICATION_CREATE"), validate(createApplicationSchema), adminController.createApplication);
adminRouter.patch("/applications/:applicationId", act("disputes:resolve", "APPLICATION_UPDATE"), validate(updateApplicationSchema), adminController.updateApplication);
adminRouter.delete("/applications/:applicationId", act("disputes:resolve", "APPLICATION_DELETE"), adminController.deleteApplication);

// Assignments.
adminRouter.get("/assignments", adminController.listAssignments);
adminRouter.post("/assignments", act("disputes:resolve", "ASSIGNMENT_CREATE"), validate(createAssignmentSchema), adminController.createAssignment);
adminRouter.delete("/assignments/:gigProfileId/:taskId", act("disputes:resolve", "ASSIGNMENT_DELETE"), adminController.deleteAssignment);

// Deliverables.
adminRouter.get("/deliverables", adminController.listDeliverables);
adminRouter.post("/deliverables", act("disputes:resolve", "DELIVERABLE_CREATE"), validate(createDeliverableSchema), adminController.createDeliverable);
adminRouter.patch("/deliverables/:taskId/:deliverableNo", act("disputes:resolve", "DELIVERABLE_UPDATE"), validate(updateDeliverableSchema), adminController.updateDeliverable);
adminRouter.delete("/deliverables/:taskId/:deliverableNo", act("disputes:resolve", "DELIVERABLE_DELETE"), adminController.deleteDeliverable);

// Payments: read plus escrow override only. No raw create/update/delete, so the ledger can't be edited.
// Release and refund are separate grants, so the required permission depends on the request.
adminRouter.get("/payments", can("payments:read"), adminController.listPayments);
adminRouter.patch(
  "/payments/:paymentId/override",
  act((req) => (req.body?.action === "REFUND" ? "payments:refund" : "payments:release"), "ESCROW_OVERRIDE"),
  validate(overridePaymentSchema),
  adminController.overridePayment,
);

// Reviews.
adminRouter.get("/reviews", adminController.listReviews);
adminRouter.post("/reviews", act("reviews:moderate", "REVIEW_CREATE"), validate(createReviewSchema), adminController.createReview);
adminRouter.patch("/reviews/:reviewId", act("reviews:moderate", "REVIEW_UPDATE"), validate(updateReviewSchema), adminController.updateReview);
adminRouter.delete("/reviews/:reviewId", act("reviews:moderate", "REVIEW_DELETE"), adminController.deleteReview);
adminRouter.patch("/reviews/:reviewId/moderate", act("reviews:moderate", "REVIEW_MODERATE"), validate(moderateReviewSchema), adminController.moderateReview);

// Disputes.
adminRouter.get("/disputes", adminController.listDisputes);
adminRouter.post("/disputes/:disputeId/settle", act("disputes:resolve", "DISPUTE_SETTLE"), validate(settleDisputeSchema), adminController.settleDispute);

// Admin staff, invitations and the audit trail.
adminRouter.get("/admin-staff", adminController.listAdminStaff);
adminRouter.get("/audit-logs", adminController.listAuditLogs);
adminRouter.post("/invitations", act("admins:invite", "ADMIN_INVITE"), validate(createAdminInvitationSchema), adminController.createAdminInvitation);
// Self-service is allowed for any admin; revoking someone else is checked in the service.
adminRouter.post("/sessions/:staffId/revoke", audited("SESSIONS_REVOKE"), adminController.revokeSessions);

// Platform settings.
adminRouter.get("/settings", adminController.getPlatformSettings);
adminRouter.put("/settings", act("settings:manage", "SETTINGS_UPDATE"), validate(updatePlatformSettingsSchema), adminController.updatePlatformSettings);

// Own profile. Always acts on the session's user, never on an id or email from the request.
adminRouter.get("/profile", adminController.getProfile);
adminRouter.post("/profile/password", audited("PASSWORD_CHANGE"), validate(updatePasswordSchema), adminController.updateProfilePassword);
adminRouter.post("/profile/2fa/enroll", adminController.enrollTwoFactor);
adminRouter.post("/profile/2fa/confirm", audited("TWO_FACTOR_ENABLE"), validate(twoFactorCodeSchema), adminController.confirmTwoFactor);
adminRouter.post("/profile/2fa/disable", audited("TWO_FACTOR_DISABLE"), validate(twoFactorCodeSchema), adminController.disableTwoFactor);
