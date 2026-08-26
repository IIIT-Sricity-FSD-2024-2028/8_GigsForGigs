import { Router } from 'express';
import { adminController } from './admin.controller';

/**
 * @file admin.route.ts
 * @description
 * Express router mounting all administrative endpoints under /api/admin.
 */

export const adminRouter = Router();

// KPIs & Analytics
adminRouter.get('/kpis', (req, res) => adminController.getKPIs(req, res));
adminRouter.get('/analytics', (req, res) => adminController.getAnalytics(req, res));

// User Governance & Moderation
adminRouter.patch('/users/:id/status', (req, res) => adminController.updateUserStatus(req, res));

// Staff & Delegated Provisioning
adminRouter.post('/invitations', (req, res) => adminController.inviteAdminStaff(req, res));
adminRouter.post('/sessions/:id/revoke', (req, res) => adminController.revokeAdminSession(req, res));

// Arbitration Court & Dispute Settlements
adminRouter.post('/disputes/:id/settle', (req, res) => adminController.settleDispute(req, res));

// Financial Escrow Overrides
adminRouter.patch('/payments/:id/override', (req, res) => adminController.overrideEscrow(req, res));

// Review & Reputation Moderation
adminRouter.patch('/reviews/:id/moderate', (req, res) => adminController.moderateReview(req, res));

// Platform Economics & Global Settings
adminRouter.get('/settings', (req, res) => adminController.getPlatformSettings(req, res));
adminRouter.put('/settings', (req, res) => adminController.updatePlatformSettings(req, res));

// Immutable Security Audit Trail
adminRouter.get('/audit-logs', (req, res) => adminController.getAuditLogs(req, res));
