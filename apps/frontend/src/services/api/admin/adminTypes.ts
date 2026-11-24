/**
 * @file adminTypes.ts
 * @description Canonical request/response contracts for the Super Admin API repository.
 */

export interface AdminKPIs {
  grossMerchandiseVolume: number;
  platformRevenue: number;
  activeTasks: number;
  totalUsers: number;
  pendingDisputes: number;
  escrowHeld: number;
  kycVerificationRate: number | null;
  avgPlatformRating?: number | null;
}

export interface CategoryDemand {
  category: string;
  contracts: number;
  totalVolume: number;
  avgContractValue: number;
  marketShare: number;
}

export interface VelocityPoint {
  date: string;
  gmv: number;
  rake: number;
}

export interface AdminAnalyticsData {
  timeRange: string;
  grossVolume: number;
  platformRake: number;
  avgContractValue: number | null;
  repeatClientRate: number | null;
  velocity: VelocityPoint[];
  peak: { date: string; gmv: number } | null;
  categories: CategoryDemand[];
}

export interface AdminUserProfile {
  userId: number;
  name: string;
  email: string;
  adminTier: string;
  permissions: string[];
  isTwoFactorEnabled: boolean;
  status: string;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | string;
  createdAt: string;
  profileSummary: string;
}

export interface ClientManagerSummary {
  managerId: number;
  name: string;
  email: string;
  status: string;
}

export interface ClientDetail {
  id: string;
  clientId?: number | string;
  userId?: string;
  name: string;
  companyName: string;
  email: string;
  domain: string | null;
  totalSpent: number;
  activeGigsCount: number;
  completedGigsCount?: number;
  assignedManagersCount: number;
  isVerified: boolean;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
  managers: ClientManagerSummary[];
}

export interface GigProDetail {
  id: string;
  gigProfileId?: number;
  gigProId?: string;
  userId?: string;
  name: string;
  email?: string;
  headline: string | null;
  skills: string[];
  tools?: string[];
  totalEarnings: number;
  completedJobs: number;
  rating: number | null;
  reviewCount: number;
  portfolioUrls: string[];
  badge: 'NONE' | 'VERIFIED_PRO' | 'TOP_RATED' | string;
  status: 'ACTIVE' | 'SUSPENDED';
  portfolioCount: number;
}

export interface ManagerDetail {
  id: string;
  managerId?: number | string;
  userId?: string;
  name: string;
  email: string;
  clientId?: number;
  clientName?: string;
  linkedClients: string[];
  activeSupervisedTasks: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
}

export interface ProjectTask {
  id: string;
  taskId?: number | string;
  title: string;
  description?: string | null;
  clientId?: string;
  clientName: string;
  gigProId?: string | null;
  gigProName?: string | null;
  managerName?: string | null;
  category: string | null;
  budget: number;
  platformFee: number | null;
  escrowStatus: string | null;
  deliverablesCount: number;
  deliverablesApproved: number;
  applicationsCount: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ModerationReview {
  id: string;
  reviewId?: number | string;
  taskId: string;
  taskTitle: string;
  reviewerName: string;
  reviewerRole: 'CLIENT' | 'GIG_PROFESSIONAL' | string;
  targetUserName: string;
  rating: number;
  comment: string | null;
  moderatorNotes: string | null;
  status: 'PUBLISHED' | 'FLAGGED' | 'HIDDEN' | string;
  createdAt: string;
}

export interface DisputeCase {
  id: string;
  disputeId?: number | string;
  taskId: string;
  taskTitle: string;
  filedByName: string;
  filedByRole: 'CLIENT' | 'GIG_PROFESSIONAL' | string;
  againstName: string;
  disputeAmount: number;
  escrowHeld: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  slaHoursLeft: number | null;
  resolutionNotes: string | null;
  settlementType: string | null;
  splitPercent: number | null;
  createdAt: string;
}

export interface DisputeSettlementOutcome {
  success?: boolean;
  disputeId?: string;
  status?: string;
  settlementType?: string;
  refundToClient: number;
  payoutToPro: number;
  platformFee: number;
}

export interface AdminStaff {
  id: string;
  userId?: number | string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isTwoFactorEnabled: boolean;
  createdAt?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface AdminInviteResult {
  email: string;
  role: string;
  assignedPassword: string;
  inviteLink: string;
  token: string;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  auditId?: number;
  adminEmail: string;
  actorEmail?: string;
  action: string;
  target: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformSettingsData {
  commissionRakePercent: number;
  minimumTaskBudget: number;
  maxEscrowThreshold: number;
  maintenanceMode: boolean;
  allowedCategories: string[];
}
