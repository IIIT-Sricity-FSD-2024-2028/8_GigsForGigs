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

// Master Directories
adminRouter.get('/clients', (req, res) => adminController.getClients(req, res));
adminRouter.patch('/clients/:id/kyc', (req, res) => adminController.verifyClientKYC(req, res));

adminRouter.get('/gig-pros', (req, res) => adminController.getGigPros(req, res));
adminRouter.patch('/gig-pros/:id/badge', (req, res) => adminController.updateGigProBadge(req, res));

adminRouter.get('/managers', (req, res) => adminController.getManagers(req, res));

adminRouter.get('/projects', (req, res) => adminController.getProjects(req, res));
adminRouter.patch('/projects/:id/status', (req, res) => adminController.overrideProjectStatus(req, res));

adminRouter.get('/payments', (req, res) => adminController.getPayments(req, res));
adminRouter.get('/reviews', (req, res) => adminController.getReviews(req, res));
adminRouter.get('/disputes', (req, res) => adminController.getDisputes(req, res));
adminRouter.get('/admin-staff', (req, res) => adminController.getAdminStaff(req, res));

// User Governance & Moderation
adminRouter.patch('/users/:id/status', (req, res) => adminController.updateUserStatus(req, res));

// Staff & Cryptographic Delegated Provisioning
adminRouter.post('/invitations', (req, res) => adminController.inviteAdminStaff(req, res));
adminRouter.post('/invitations/accept', (req, res) => adminController.acceptAdminInvitation(req, res));
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
