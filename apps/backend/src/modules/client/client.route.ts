import { Router, type Request, type Response } from 'express';
import { db } from '../../db/dbClient';

export const clientRouter = Router();

// Get Client Tasks
clientRouter.get('/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.tasks });
});

// Create Task
clientRouter.post('/tasks', (req: Request, res: Response) => {
  const { title, description, budget, category, dueDate } = req.body;
  const newTask = {
    id: `tsk-${Date.now()}`,
    title: title || 'Untitled Project',
    clientName: 'TechStart Labs',
    clientId: 'cli-01',
    budget: Number(budget) || 1000,
    status: 'OPEN' as const,
    category: category || 'Software Development',
    deliverablesCount: 3,
    submittedDeliverables: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    dueDate: dueDate || '2026-10-01'
  };
  db.tasks.unshift(newTask);
  res.status(201).json({ success: true, data: newTask });
});

// Get Client Spend
clientRouter.get('/total-spent', (_req: Request, res: Response) => {
  const total = db.payments.reduce((sum, p) => sum + p.grossAmount, 0);
  res.json({ success: true, data: { totalSpent: total, currency: 'USD' } });
});

// Search Talent
clientRouter.get('/talent', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.gigPros });
});
