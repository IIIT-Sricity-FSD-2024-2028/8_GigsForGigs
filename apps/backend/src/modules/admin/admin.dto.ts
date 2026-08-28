import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  password: z.string().min(6).max(72),
  role: z.enum(["client", "gig_professional", "manager", "admin"]),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const createClientSchema = z.object({
  userId: z.coerce.number().int().positive(),
  clientName: z.string().min(1).max(100),
  domain: z.string().max(100).optional(),
});
export type CreateClientDto = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  domain: z.string().max(100).optional(),
});
export type UpdateClientDto = z.infer<typeof updateClientSchema>;

export const createManagerSchema = z.object({
  userId: z.coerce.number().int().positive(),
  clientId: z.coerce.number().int().positive(),
});
export type CreateManagerDto = z.infer<typeof createManagerSchema>;

export const createGigProfileSchema = z.object({
  userId: z.coerce.number().int().positive(),
  bio: z.string().optional(),
});
export type CreateGigProfileDto = z.infer<typeof createGigProfileSchema>;

export const updateGigProfileSchema = z.object({ bio: z.string().optional() });
export type UpdateGigProfileDto = z.infer<typeof updateGigProfileSchema>;

export const createTaskSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  budget: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["open", "in_progress", "completed"]).optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const createApplicationSchema = z.object({
  gigProfileId: z.coerce.number().int().positive(),
  taskId: z.coerce.number().int().positive(),
  status: z.enum(["pending", "accepted", "declined"]).optional(),
});
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(["pending", "accepted", "declined"]).optional(),
});
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;

export const createAssignmentSchema = z.object({
  gigProfileId: z.coerce.number().int().positive(),
  taskId: z.coerce.number().int().positive(),
  managerId: z.coerce.number().int().positive(),
});
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;

export const createDeliverableSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  gigProfileId: z.coerce.number().int().positive(),
  description: z.string().min(1).max(500),
  submissionPath: z.string().min(1).max(500),
  status: z.enum(["submitted", "approved", "revision_requested", "closed"]).optional(),
});
export type CreateDeliverableDto = z.infer<typeof createDeliverableSchema>;

export const updateDeliverableSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  submissionPath: z.string().min(1).max(500).optional(),
  status: z.enum(["submitted", "approved", "revision_requested", "closed"]).optional(),
  feedback: z.string().max(500).optional(),
});
export type UpdateDeliverableDto = z.infer<typeof updateDeliverableSchema>;

export const createPaymentSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  gigProfileId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  status: z.enum(["pending", "completed", "failed"]).optional(),
});
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  status: z.enum(["pending", "completed", "failed"]).optional(),
});
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;

export const createReviewSchema = z.object({
  reviewerId: z.coerce.number().int().positive(),
  revieweeId: z.coerce.number().int().positive(),
  taskId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
