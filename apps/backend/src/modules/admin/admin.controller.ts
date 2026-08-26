import type { Request, Response } from 'express';
import { adminService, type AdminActor } from './admin.service';
import { db } from '../../db/dbClient';

/**
 * @file admin.controller.ts
 * @description
 * HTTP Request Handlers for Super Admin APIs with granular RBAC permission enforcement.
 * Blocks Read-Only Auditors and non-privileged delegate admins from mutating database state.
 */

function extractAdminActor(req: Request): AdminActor {
  const emailHeader = (req.headers['x-admin-email'] as string) || (req as any).user?.email;
  const staff = emailHeader ? db.adminStaff.find((s) => s.email.toLowerCase() === emailHeader.toLowerCase()) : null;

  return {
    id: staff?.id || (req as any).user?.userId || 'adm-owner-01',
    name: staff?.name || (req as any).user?.name || 'Chaitanya Anand',
    email: staff?.email || (req as any).user?.email || 'chaitanya.admin@gigsforgigs.internal',
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  };
}

function checkAdminPermission(req: Request, res: Response, requiredPerm: string): boolean {
  const actor = extractAdminActor(req);
  const staff = db.adminStaff.find((s) => s.email.toLowerCase() === actor.email.toLowerCase());

  if (staff?.role === 'AUDITOR') {
    res.status(403).json({
      success: false,
      message: 'Access Denied: Auditors have read-only compliance permissions and cannot execute platform mutations.'
    });
    return false;
  }

  if (staff && !staff.permissions.includes('*') && !staff.permissions.includes(requiredPerm)) {
    res.status(403).json({
      success: false,
      message: `Access Denied: Missing required administrative permission (${requiredPerm}).`
    });
    return false;
  }

  return true;
}

export class AdminController {
  async getKPIs(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getKPIs();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to compute platform KPIs', error: error?.message });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as any) || '30d';
      const data = await adminService.getAnalytics(timeRange);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve analytics', error: error?.message });
    }
  }

  async getClients(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getClients();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch clients', error: error?.message });
    }
  }

  async verifyClientKYC(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'users:ban')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const data = await adminService.verifyClientKYC(id, actor);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to verify client KYC', error: error?.message });
    }
  }

  async getGigPros(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getGigPros();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch gig professionals', error: error?.message });
    }
  }

  async updateGigProBadge(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'users:ban')) return;
      const id = String(req.params.id || '');
      const badge = req.body.badge;
      const actor = extractAdminActor(req);
      const data = await adminService.updateGigProBadge(id, badge, actor);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to update freelancer badge', error: error?.message });
    }
  }

  async getManagers(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getManagers();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch managers', error: error?.message });
    }
  }

  async getProjects(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getProjects();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error?.message });
    }
  }

  async overrideProjectStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'disputes:resolve')) return;
      const id = String(req.params.id || '');
      const status = req.body.status;
      const actor = extractAdminActor(req);
      const data = await adminService.overrideProjectStatus(id, status, actor);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to override project status', error: error?.message });
    }
  }

  async getPayments(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getPayments();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error?.message });
    }
  }

  async getReviews(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getReviews();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error?.message });
    }
  }

  async getDisputes(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getDisputes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch disputes', error: error?.message });
    }
  }

  async getAdminStaff(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getAdminStaff();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch admin staff', error: error?.message });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'users:ban')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const result = await adminService.updateUserStatus(id, req.body, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to update user status', error: error?.message });
    }
  }

  async inviteAdminStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'admins:invite')) return;
      const actor = extractAdminActor(req);
      const result = await adminService.inviteAdminStaff(req.body, actor);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to generate admin invitation', error: error?.message });
    }
  }

  async acceptAdminInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { token, email, password } = req.body;
      const result = await adminService.acceptAdminInvitation(token, email, password);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error?.message || 'Failed to accept invitation' });
    }
  }

  async revokeAdminSession(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'admins:invite')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const result = await adminService.revokeAdminSession(id, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to revoke admin session', error: error?.message });
    }
  }

  async settleDispute(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'disputes:resolve')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const result = await adminService.settleDispute(id, req.body, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to arbitrate dispute', error: error?.message });
    }
  }

  async overrideEscrow(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'payments:release')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const result = await adminService.overrideEscrow(id, req.body, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to override escrow', error: error?.message });
    }
  }

  async moderateReview(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'reviews:moderate')) return;
      const id = String(req.params.id || '');
      const actor = extractAdminActor(req);
      const result = await adminService.moderateReview(id, req.body, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to moderate review', error: error?.message });
    }
  }

  async getPlatformSettings(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getPlatformSettings();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch platform settings', error: error?.message });
    }
  }

  async updatePlatformSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!checkAdminPermission(req, res, 'settings:manage')) return;
      const actor = extractAdminActor(req);
      const result = await adminService.updatePlatformSettings(req.body, actor);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to update platform settings', error: error?.message });
    }
  }

  async getAuditLogs(_req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getAuditLogs();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error?.message });
    }
  }
}

export const adminController = new AdminController();
