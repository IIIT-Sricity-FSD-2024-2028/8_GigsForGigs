/**
 * @file adminAccess.ts
 * @description Shared RBAC view access rules and error message extraction helpers.
 */

import type { AdminTier } from '../store/auth/authSlice';

/**
 * Views allowed for restricted admin tiers.
 * OWNER and SUPER_ADMIN have unrestricted access; AUDITOR can view everything except settings.
 */
export const TIER_ALLOWED_VIEWS: Partial<Record<AdminTier, readonly string[]>> = {
  FINANCIAL_ADMIN: ['dashboard', 'analytics', 'payments', 'projects', 'profile'],
  SUPPORT_ADMIN: ['dashboard', 'disputes', 'reviews', 'clients', 'gig-pros', 'projects', 'profile'],
  CONTENT_MODERATOR: ['reviews', 'gig-pros', 'clients', 'projects', 'profile'],
};

export function canAccessAdminView(tier: AdminTier | undefined, viewId: string): boolean {
  const effectiveTier: AdminTier = tier || 'AUDITOR';
  if (effectiveTier === 'OWNER' || effectiveTier === 'SUPER_ADMIN') {
    return true;
  }
  if (effectiveTier === 'AUDITOR') {
    return viewId !== 'settings';
  }
  const allowed = TIER_ALLOWED_VIEWS[effectiveTier];
  return allowed ? allowed.includes(viewId) : false;
}

export function defaultAdminViewFor(tier: AdminTier | undefined): string {
  return tier === 'CONTENT_MODERATOR' ? 'reviews' : 'dashboard';
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err;
  if (err instanceof Error && err.message.trim()) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
