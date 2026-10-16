import { z } from "zod";
import { MONEY_10_2, futureDate, id, line, money, orgName, personName, tag, tagList, text } from "../../lib/validation.js";

export const updateClientProfileSchema = z.object({
  clientName: orgName(100).optional(),
  domain: text(100).optional(),
});
export type UpdateClientProfileDto = z.infer<typeof updateClientProfileSchema>;

export const createTaskSchema = z.object({
  title: line(255),
  description: text(5000).optional(),
  category: tag(50).optional(),
  duration: tag(50).optional(),
  skills: tagList(20).optional(),
  budget: money(MONEY_10_2),
  dueDate: futureDate().optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

const taskDeliverableDefinitionFields = {
  title: line(255),
  description: text(2000).optional().transform(value => value || undefined),
};

export const createTaskDeliverableDefinitionSchema = z.object(taskDeliverableDefinitionFields);
export type CreateTaskDeliverableDefinitionDto = z.infer<typeof createTaskDeliverableDefinitionSchema>;

export const updateTaskDeliverableDefinitionSchema = z.object({
  title: taskDeliverableDefinitionFields.title.optional(),
  description: text(2000).optional(),
}).refine(value => Object.keys(value).length > 0, "Provide a title or description to update");
export type UpdateTaskDeliverableDefinitionDto = z.infer<typeof updateTaskDeliverableDefinitionSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;

export const reviewDeliverableAsClientSchema = z
  .object({
    status: z.enum(["approved", "revision_requested"]),
    feedback: text(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "revision_requested") {
      if (!data.feedback || !data.feedback.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Feedback is required when requesting revisions",
          path: ["feedback"],
        });
      }
    }
  });
export type ReviewDeliverableAsClientDto = z.infer<typeof reviewDeliverableAsClientSchema>;

export const createClientReviewSchema = z.object({
  taskId: id(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: text(1000).optional(),
});
export type CreateClientReviewDto = z.infer<typeof createClientReviewSchema>;

export const createManagerInviteSchema = z.object({
  name: personName(100),
  email: z.string().trim().email().max(100),
});
export type CreateManagerInviteDto = z.infer<typeof createManagerInviteSchema>;

/**
 * DELIVERABLE's real PK is composite (task_id, deliverable_no) — there is no
 * surrogate id. The spec's `{deliverableId}` route param is parsed as
 * "<taskId>-<deliverableNo>" (e.g. "101-2") to bridge that gap.
 */
export function parseDeliverableKey(raw: string): { taskId: number; deliverableNo: number } {
  const match = /^(\d{1,9})-(\d{1,9})$/.exec(raw);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Malformed deliverable id, expected '<taskId>-<deliverableNo>'");
  }
  return { taskId: Number(match[1]), deliverableNo: Number(match[2]) };
}
