import { z } from "zod";
import { MONEY_10_2, httpUrl, id, line, money, tagList, text } from "../../lib/validation.js";

// PUT /gig/profile sends the whole GigProfile object back, including
// read-only/derived fields (name, email, rating, ...) this endpoint doesn't
// own. z.object strips unknown keys, so those are dropped rather than 400ing.
export const updateGigProfileSchema = z
  .object({
    bio: text(5000).optional(),
    skills: tagList(50, 100).optional(),
    tools: tagList(50, 100).optional(),
    portfolio: z.array(httpUrl()).max(20, "at most 20 portfolio links").optional(),
  });
export type UpdateGigProfileDto = z.infer<typeof updateGigProfileSchema>;

export const createApplicationSchema = z.object({
  taskId: id(),
});
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;

export const respondToRequestSchema = z.object({
  action: z.enum(["accepted", "declined"]),
});
export type RespondToRequestDto = z.infer<typeof respondToRequestSchema>;

export const submitDeliverableSchema = z.object({
  taskId: id(),
  content: text(500).refine(s => s.length > 0, "Submission details are required"),
  notes: text(500).optional().nullable(),
  definitionIds: z.array(id()).max(100, "too many deliverables selected").optional().default([]),
}).refine(dto => new Set(dto.definitionIds).size === dto.definitionIds.length, {
  message: "Each task deliverable can only be selected once",
  path: ["definitionIds"],
});
export type SubmitDeliverableDto = z.infer<typeof submitDeliverableSchema>;

export const createServiceSchema = z.object({
  title: line(255),
  description: text(5000).optional(),
  price: money(MONEY_10_2),
  tags: tagList(20, 100).default([]),
  thumbnail: httpUrl().optional(),
});
export type CreateServiceDto = z.infer<typeof createServiceSchema>;

export const createReviewSchema = z.object({
  taskId: id(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: text(1000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;
