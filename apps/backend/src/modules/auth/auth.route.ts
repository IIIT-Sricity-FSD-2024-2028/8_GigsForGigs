import { Router, type Request, type Response } from 'express';
import { db } from '../../db/dbClient';

export const authRouter = Router();

// Multi-role Login Handler with Admin Tier & Permissions Resolution
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

  // Resolve delegated admin tier & permissions from db.adminStaff
  const staff = db.adminStaff.find((s) => s.email.toLowerCase() === targetEmail);
  const adminTier = staff ? staff.role : (user.role === 'SUPER_ADMIN' ? 'OWNER' : undefined);
  const permissions = staff ? staff.permissions : (user.role === 'SUPER_ADMIN' ? ['*'] : []);

  res.json({
    success: true,
    data: {
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminTier,
        permissions
      },
      token: `jwt-token-gfg-${Date.now()}`
    }
  });
});

// Current User Profile Endpoint
authRouter.get('/me', (req: Request, res: Response) => {
  const email = (req.query.email as string) || 'chaitanya.admin@gigsforgigs.internal';
  const staff = db.adminStaff.find((s) => s.email.toLowerCase() === email.toLowerCase());

  res.json({
    success: true,
    data: {
      userId: 'usr-01',
      name: staff?.name || 'Chaitanya Anand',
      email: staff?.email || 'chaitanya.admin@gigsforgigs.internal',
      role: 'SUPER_ADMIN',
      adminTier: staff?.role || 'OWNER',
      permissions: staff?.permissions || ['*']
    }
  });
});
