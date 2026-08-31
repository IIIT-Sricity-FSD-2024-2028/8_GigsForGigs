import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { clientOwnershipGuard } from "../../middleware/clientOwnershipGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createManagerInviteSchema,
  createTaskSchema,
  reviewDeliverableAsClientSchema,
  updateApplicationSchema,
  updateClientProfileSchema,
  updateTaskSchema,
} from "./client.dto.js";
import * as clientController from "./client.controller.js";

export const clientRouter = Router();

// Every route below is client-only. Managers and gig professionals have no
// path into this router at all — that absence, not a per-route check, is
// what keeps task CRUD and payment authority root-client-only.
clientRouter.use(authGuard, roleGuard("client"));

clientRouter.get("/clients/me", clientController.getProfile);
clientRouter.get("/clients/:clientId/profile", clientController.getProfile);
clientRouter.post(
  "/clients/:clientId/profile",
  validate(updateClientProfileSchema),
  clientController.updateProfile,
);
clientRouter.patch(
  "/clients/me/profile",
  validate(updateClientProfileSchema),
  clientController.updateProfile,
);

clientRouter.post("/tasks", validate(createTaskSchema), clientController.createTask);
clientRouter.get("/tasks", clientController.listTasks);
clientRouter.put(
  "/tasks/:taskId",
  clientOwnershipGuard,
  validate(updateTaskSchema),
  clientController.updateTask,
);
clientRouter.patch(
  "/tasks/:taskId",
  clientOwnershipGuard,
  validate(updateTaskSchema),
  clientController.updateTask,
);
clientRouter.delete("/tasks/:taskId", clientOwnershipGuard, clientController.deleteTask);

clientRouter.get("/applications", clientController.listApplications);
clientRouter.patch(
  "/applications/:applicationId",
  validate(updateApplicationSchema),
  clientController.reviewApplication,
);

clientRouter.get("/contracts", clientController.listContracts);

clientRouter.get(
  "/tasks/:taskId/deliverables",
  clientOwnershipGuard,
  clientController.listTaskDeliverables,
);
clientRouter.patch(
  "/deliverables/:deliverableId",
  validate(reviewDeliverableAsClientSchema),
  clientController.reviewDeliverable,
);

clientRouter.get("/services", clientController.listServices);
clientRouter.post("/services/:serviceId/requests", clientController.requestService);
clientRouter.get("/requests", clientController.listServiceRequests);

clientRouter.post(
  "/manager-invites",
  validate(createManagerInviteSchema),
  clientController.createManagerInvite,
);
clientRouter.get("/manager-invites", clientController.listManagerInvites);
