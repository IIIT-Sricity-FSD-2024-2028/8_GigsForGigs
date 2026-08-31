/**
 * @file payment.route.ts
 * @description Express route handlers for the centralized Payment module.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { PaymentController } from './payment.controller.js';
import { authGuard } from '../../middleware/authGuard.js';
import { roleGuard } from '../../middleware/roleGuard.js';

const router = Router();

// Protected payment endpoints: only authenticated clients can initiate or release escrow payments
router.use(authGuard, roleGuard('client'));

// Client initiates payment
router.post('/initiate', async (req: Request, res: Response) => {
  const { taskId, gigProfileId, gigAmount } = req.body;
  const result = await PaymentController.initiatePayment(taskId, gigProfileId, Number(gigAmount || 0));
  return res.json(result);
});

// Fetch payment for task
router.get('/task/:taskId', async (req: Request, res: Response) => {
  const result = await PaymentController.getPaymentByTask(String(req.params.taskId));
  return res.json(result);
});

// Client approves & releases payment
router.post('/release', async (req: Request, res: Response) => {
  const { payment } = req.body;
  const result = await PaymentController.releasePayment(payment);
  return res.json(result);
});

export default router;
