import { z } from "zod";

export const updateManagerProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(100).optional(),
  password: z.string().min(6).max(72).optional(),
});
export type UpdateManagerProfileDto = z.infer<typeof updateManagerProfileSchema>;

/** Client editing a manager they own (post-invite) — no password field here. */
export const updateManagerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(100).optional(),
});
export type UpdateManagerDto = z.infer<typeof updateManagerSchema>;

export const createDeliverableSchema = z.object({
  gigProfileId: z.coerce.number().int().positive(),
  description: z.string().min(1).max(500),
  submissionPath: z.string().min(1).max(500),
});
export type CreateDeliverableDto = z.infer<typeof createDeliverableSchema>;

export const reviewDeliverableSchema = z.object({
  status: z.enum(["approved", "revision_requested"]),
  feedback: z.string().max(500).optional(),
});
export type ReviewDeliverableDto = z.infer<typeof reviewDeliverableSchema>;
