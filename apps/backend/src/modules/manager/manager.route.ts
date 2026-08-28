import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { taskAccessGuard } from "../../middleware/taskAccessGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createDeliverableSchema,
  reviewDeliverableSchema,
  updateManagerProfileSchema,
  updateManagerSchema,
} from "./manager.dto.js";
import * as managerController from "./manager.controller.js";

export const managerRouter = Router();

managerRouter.use(authGuard);

// ---- Client-facing manager roster (client token) --------------------
managerRouter.get("/managers", roleGuard("client"), managerController.listManagers);
managerRouter.delete(
  "/managers/:managerId",
  roleGuard("client"),
  managerController.deleteManager,
);
managerRouter.patch(
  "/managers/:managerId",
  roleGuard("client"),
  validate(updateManagerSchema),
  managerController.updateManager,
);

// ---- Manager self-service (manager token) ----------------------------
const managerOnly = roleGuard("manager");

managerRouter.get("/managers/me", managerOnly, managerController.getOwnProfile);
managerRouter.patch(
  "/managers/me",
  managerOnly,
  validate(updateManagerProfileSchema),
  managerController.updateOwnProfile,
);
managerRouter.get("/managers/me/tasks", managerOnly, managerController.listAssignedTasks);
managerRouter.get(
  "/managers/me/tasks/:taskId",
  managerOnly,
  taskAccessGuard,
  managerController.getAssignedTask,
);
managerRouter.get(
  "/managers/me/tasks/:taskId/deliverables",
  managerOnly,
  taskAccessGuard,
  managerController.listTaskDeliverables,
);
managerRouter.post(
  "/managers/me/tasks/:taskId/deliverables",
  managerOnly,
  taskAccessGuard,
  validate(createDeliverableSchema),
  managerController.createDeliverable,
);
managerRouter.get(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo",
  managerOnly,
  taskAccessGuard,
  managerController.getDeliverable,
);
managerRouter.patch(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo/review",
  managerOnly,
  taskAccessGuard,
  validate(reviewDeliverableSchema),
  managerController.reviewDeliverable,
);
managerRouter.patch(
  "/managers/me/tasks/:taskId/deliverables/:deliverableNo/close",
  managerOnly,
  taskAccessGuard,
  managerController.closeDeliverable,
);

// managerApi.ts calls this with a MANAGER token even though the path lives
// under /gig — see app.ts. Handled here, not in the gig module, which
// enforces roleGuard('gig_professional') for everything else it owns.
managerRouter.get("/gig/professionals", managerOnly, managerController.searchGigProfessionals);
