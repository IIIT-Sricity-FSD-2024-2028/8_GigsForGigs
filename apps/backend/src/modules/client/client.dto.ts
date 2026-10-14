import { z } from "zod";

export const updateClientProfileSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  domain: z.string().max(100).optional(),
});
export type UpdateClientProfileDto = z.infer<typeof updateClientProfileSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  skills: z.array(z.string()).optional(),
  budget: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  skills: z.array(z.string()).optional(),
  budget: z.coerce.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["open", "in_progress", "completed"]).optional(),
});
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

const taskDeliverableDefinitionFields = {
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(2000).optional().transform(value => value || undefined),
};

export const createTaskDeliverableDefinitionSchema = z.object(taskDeliverableDefinitionFields);
export type CreateTaskDeliverableDefinitionDto = z.infer<typeof createTaskDeliverableDefinitionSchema>;

export const updateTaskDeliverableDefinitionSchema = z.object({
  title: taskDeliverableDefinitionFields.title.optional(),
  description: z.string().trim().max(2000).optional(),
}).refine(value => Object.keys(value).length > 0, "Provide a title or description to update");
export type UpdateTaskDeliverableDefinitionDto = z.infer<typeof updateTaskDeliverableDefinitionSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;

export const reviewDeliverableAsClientSchema = z.object({
  status: z.enum(["approved", "revision_requested"]),
  feedback: z.string().max(500).optional(),
});
export type ReviewDeliverableAsClientDto = z.infer<typeof reviewDeliverableAsClientSchema>;

export const createManagerInviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
});
export type CreateManagerInviteDto = z.infer<typeof createManagerInviteSchema>;

/**
 * DELIVERABLE's real PK is composite (task_id, deliverable_no) — there is no
 * surrogate id. The spec's `{deliverableId}` route param is parsed as
 * "<taskId>-<deliverableNo>" (e.g. "101-2") to bridge that gap.
 */
export function parseDeliverableKey(raw: string): { taskId: number; deliverableNo: number } {
  const match = /^(\d+)-(\d+)$/.exec(raw);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Malformed deliverable id, expected '<taskId>-<deliverableNo>'");
  }
  return { taskId: Number(match[1]), deliverableNo: Number(match[2]) };
}
