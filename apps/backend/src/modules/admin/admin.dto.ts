/**
 * @file admin.dto.ts
 * @description
 * Data Transfer Objects (DTOs), query filters, and interface contracts
 * for the Super Admin vertical. Enforces strict type constraints across all API layers.
 */

export interface PlatformKPIsDTO {
  grossMerchandiseVolume: number;
  platformRevenue: number;
  activeTasks: number;
  totalUsers: number;
  pendingDisputes: number;
  escrowHeld: number;
}

export interface RevenuePointDTO {
  date: string;
  gmv: number;
  rake: number;
}

export interface CategoryDemandDTO {
  category: string;
  activeContracts: number;
  totalVolume: number;
  avgBudget: number;
  growthRate: string;
}

export interface AnalyticsResponseDTO {
  timeRange: '7d' | '30d' | '90d' | 'ytd';
  kpis: PlatformKPIsDTO;
  velocity: RevenuePointDTO[];
  categories: CategoryDemandDTO[];
}

export interface UserQueryFiltersDTO {
  role?: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface UserStatusUpdateDTO {
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  reason: string;
}

export interface InviteAdminStaffDTO {
  email: string;
  role: 'OWNER' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';
  permissions: string[];
}

export interface SettleDisputeDTO {
  settlementType: 'FULL_REFUND' | 'FULL_RELEASE' | 'SPLIT';
  splitClientPercent?: number;
  splitFreelancerPercent?: number;
  resolutionNotes: string;
}

export interface EscrowOverrideDTO {
  action: 'RELEASE' | 'REFUND';
  auditReason: string;
}

export interface ModerateReviewDTO {
  status: 'APPROVED' | 'HIDDEN' | 'FLAGGED';
  moderatorNotes?: string;
}

export interface UpdatePlatformSettingsDTO {
  platformRakePercentage: number;
  minimumGigBudget: number;
  escrowHoldingDays: number;
  maxFileUploadMb: number;
  isMaintenanceMode: boolean;
  allowedCategories: string[];
}
