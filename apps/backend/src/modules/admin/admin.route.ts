import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createApplicationSchema,
  createAssignmentSchema,
  createClientSchema,
  createDeliverableSchema,
  createGigProfileSchema,
  createManagerSchema,
  createPaymentSchema,
  createReviewSchema,
  createTaskSchema,
  createUserSchema,
  updateApplicationSchema,
  updateClientSchema,
  updateDeliverableSchema,
  updateGigProfileSchema,
  updatePaymentSchema,
  updateReviewSchema,
  updateTaskSchema,
  updateUserSchema,
} from "./admin.dto.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

// Public invitation acceptance route (exchanges one-time cryptographic invite token for session)
adminRouter.post("/invitations/accept", adminController.acceptAdminInvitation);

// Every route below requires valid Super Admin authentication
adminRouter.use(authGuard, roleGuard("admin"));

// Platform-wide KPI/dashboard summary numbers.
adminRouter.get("/dashboard/stats", adminController.getDashboardStats);
adminRouter.get("/kpis", adminController.getDashboardStats);

// Users: list/get/create/update/delete any USER row directly.
adminRouter.get("/users", adminController.listUsers);
adminRouter.get("/users/:userId", adminController.getUser);
adminRouter.post("/users", validate(createUserSchema), adminController.createUser);
adminRouter.patch("/users/:userId", validate(updateUserSchema), adminController.updateUser);
adminRouter.delete("/users/:userId", adminController.deleteUser);

// Clients: list/get/create/update/delete.
adminRouter.get("/clients", adminController.listClients);
adminRouter.get("/clients/:clientId", adminController.getClient);
adminRouter.post("/clients", validate(createClientSchema), adminController.createClient);
adminRouter.patch(
  "/clients/:clientId",
  validate(updateClientSchema),
  adminController.updateClient,
);
adminRouter.delete("/clients/:clientId", adminController.deleteClient);

// Managers: list/create/delete (no direct update route — see updateManager on manager.route.ts instead).
adminRouter.get("/managers", adminController.listManagers);
adminRouter.post("/managers", validate(createManagerSchema), adminController.createManager);
adminRouter.delete("/managers/:clientId/:managerId", adminController.deleteManager);

// Gig professional profiles: list/get/create/update/delete.
adminRouter.get("/gig-profiles", adminController.listGigProfiles);
adminRouter.get("/gig-pros", adminController.listGigProfiles);
adminRouter.get("/gig-profiles/:gigProfileId", adminController.getGigProfile);
adminRouter.post(
  "/gig-profiles",
  validate(createGigProfileSchema),
  adminController.createGigProfile,
);
adminRouter.patch(
  "/gig-profiles/:gigProfileId",
  validate(updateGigProfileSchema),
  adminController.updateGigProfile,
);
adminRouter.delete("/gig-profiles/:gigProfileId", adminController.deleteGigProfile);

// Tasks/projects: list/get/create/update/delete, plus a status-only PATCH alias.
adminRouter.get("/tasks", adminController.listTasks);
adminRouter.get("/projects", adminController.listTasks);
adminRouter.get("/tasks/:taskId", adminController.getTask);
adminRouter.post("/tasks", validate(createTaskSchema), adminController.createTask);
adminRouter.patch("/tasks/:taskId", validate(updateTaskSchema), adminController.updateTask);
adminRouter.patch("/projects/:taskId/status", validate(updateTaskSchema), adminController.updateTask);
adminRouter.delete("/tasks/:taskId", adminController.deleteTask);

// Applications: list/create/update (status)/delete.
adminRouter.get("/applications", adminController.listApplications);
adminRouter.post(
  "/applications",
  validate(createApplicationSchema),
  adminController.createApplication,
);
adminRouter.patch(
  "/applications/:applicationId",
  validate(updateApplicationSchema),
  adminController.updateApplication,
);
adminRouter.delete("/applications/:applicationId", adminController.deleteApplication);

// Gig-manager assignments: list/create/delete.
adminRouter.get("/assignments", adminController.listAssignments);
adminRouter.post(
  "/assignments",
  validate(createAssignmentSchema),
  adminController.createAssignment,
);
adminRouter.delete("/assignments/:gigProfileId/:taskId", adminController.deleteAssignment);

// Deliverables: list/create/update/delete.
adminRouter.get("/deliverables", adminController.listDeliverables);
adminRouter.post(
  "/deliverables",
  validate(createDeliverableSchema),
  adminController.createDeliverable,
);
adminRouter.patch(
  "/deliverables/:taskId/:deliverableNo",
  validate(updateDeliverableSchema),
  adminController.updateDeliverable,
);
adminRouter.delete("/deliverables/:taskId/:deliverableNo", adminController.deleteDeliverable);

// Payments: list/create/update/delete.
adminRouter.get("/payments", adminController.listPayments);
adminRouter.post("/payments", validate(createPaymentSchema), adminController.createPayment);
adminRouter.patch(
  "/payments/:paymentId",
  validate(updatePaymentSchema),
  adminController.updatePayment,
);
adminRouter.delete("/payments/:paymentId", adminController.deletePayment);

// Reviews: list/create/update/delete.
adminRouter.get("/reviews", adminController.listReviews);
adminRouter.post("/reviews", validate(createReviewSchema), adminController.createReview);
adminRouter.patch(
  "/reviews/:reviewId",
  validate(updateReviewSchema),
  adminController.updateReview,
);
adminRouter.delete("/reviews/:reviewId", adminController.deleteReview);

// Admin staff roster.
adminRouter.get("/admin-staff", adminController.listAdminStaff);
// Disputes: list, and resolve/settle (both paths hit the same controller).
adminRouter.get("/disputes", adminController.listDisputes);
adminRouter.patch("/disputes/:disputeId/resolve", adminController.resolveDispute);
adminRouter.post("/disputes/:disputeId/settle", adminController.resolveDispute);
// Escrow override — reuses the generic updatePayment controller under a payments-specific alias.
adminRouter.patch("/payments/:paymentId/override", adminController.updatePayment);
adminRouter.post("/payments/:paymentId/override", adminController.updatePayment);
// Audit log trail (written to by recordAuditLog in admin.service.ts on every mutating admin action).
adminRouter.get("/audit-logs", adminController.listAuditLogs);
// Platform-wide settings: read/update (three verb aliases for the same update).
adminRouter.get("/settings", adminController.getPlatformSettings);
adminRouter.patch("/settings", adminController.updatePlatformSettings);
adminRouter.put("/settings", adminController.updatePlatformSettings);
adminRouter.post("/settings", adminController.updatePlatformSettings);
// Platform analytics (time-range trends, separate from the dashboard KPI snapshot above).
adminRouter.get("/analytics", adminController.getAnalytics);
// Invite a new admin staff member.
adminRouter.post("/invitations", adminController.createAdminInvitation);

// Specialized mutation route aliases.
// NOTE: verifyClientKYC/updateGigProBadge/updateUserStatus/revokeAdminSession/
// moderateReview/updateProfilePassword/updateProfile2FA below are all backend
// no-ops — admin.service.ts only writes an audit-log line and returns
// {success: true} for these; there's no kycStatus/badge/status column,
// session table, or moderation column in schema.prisma to actually persist
// to. See the CLAUDE.md "Current implementation state" note.
adminRouter.patch("/clients/:clientId/kyc", adminController.verifyClientKYC);
adminRouter.post("/clients/:clientId/kyc", adminController.verifyClientKYC);
adminRouter.patch("/gig-pros/:gigProId/badge", adminController.updateGigProBadge);
adminRouter.patch("/gig-profiles/:gigProfileId/badge", adminController.updateGigProBadge);
adminRouter.patch("/users/:userId/status", adminController.updateUserStatus);
adminRouter.post("/users/:userId/status", adminController.updateUserStatus);
adminRouter.post("/sessions/:staffId/revoke", adminController.revokeAdminSession);
adminRouter.delete("/sessions/:staffId", adminController.revokeAdminSession);
adminRouter.patch("/reviews/:reviewId/moderate", adminController.moderateReview);
adminRouter.post("/reviews/:reviewId/moderate", adminController.moderateReview);
adminRouter.post("/profile/password", adminController.updateProfilePassword);
adminRouter.patch("/profile/password", adminController.updateProfilePassword);
adminRouter.post("/profile/2fa", adminController.updateProfile2FA);
adminRouter.patch("/profile/2fa", adminController.updateProfile2FA);
