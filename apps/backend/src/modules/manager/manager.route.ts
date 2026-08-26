import { Router, type Request, type Response } from 'express';
import { db } from '../../db/dbClient';

export const managerRouter = Router();

// Manager Dashboard Summary
managerRouter.get('/dashboard', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      activeTasks: db.tasks.filter((t) => t.status === 'IN_PROGRESS'),
      reviewDeliverables: db.tasks.filter((t) => t.status === 'REVIEWING'),
      assignedFreelancers: db.gigPros.length,
      managedVolume: db.payments.reduce((sum, p) => sum + p.grossAmount, 0)
    }
  });
});

// Manager Task Oversight
managerRouter.get('/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.tasks });
});

// Search Talent
managerRouter.get('/talent', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.gigPros });
});
