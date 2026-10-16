/**
 * @file payment.route.ts
 * @description Client payment endpoints for the simulated escrow flow.
 * A client can act only on payments for their OWN tasks; amounts and parties
 * come from the DB, never the request body. Release (which completes the
 * task) is allowed only once the task is funded and every required
 * deliverable is approved. See payment.controller.ts.
 */

import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { taskPaymentSchema } from './payment.dto.js';
import { validate } from '../../middleware/validate.js';
import { authGuard } from '../../middleware/authGuard.js';
import { roleGuard } from '../../middleware/roleGuard.js';

const router = Router();

router.use(authGuard, roleGuard('client'));

router.post('/pay', validate(taskPaymentSchema), paymentController.pay);
router.post('/release', validate(taskPaymentSchema), paymentController.release);

export default router;
