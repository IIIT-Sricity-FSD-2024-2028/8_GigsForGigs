import { z } from "zod";
import { MONEY_8_2, money, personName, text } from "../../lib/validation.js";

export const updateManagerProfileSchema = z.object({
  name: personName(100).optional(),
  email: z.string().trim().email().max(100).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72).optional(),
});
export type UpdateManagerProfileDto = z.infer<typeof updateManagerProfileSchema>;

/** Client editing a manager they own (post-invite) — no password field here. */
export const updateManagerSchema = z.object({
  name: personName(100).optional(),
  email: z.string().trim().email().max(100).optional(),
});
export type UpdateManagerDto = z.infer<typeof updateManagerSchema>;

export const reviewDeliverableSchema = z.object({
  status: z.enum(["approved", "revision_requested"]),
  feedback: text(500).optional(),
});
export type ReviewDeliverableDto = z.infer<typeof reviewDeliverableSchema>;

export const shortlistApplicationSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  hourlyRate: money(MONEY_8_2).optional(),
});
export type ShortlistApplicationDto = z.infer<typeof shortlistApplicationSchema>;
