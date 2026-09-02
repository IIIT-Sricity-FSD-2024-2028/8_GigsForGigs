import { z } from "zod";

// PUT /gig/profile sends the whole GigProfile object back, including
// read-only/derived fields (name, email, rating, ...) this endpoint doesn't
// own. .passthrough() means those are ignored rather than 400ing the request.
export const updateGigProfileSchema = z
  .object({
    bio: z.string().optional(),
    skills: z.array(z.string().min(1).max(100)).optional(),
    tools: z.array(z.string().min(1).max(100)).optional(),
    portfolio: z.array(z.string().min(1).max(500)).optional(),
  })
  .passthrough();
export type UpdateGigProfileDto = z.infer<typeof updateGigProfileSchema>;

export const createApplicationSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;

export const respondToRequestSchema = z.object({
  action: z.enum(["accepted", "declined"]),
});
export type RespondToRequestDto = z.infer<typeof respondToRequestSchema>;

export const submitDeliverableSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  content: z.string().min(1),
  notes: z.string().optional().nullable().or(z.literal("")),
});
export type SubmitDeliverableDto = z.infer<typeof submitDeliverableSchema>;

export const createServiceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive().max(99999999.99),
  tags: z.array(z.string().min(1).max(100)).default([]),
  thumbnail: z.string().max(500).optional(),
});
export type CreateServiceDto = z.infer<typeof createServiceSchema>;

export const createReviewSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;
