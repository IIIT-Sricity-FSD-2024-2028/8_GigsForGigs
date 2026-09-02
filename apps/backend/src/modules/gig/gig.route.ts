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

gigRouter.use(authGuard);

// Talent discovery endpoint accessible to Managers, Clients, and Admins
gigRouter.get(
  "/professionals",
  roleGuard("manager", "client", "gig_professional", "admin"),
  async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    const { searchGigProfessionals } = await import("../manager/manager.service.js");
    const { toTalentResponse } = await import("../manager/manager.controller.js");
    const list = await searchGigProfessionals(query);
    res.status(200).json(list.map(toTalentResponse));
  },
);

const gigOnly = roleGuard("gig_professional");

// Fetch the logged-in gig professional's own profile.
gigRouter.get("/profile", gigOnly, gigController.getProfile);
// Update the logged-in gig professional's own profile (bio/skills/tools/portfolio).
gigRouter.put("/profile", gigOnly, validate(updateGigProfileSchema), gigController.updateProfile);

// Browse open tasks available to apply for.
gigRouter.get("/tasks/marketplace", gigOnly, gigController.listMarketplaceTasks);
// Apply for a marketplace task.
gigRouter.post(
  "/applications",
  gigOnly,
  validate(createApplicationSchema),
  gigController.createApplication,
);
// Withdraw a submitted application.
gigRouter.delete("/applications/:id", gigOnly, gigController.withdrawApplication);

// List incoming hire/service requests awaiting the gig professional's response.
gigRouter.get("/requests/pending", gigOnly, gigController.listPendingRequests);
// Accept or decline a pending request.
gigRouter.post(
  "/requests/:id/respond",
  gigOnly,
  validate(respondToRequestSchema),
  gigController.respondToRequest,
);

// List tasks the gig professional is currently working on.
gigRouter.get("/tasks/active", gigOnly, gigController.listActiveTasks);
// Submit a deliverable against an active task.
gigRouter.post(
  "/deliverables",
  gigOnly,
  validate(submitDeliverableSchema),
  gigController.submitDeliverable,
);

// List the gig professional's own posted services.
gigRouter.get("/services/mine", gigOnly, gigController.listMyServices);
// Post a new service listing.
gigRouter.post("/services", gigOnly, validate(createServiceSchema), gigController.createService);

// Leave a review for a client on a completed task.
gigRouter.post("/reviews", gigOnly, validate(createReviewSchema), gigController.createReview);

// List the gig professional's completed projects.
gigRouter.get("/projects/completed", gigOnly, gigController.listCompletedProjects);
// Fetch the gig professional's earnings summary.
gigRouter.get("/earnings", gigOnly, gigController.getEarnings);
