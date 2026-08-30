/**
 * @file payment.route.ts
 * @description Express route handlers for the centralized Payment module.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { PaymentController } from './payment.controller.js';

const router = Router();

// Client initiates payment
router.post('/initiate', (req: Request, res: Response) => {
  const { taskId, gigProfileId, gigAmount } = req.body;
  const result = PaymentController.initiatePayment(taskId, gigProfileId, Number(gigAmount || 0));
  return res.json(result);
});

// Client approves & releases payment
router.post('/release', (req: Request, res: Response) => {
  const { payment } = req.body;
  const result = PaymentController.releasePayment(payment);
  return res.json(result);
});

export default router;
