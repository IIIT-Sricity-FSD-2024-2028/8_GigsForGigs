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
    const { serializeTalent } = await import("../manager/manager.serializer.js");
    const list = await searchGigProfessionals(query);
    res.status(200).json(list.map(serializeTalent));
  },
);

const gigOnly = roleGuard("gig_professional");

gigRouter.get("/profile", gigOnly, gigController.getProfile);
gigRouter.put("/profile", gigOnly, validate(updateGigProfileSchema), gigController.updateProfile);

gigRouter.get("/tasks/marketplace", gigOnly, gigController.listMarketplaceTasks);
gigRouter.post(
  "/applications",
  gigOnly,
  validate(createApplicationSchema),
  gigController.createApplication,
);
gigRouter.delete("/applications/:id", gigOnly, gigController.withdrawApplication);

gigRouter.get("/requests/pending", gigOnly, gigController.listPendingRequests);
gigRouter.post(
  "/requests/:id/respond",
  gigOnly,
  validate(respondToRequestSchema),
  gigController.respondToRequest,
);

gigRouter.get("/tasks/active", gigOnly, gigController.listActiveTasks);
gigRouter.post(
  "/deliverables",
  gigOnly,
  validate(submitDeliverableSchema),
  gigController.submitDeliverable,
);

gigRouter.get("/services/mine", gigOnly, gigController.listMyServices);
gigRouter.post("/services", gigOnly, validate(createServiceSchema), gigController.createService);

gigRouter.post("/reviews", gigOnly, validate(createReviewSchema), gigController.createReview);

gigRouter.get("/projects/completed", gigOnly, gigController.listCompletedProjects);
gigRouter.get("/earnings", gigOnly, gigController.getEarnings);
