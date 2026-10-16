import type { Request, Response } from 'express';
import * as paymentService from './payment.service.js';
import { getValidated } from '../../middleware/validate.js';
import type { ClientTokenPayload } from '../../lib/jwt.js';
import type { TaskPaymentDto } from './payment.dto.js';

// Client pays gig amount + platform fee into escrow (simulated).
export async function pay(req: Request, res: Response): Promise<void> {
  const { clientId } = req.user as ClientTokenPayload;
  const { taskId } = getValidated<TaskPaymentDto>(res, 'body');
  await paymentService.payForTask(clientId, taskId);
  res.json({ success: true });
}

// Client releases escrow to the gig pro — the only operation that completes a task.
export async function release(req: Request, res: Response): Promise<void> {
  const { clientId } = req.user as ClientTokenPayload;
  const { taskId } = getValidated<TaskPaymentDto>(res, 'body');
  await paymentService.releaseForTask(clientId, taskId);
  res.json({ success: true });
}
