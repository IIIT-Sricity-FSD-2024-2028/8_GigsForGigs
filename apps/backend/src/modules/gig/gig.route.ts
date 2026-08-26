import { Router, type Request, type Response } from 'express';
import { db } from '../../db/dbClient';

export const gigRouter = Router();

// Browse Open Tasks
gigRouter.get('/tasks', (_req: Request, res: Response) => {
  const openTasks = db.tasks.filter((t) => t.status === 'OPEN');
  res.json({ success: true, data: openTasks });
});

// Freelancer Earnings Summary
gigRouter.get('/earnings', (_req: Request, res: Response) => {
  const completed = db.payments.filter((p) => p.escrowStatus === 'RELEASED');
  const escrowHeld = db.payments.filter((p) => p.escrowStatus === 'HELD_IN_ESCROW');
  res.json({
    success: true,
    data: {
      totalEarned: completed.reduce((sum, p) => sum + p.netPayout, 0),
      escrowLocked: escrowHeld.reduce((sum, p) => sum + p.netPayout, 0),
      activeContracts: 4,
      reputationRating: 4.95
    }
  });
});
