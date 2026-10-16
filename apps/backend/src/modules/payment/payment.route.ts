/**
 * @file payment.route.ts
 * @description Express route handlers for the centralized Payment module.
 *
 * Payment processing itself is phase 2 and intentionally untouched here.
 * These routes only add the authorization the rest of the workflow depends
 * on: a client can act on payments for their OWN tasks, the amount/parties
 * come from the DB rather than the request body, and release (which marks the
 * task completed) is allowed only once every required deliverable is approved.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from 'db';
import { PaymentController } from './payment.controller.js';
import type { PaymentRecord } from './payment.types.js';
import { authGuard } from '../../middleware/authGuard.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import type { ClientTokenPayload } from '../../lib/jwt.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import { isTaskWorkComplete } from '../../lib/taskRules.js';

const router = Router();

// Protected payment endpoints: only authenticated clients can initiate or release escrow payments
router.use(authGuard, roleGuard('client'));

/** Accepts "12" or legacy prefixed ids like "tsk-12"; never defaults to some other task. */
function parseId(raw: unknown, label: string): number {
  const id = Number(String(raw ?? '').replace(/[^0-9]/g, ''));
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label}`);
  return id;
}

/** The caller's own task plus its hired professional's payment row. */
async function requireOwnedContract(req: Request, rawTaskId: unknown) {
  const taskId = parseId(rawTaskId, 'task id');
  const { clientId } = req.user as ClientTokenPayload;
  const task = await prisma.task.findFirst({
    where: { taskId, clientId },
    include: { applications: { where: { status: 'accepted' }, take: 1 }, payments: true },
  });
  if (!task) throw notFound('Task not found');
  const hired = task.applications[0];
  const payment = hired ? task.payments.find((p) => p.gigProfileId === hired.gigProfileId) : undefined;
  return { task, hired, payment };
}

// Client initiates payment
router.post('/initiate', async (req: Request, res: Response) => {
  const { task, hired } = await requireOwnedContract(req, req.body?.taskId);
  if (!hired) throw conflict('Nobody has been hired for this task yet');
  const result = await PaymentController.initiatePayment(String(task.taskId), String(hired.gigProfileId), Number(task.budget));
  return res.json(result);
});

// Fetch payment for task
router.get('/task/:taskId', async (req: Request, res: Response) => {
  const { task } = await requireOwnedContract(req, req.params.taskId);
  const result = await PaymentController.getPaymentByTask(String(task.taskId));
  return res.json(result);
});

// Client approves & releases payment — the only operation that completes a task.
router.post('/release', async (req: Request, res: Response) => {
  const { task, hired, payment } = await requireOwnedContract(req, req.body?.payment?.taskId);
  if (!hired || !payment) throw conflict('Nobody has been hired for this task yet');
  if (task.status !== 'in_progress' || payment.status === 'completed') {
    throw conflict('Payment for this task has already been released');
  }
  if (!(await isTaskWorkComplete(task.taskId))) {
    throw conflict('All required deliverables must be approved before payment can be released');
  }
  const result = await PaymentController.releasePayment({
    ...(req.body.payment as PaymentRecord),
    taskId: String(task.taskId),
    gigProfileId: String(hired.gigProfileId),
    gigAmount: Number(payment.amount),
  });
  return res.json(result);
});

export default router;
