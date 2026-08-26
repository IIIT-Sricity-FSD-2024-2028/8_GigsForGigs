import { Router, type Request, type Response } from 'express';
import { db } from '../../db/dbClient';

export const authRouter = Router();

// Multi-role Login Handler
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  const targetEmail = (email || '').toLowerCase().trim();

  let user = db.users.find((u) => u.email.toLowerCase() === targetEmail);

  if (!user) {
    const roleNormalized = (role || 'CLIENT').toUpperCase();
    user = {
      id: `usr-${Date.now()}`,
      name: targetEmail.split('@')[0] || 'User',
      email: targetEmail || 'user@gigsforgigs.com',
      role: roleNormalized as any,
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().slice(0, 10),
      tokenVersion: 1
    };
    db.users.push(user);
  }

  res.json({
    success: true,
    data: {
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: `jwt-token-gfg-${Date.now()}`
    }
  });
});

// Current User Profile Endpoint
authRouter.get('/me', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      userId: 'usr-01',
      name: 'Chaitanya Anand',
      email: 'chaitanya.admin@gigsforgigs.internal',
      role: 'SUPER_ADMIN'
    }
  });
});
