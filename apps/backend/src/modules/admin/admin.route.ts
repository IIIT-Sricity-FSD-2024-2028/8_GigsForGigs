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

// Every route in this router bypasses clientOwnershipGuard/taskAccessGuard
// by construction — they are simply never mounted here. That absence, not a
// per-route check, is what gives admin full cross-tenant access.
adminRouter.use(authGuard, roleGuard("admin"));

adminRouter.get("/dashboard/stats", adminController.getDashboardStats);

adminRouter.get("/users", adminController.listUsers);
adminRouter.get("/users/:userId", adminController.getUser);
adminRouter.post("/users", validate(createUserSchema), adminController.createUser);
adminRouter.patch("/users/:userId", validate(updateUserSchema), adminController.updateUser);
adminRouter.delete("/users/:userId", adminController.deleteUser);

adminRouter.get("/clients", adminController.listClients);
adminRouter.get("/clients/:clientId", adminController.getClient);
adminRouter.post("/clients", validate(createClientSchema), adminController.createClient);
adminRouter.patch(
  "/clients/:clientId",
  validate(updateClientSchema),
  adminController.updateClient,
);
adminRouter.delete("/clients/:clientId", adminController.deleteClient);

adminRouter.get("/managers", adminController.listManagers);
adminRouter.post("/managers", validate(createManagerSchema), adminController.createManager);
adminRouter.delete("/managers/:clientId/:managerId", adminController.deleteManager);

adminRouter.get("/gig-profiles", adminController.listGigProfiles);
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

adminRouter.get("/tasks", adminController.listTasks);
adminRouter.get("/tasks/:taskId", adminController.getTask);
adminRouter.post("/tasks", validate(createTaskSchema), adminController.createTask);
adminRouter.patch("/tasks/:taskId", validate(updateTaskSchema), adminController.updateTask);
adminRouter.delete("/tasks/:taskId", adminController.deleteTask);

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

adminRouter.get("/assignments", adminController.listAssignments);
adminRouter.post(
  "/assignments",
  validate(createAssignmentSchema),
  adminController.createAssignment,
);
adminRouter.delete("/assignments/:gigProfileId/:taskId", adminController.deleteAssignment);

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

adminRouter.get("/payments", adminController.listPayments);
adminRouter.post("/payments", validate(createPaymentSchema), adminController.createPayment);
adminRouter.patch(
  "/payments/:paymentId",
  validate(updatePaymentSchema),
  adminController.updatePayment,
);
adminRouter.delete("/payments/:paymentId", adminController.deletePayment);

adminRouter.get("/reviews", adminController.listReviews);
adminRouter.post("/reviews", validate(createReviewSchema), adminController.createReview);
adminRouter.patch(
  "/reviews/:reviewId",
  validate(updateReviewSchema),
  adminController.updateReview,
);
adminRouter.delete("/reviews/:reviewId", adminController.deleteReview);
