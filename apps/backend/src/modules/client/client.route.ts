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

// Fetch the logged-in client's own profile.
clientRouter.get("/clients/me", clientController.getProfile);
// Fetch a client profile by id (still scoped to the caller's own client via the controller).
clientRouter.get("/clients/:clientId/profile", clientController.getProfile);
// Update a client profile by id.
clientRouter.post(
  "/clients/:clientId/profile",
  validate(updateClientProfileSchema),
  clientController.updateProfile,
);
// Update the logged-in client's own profile.
clientRouter.patch(
  "/clients/me/profile",
  validate(updateClientProfileSchema),
  clientController.updateProfile,
);

// Post a new task.
clientRouter.post("/tasks", validate(createTaskSchema), clientController.createTask);
// List the logged-in client's tasks.
clientRouter.get("/tasks", clientController.listTasks);
// Replace a task's fields (ownership checked by clientOwnershipGuard).
clientRouter.put(
  "/tasks/:taskId",
  clientOwnershipGuard,
  validate(updateTaskSchema),
  clientController.updateTask,
);
// Partially update a task's fields (ownership checked by clientOwnershipGuard).
clientRouter.patch(
  "/tasks/:taskId",
  clientOwnershipGuard,
  validate(updateTaskSchema),
  clientController.updateTask,
);
// Delete a task (ownership checked by clientOwnershipGuard).
clientRouter.delete("/tasks/:taskId", clientOwnershipGuard, clientController.deleteTask);

// List applications received against the client's tasks.
clientRouter.get("/applications", clientController.listApplications);
// Accept/decline a gig professional's application.
clientRouter.patch(
  "/applications/:applicationId",
  validate(updateApplicationSchema),
  clientController.reviewApplication,
);

// List the client's active contracts (tasks with an accepted application).
clientRouter.get("/contracts", clientController.listContracts);

// List deliverables submitted for one of the client's tasks (ownership checked by clientOwnershipGuard).
clientRouter.get(
  "/tasks/:taskId/deliverables",
  clientOwnershipGuard,
  clientController.listTaskDeliverables,
);
// Approve a deliverable or request revisions, as the client.
clientRouter.patch(
  "/deliverables/:deliverableId",
  validate(reviewDeliverableAsClientSchema),
  clientController.reviewDeliverable,
);

// Browse gig professional services available to hire.
clientRouter.get("/services", clientController.listServices);
// Request/hire a gig professional's service.
clientRouter.post("/services/:serviceId/requests", clientController.requestService);
// List the client's own service requests.
clientRouter.get("/requests", clientController.listServiceRequests);

// Invite a new manager onto the client's account.
clientRouter.post(
  "/manager-invites",
  validate(createManagerInviteSchema),
  clientController.createManagerInvite,
);
// List pending/past manager invites sent by the client.
clientRouter.get("/manager-invites", clientController.listManagerInvites);
