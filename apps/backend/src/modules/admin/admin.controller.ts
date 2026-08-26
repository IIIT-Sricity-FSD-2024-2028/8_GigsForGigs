import type { Request, Response } from 'express';
import { adminService, type AdminActor } from './admin.service';

/**
 * @file admin.controller.ts
 * @description
 * HTTP Request Handlers for Super Admin APIs.
 * Validates request payloads, extracts admin actor metadata, and formats standardized JSON responses.
 */

function extractAdminActor(req: Request): AdminActor {
  return {
    id: (req as any).user?.userId || 'adm-owner-01',
    name: (req as any).user?.name || 'Chaitanya Anand',
    email: (req as any).user?.email || 'chaitanya.admin@gigsforgigs.internal',
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  };
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

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
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
      const actor = extractAdminActor(req);
      const result = await adminService.inviteAdminStaff(req.body, actor);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Failed to generate admin invitation', error: error?.message });
    }
  }

  async revokeAdminSession(req: Request, res: Response): Promise<void> {
    try {
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
