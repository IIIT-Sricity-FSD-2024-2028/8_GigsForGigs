import { Router } from "express";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createApplicationSchema,
  createReviewSchema,
  createServiceSchema,
  respondToRequestSchema,
  submitDeliverableSchema,
  updateGigProfileSchema,
} from "./gig.dto.js";
import * as gigController from "./gig.controller.js";

export const gigRouter = Router();

// Mounted at /api/gig in app.ts. Fully authed — g4g_gig_token is never
// written anywhere in the frontend today, so every request here 401s until
// the login flow is wired to store it. That's the correct contract, not a
// bug in this router; see the plan's "known integration gaps".
gigRouter.use(authGuard, roleGuard("gig_professional"));

gigRouter.get("/profile", gigController.getProfile);
gigRouter.put("/profile", validate(updateGigProfileSchema), gigController.updateProfile);

gigRouter.get("/tasks/marketplace", gigController.listMarketplaceTasks);
gigRouter.post(
  "/applications",
  validate(createApplicationSchema),
  gigController.createApplication,
);
gigRouter.delete("/applications/:id", gigController.withdrawApplication);

gigRouter.get("/requests/pending", gigController.listPendingRequests);
gigRouter.post(
  "/requests/:id/respond",
  validate(respondToRequestSchema),
  gigController.respondToRequest,
);

gigRouter.get("/tasks/active", gigController.listActiveTasks);
gigRouter.post(
  "/deliverables",
  validate(submitDeliverableSchema),
  gigController.submitDeliverable,
);

gigRouter.get("/services/mine", gigController.listMyServices);
gigRouter.post("/services", validate(createServiceSchema), gigController.createService);

gigRouter.post("/reviews", validate(createReviewSchema), gigController.createReview);

gigRouter.get("/projects/completed", gigController.listCompletedProjects);
gigRouter.get("/earnings", gigController.getEarnings);
