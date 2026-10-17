import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { taskAccessGuard } from "../../middleware/taskAccessGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  reviewDeliverableSchema,
  shortlistApplicationSchema,
  updateManagerProfileSchema,
  updateManagerSchema,
} from "./manager.dto.js";
import * as managerController from "./manager.controller.js";
import * as clientController from "../client/client.controller.js";
import { createTaskDeliverableDefinitionSchema, updateTaskDeliverableDefinitionSchema } from "../client/client.dto.js";

export const managerRouter = Router();

managerRouter.use(authGuard);

// ---- Client-facing manager roster (client token) --------------------
// List the managers belonging to the authenticated client.
managerRouter.get("/managers", roleGuard("client"), managerController.listManagers);
// Remove a manager from the client's roster.
managerRouter.delete(
  "/managers/:managerId",
  roleGuard("client"),
  managerController.deleteManager,
);
// Update a manager's own record (e.g. name) on the client's roster.
managerRouter.patch(
  "/managers/:managerId",
  roleGuard("client"),
  validate(updateManagerSchema),
  managerController.updateManager,
);

// ---- Manager self-service (manager token) ----------------------------
const managerOnly = roleGuard("manager");

// Fetch the logged-in manager's own profile.
managerRouter.get("/managers/me", managerOnly, managerController.getOwnProfile);
// Update the logged-in manager's own profile.
managerRouter.patch(
  "/managers/me",
  managerOnly,
  validate(updateManagerProfileSchema),
  managerController.updateOwnProfile,
);
// List every task assigned to the logged-in manager.
managerRouter.get("/managers/me/tasks", managerOnly, managerController.listAssignedTasks);
// Fetch a single assigned task (taskAccessGuard checks it's actually theirs).
managerRouter.get(
  "/managers/me/tasks/:taskId",
  managerOnly,
  taskAccessGuard,
  managerController.getAssignedTask,
);
// List applications submitted against one of the manager's assigned tasks.
managerRouter.get(
  "/managers/me/tasks/:taskId/applications",
  managerOnly,
  taskAccessGuard,
  managerController.listTaskApplications,
);
// Accept/reject a gig professional's application for the task.
managerRouter.patch(
  "/managers/me/tasks/:taskId/applications/:applicationId/shortlist",
  managerOnly,
  taskAccessGuard,
  validate(shortlistApplicationSchema),
  managerController.shortlistApplication,
);
// List deliverables submitted for the task.
managerRouter.get(
  "/managers/me/tasks/:taskId/deliverables",
  managerOnly,
  taskAccessGuard,
  managerController.listTaskDeliverables,
);
// Fetch one deliverable by its per-task sequence number.
managerRouter.get(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo",
  managerOnly,
  taskAccessGuard,
  managerController.getDeliverable,
);
// Approve or request revisions on a submitted deliverable.
managerRouter.patch(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo/review",
  managerOnly,
  taskAccessGuard,
  validate(reviewDeliverableSchema),
  managerController.reviewDeliverable,
);
// Mark an approved deliverable closed (finalised).
managerRouter.patch(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo/close",
  managerOnly,
  taskAccessGuard,
  managerController.closeDeliverable,
);

// Deliverable definitions (scope items) on an assigned task — same handlers
// and rules as the client's routes; taskAccessGuard restricts to assigned tasks.
const definitionsPath = "/managers/me/tasks/:taskId/deliverable-definitions";
managerRouter.get(definitionsPath, managerOnly, taskAccessGuard, clientController.listTaskDeliverableDefinitions);
managerRouter.post(definitionsPath, managerOnly, taskAccessGuard, validate(createTaskDeliverableDefinitionSchema), clientController.createTaskDeliverableDefinition);
managerRouter.patch(`${definitionsPath}/:definitionId`, managerOnly, taskAccessGuard, validate(updateTaskDeliverableDefinitionSchema), clientController.updateTaskDeliverableDefinition);
managerRouter.delete(`${definitionsPath}/:definitionId`, managerOnly, taskAccessGuard, clientController.deleteTaskDeliverableDefinition);

// Search gig professionals available to assign to a task.
// managerApi.ts calls this with a MANAGER token even though the path lives
// under /gig — see app.ts. Handled here, not in the gig module, which
// enforces roleGuard('gig_professional') for everything else it owns.
managerRouter.get("/gig/professionals", managerOnly, managerController.searchGigProfessionals);
