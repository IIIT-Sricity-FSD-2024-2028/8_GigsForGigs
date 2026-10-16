import { z } from "zod";
import { id } from "../../lib/validation.js";

export const taskPaymentSchema = z.object({ taskId: id() });
export type TaskPaymentDto = z.infer<typeof taskPaymentSchema>;
